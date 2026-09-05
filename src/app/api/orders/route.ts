import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CartItemInput = {
  id: string;
  quantity: number;
};

function getInventoryStatus(quantity: number) {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= 5) return "LOW_STOCK";
  return "IN_STOCK";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customerName = String(
      body.customerName ?? ""
    ).trim();

    const customerMobile = String(
      body.customerMobile ?? ""
    ).trim();

    const customerEmail = body.customerEmail
      ? String(body.customerEmail).trim()
      : null;

    const shipping = body.shipping ?? {};

    const items = Array.isArray(body.items)
      ? (body.items as CartItemInput[])
      : [];

    if (!customerName || !customerMobile) {
      return NextResponse.json(
        {
          error:
            "Customer name and mobile are required.",
        },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 }
      );
    }

    // Clean cart input.
    const cleanInput = items
      .map((item) => ({
        id: String(item.id).trim(),
        quantity: Math.max(
          1,
          Number(item.quantity) || 1
        ),
      }))
      .filter((item) => item.id);

    if (!cleanInput.length) {
      return NextResponse.json(
        { error: "Invalid cart items." },
        { status: 400 }
      );
    }

    // Prevent duplicate variant lines.
    const quantityMap = new Map<string, number>();

    for (const item of cleanInput) {
      quantityMap.set(
        item.id,
        (quantityMap.get(item.id) || 0) +
          item.quantity
      );
    }

    const finalItems = Array.from(
      quantityMap.entries()
    ).map(([id, quantity]) => ({
      id,
      quantity,
    }));

    const order = await prisma.$transaction(
      async (tx) => {
        // Fetch the actual variants from PostgreSQL.
        const variants =
          await tx.productVariant.findMany({
            where: {
              id: {
                in: finalItems.map(
                  (item) => item.id
                ),
              },
            },
            include: {
              product: {
                include: {
                  brand: true,
                },
              },
              packSize: true,
              inventory: true,
            },
          });

        if (
          variants.length !==
          finalItems.length
        ) {
          throw new Error(
            "PRODUCT_NOT_AVAILABLE"
          );
        }

        const variantMap = new Map(
          variants.map((variant) => [
            variant.id,
            variant,
          ])
        );

        let total = 0;

        const cleanItems = [];

        // First validate prices and stock.
        for (const item of finalItems) {
          const variant =
            variantMap.get(item.id);

          if (!variant) {
            throw new Error(
              "PRODUCT_NOT_AVAILABLE"
            );
          }

          const stock =
            variant.inventory?.quantity ?? 0;

          if (stock < item.quantity) {
            throw new Error(
              `INSUFFICIENT_STOCK:${variant.product.name}|${variant.packSize.label}|${stock}`
            );
          }

          const unitPrice = Number(
            variant.price
          );

          if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
          ) {
            throw new Error(
              "INVALID_PRODUCT_PRICE"
            );
          }

          total +=
            unitPrice * item.quantity;

          cleanItems.push({
            variantId: variant.id,
            productName:
              variant.product.name,
            brandName:
              variant.product.brand.name,
            packSizeLabel:
              variant.packSize.label,
            unitPrice,
            quantity: item.quantity,
          });
        }

        // Deduct stock atomically.
        for (const item of finalItems) {
          const variant =
            variantMap.get(item.id);

          if (!variant) {
            throw new Error(
              "PRODUCT_NOT_AVAILABLE"
            );
          }

          const result =
            await tx.inventory.updateMany({
              where: {
                variantId: item.id,
                quantity: {
                  gte: item.quantity,
                },
              },
              data: {
                quantity: {
                  decrement:
                    item.quantity,
                },
              },
            });

          // If another order consumed the stock
          // at the same time, this order fails.
          if (result.count !== 1) {
            throw new Error(
              `INSUFFICIENT_STOCK:${variant.product.name}|${variant.packSize.label}|0`
            );
          }

          const updatedInventory =
            await tx.inventory.findUnique({
              where: {
                variantId: item.id,
              },
            });

          if (updatedInventory) {
            await tx.inventory.update({
              where: {
                variantId: item.id,
              },
              data: {
                status:
                  getInventoryStatus(
                    updatedInventory.quantity
                  ),
              },
            });
          }
        }

        const orderNumber =
          `BCH-${Date.now()
            .toString()
            .slice(-8)}`;

        return await tx.order.create({
          data: {
            orderNumber,
            status: "PENDING",
            total,

            customerName,
            customerMobile,
            customerEmail,

            shippingAddress1:
              String(
                shipping.line1 ?? ""
              ).trim() || null,

            shippingAddress2:
              String(
                shipping.line2 ?? ""
              ).trim() || null,

            shippingCity:
              String(
                shipping.city ?? ""
              ).trim() || null,

            shippingState:
              String(
                shipping.state ?? ""
              ).trim() || null,

            shippingPincode:
              String(
                shipping.pincode ?? ""
              ).trim() || null,

            items: {
              create: cleanItems,
            },
          },

          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
          },
        });
      }
    );

    return NextResponse.json({
      order: {
        ...order,
        total:
          order.total.toString(),
      },
    });
  } catch (error) {
    console.error(
      "POST /api/orders",
      error
    );

    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "PRODUCT_NOT_AVAILABLE"
      ) {
        return NextResponse.json(
          {
            error:
              "One or more products are no longer available.",
          },
          { status: 400 }
        );
      }

      if (
        error.message ===
        "INVALID_PRODUCT_PRICE"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid product price.",
          },
          { status: 400 }
        );
      }

      if (
        error.message.startsWith(
          "INSUFFICIENT_STOCK:"
        )
      ) {
        const parts =
          error.message.split(":")[1]
            ?.split("|") ?? [];

        const productName =
          parts[0] ||
          "This product";

        const packSize =
          parts[1] || "";

        const stock =
          parts[2] || "0";

        return NextResponse.json(
          {
            error: `${productName} (${packSize}) has only ${stock} item(s) in stock.`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Unable to create order.",
      },
      { status: 500 }
    );
  }
}