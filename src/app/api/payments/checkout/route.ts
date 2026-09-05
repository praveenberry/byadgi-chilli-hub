import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  RETAILER_COOKIE,
  verifyRetailerSession,
} from "@/lib/retailer-auth";

type CartItemInput = {
  id: string;
  quantity: number;
};

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
) {
  const generated = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(generated, "hex");
  const b = Buffer.from(signature, "hex");

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
}

/*
 * Returns the User.id of an approved B2B retailer.
 */
async function getApprovedRetailerUserId() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(RETAILER_COOKIE)?.value;

  const userId =
    verifyRetailerSession(token);

  if (!userId) {
    return null;
  }

  const retailer =
    await prisma.retailer.findUnique({
      where: {
        userId,
      },
      select: {
        isApproved: true,
      },
    });

  if (!retailer?.isApproved) {
    return null;
  }

  return userId;
}

function cleanCartItems(
  items: CartItemInput[]
) {
  return items
    .map((item) => ({
      id: String(item.id),
      quantity: Math.max(
        1,
        Number(item.quantity) || 1
      ),
    }))
    .filter((item) => item.id);
}

/*
 * Courier charge.
 *
 * For now the default is ₹0.
 *
 * Later we can make this configurable
 * from the admin panel.
 */
function getCourierCharge(
  body: Record<string, unknown>
) {
  const requested =
    Number(body.courierCharge ?? 0);

  if (
    !Number.isFinite(requested) ||
    requested < 0
  ) {
    return 0;
  }

  /*
   * Prevent the browser from sending
   * an unreasonable courier amount.
   *
   * Maximum allowed for now: ₹10,000.
   */
  return Math.min(
    Math.round(requested * 100) / 100,
    10000
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const action = String(
      body.action ?? "create"
    );

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          error:
            "Razorpay is not configured.",
        },
        { status: 500 }
      );
    }

    /*
     * Approved B2B retailer.
     */
    const retailerUserId =
      await getApprovedRetailerUserId();

    const b2bRetailer =
      retailerUserId !== null;

    /*
     * =====================================================
     * STEP 1: CREATE RAZORPAY ORDER
     * =====================================================
     */
    if (action === "create") {
      const items =
        Array.isArray(body.items)
          ? (body.items as CartItemInput[])
          : [];

      if (!items.length) {
        return NextResponse.json(
          {
            error:
              "Your cart is empty.",
          },
          { status: 400 }
        );
      }

      const cleanInput =
        cleanCartItems(items);

      const variants =
        await prisma.productVariant.findMany(
          {
            where: {
              id: {
                in: cleanInput.map(
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
          }
        );

      if (
        variants.length !==
        cleanInput.length
      ) {
        return NextResponse.json(
          {
            error:
              "One or more products are no longer available.",
          },
          { status: 400 }
        );
      }

      const variantMap =
        new Map(
          variants.map(
            (variant) => [
              variant.id,
              variant,
            ]
          )
        );

      let total = 0;

      for (const item of cleanInput) {
        const variant =
          variantMap.get(item.id);

        if (!variant) {
          return NextResponse.json(
            {
              error:
                "One or more products are no longer available.",
            },
            { status: 400 }
          );
        }

        const stock =
          variant.inventory
            ?.quantity ?? 0;

        if (
          stock <
          item.quantity
        ) {
          return NextResponse.json(
            {
              error:
                `${variant.product.name} (${variant.packSize.label}) has only ${stock} item(s) in stock.`,
            },
            { status: 400 }
          );
        }

        /*
         * Approved B2B:
         * use specialPrice when available.
         */
        const retailPrice =
          Number(
            variant.price
          );

        const unitPrice =
          b2bRetailer &&
          variant.specialPrice !==
            null
            ? Number(
                variant.specialPrice
              )
            : retailPrice;

        total +=
          unitPrice *
          item.quantity;
      }

      /*
       * Courier charge.
       */
      const courierCharge =
        getCourierCharge(body);

      /*
       * Final amount.
       */
      const grandTotal =
        Math.round(
          (total +
            courierCharge) *
            100
        ) / 100;

      if (
        !Number.isFinite(
          grandTotal
        ) ||
        grandTotal <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid order total.",
          },
          { status: 400 }
        );
      }

      const razorpay =
        new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

      const razorpayOrder =
        await razorpay.orders.create(
          {
            amount:
              Math.round(
                grandTotal * 100
              ),

            currency: "INR",

            receipt:
              `BCH-${Date.now()
                .toString()
                .slice(-8)}`,
          }
        );

      return NextResponse.json({
        keyId,

        orderId:
          razorpayOrder.id,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency,

        total,

        courierCharge,

        grandTotal,
      });
    }

    /*
     * =====================================================
     * STEP 2: VERIFY PAYMENT + CREATE DATABASE ORDER
     * =====================================================
     */
    if (action === "verify") {
      const razorpayOrderId =
        String(
          body.razorpay_order_id ??
            ""
        ).trim();

      const razorpayPaymentId =
        String(
          body.razorpay_payment_id ??
            ""
        ).trim();

      const razorpaySignature =
        String(
          body.razorpay_signature ??
            ""
        ).trim();

      const customerName =
        String(
          body.customerName ??
            ""
        ).trim();

      const customerMobile =
        String(
          body.customerMobile ??
            ""
        ).trim();

      const customerEmail =
        body.customerEmail
          ? String(
              body.customerEmail
            ).trim()
          : null;

      const shipping =
        body.shipping ?? {};

      const items =
        Array.isArray(body.items)
          ? (body.items as CartItemInput[])
          : [];

      if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return NextResponse.json(
          {
            error:
              "Payment verification details are missing.",
          },
          { status: 400 }
        );
      }

      if (
        !customerName ||
        !customerMobile
      ) {
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
          {
            error:
              "Your cart is empty.",
          },
          { status: 400 }
        );
      }

      /*
       * Verify Razorpay signature.
       */
      const valid =
        verifySignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          keySecret
        );

      if (!valid) {
        return NextResponse.json(
          {
            error:
              "Payment verification failed.",
          },
          { status: 400 }
        );
      }

      /*
       * Fetch products again.
       */
      const cleanInput =
        cleanCartItems(items);

      const variants =
        await prisma.productVariant.findMany(
          {
            where: {
              id: {
                in: cleanInput.map(
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
          }
        );

      if (
        variants.length !==
        cleanInput.length
      ) {
        return NextResponse.json(
          {
            error:
              "One or more products are no longer available.",
          },
          { status: 400 }
        );
      }

      const variantMap =
        new Map(
          variants.map(
            (variant) => [
              variant.id,
              variant,
            ]
          )
        );

      let total = 0;

      const orderItems: Array<{
        variantId: string;
        productName: string;
        brandName: string;
        packSizeLabel: string;
        unitPrice: number;
        quantity: number;
      }> = [];

      for (const item of cleanInput) {
        const variant =
          variantMap.get(item.id);

        if (!variant) {
          return NextResponse.json(
            {
              error:
                "Product is no longer available.",
            },
            { status: 400 }
          );
        }

        const stock =
          variant.inventory
            ?.quantity ?? 0;

        if (
          stock <
          item.quantity
        ) {
          return NextResponse.json(
            {
              error:
                `${variant.product.name} (${variant.packSize.label}) has only ${stock} item(s) in stock.`,
            },
            { status: 400 }
          );
        }

        const retailPrice =
          Number(
            variant.price
          );

        const unitPrice =
          b2bRetailer &&
          variant.specialPrice !==
            null
            ? Number(
                variant.specialPrice
              )
            : retailPrice;

        total +=
          unitPrice *
          item.quantity;

        orderItems.push({
          variantId:
            variant.id,

          productName:
            variant.product.name,

          brandName:
            variant.product
              .brand.name,

          packSizeLabel:
            variant.packSize
              .label,

          unitPrice,

          quantity:
            item.quantity,
        });
      }

      /*
       * Courier charge must be
       * calculated again on server.
       */
      const courierCharge =
        getCourierCharge(body);

      const grandTotal =
        Math.round(
          (total +
            courierCharge) *
            100
        ) / 100;

      if (
        !Number.isFinite(
          grandTotal
        ) ||
        grandTotal <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid order total.",
          },
          { status: 400 }
        );
      }

      /*
       * Verify Razorpay amount.
       */
      const razorpay =
        new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

      const razorpayOrder =
        await razorpay.orders.fetch(
          razorpayOrderId
        );

      const expectedAmount =
        Math.round(
          grandTotal * 100
        );

      if (
        Number(
          razorpayOrder.amount
        ) !== expectedAmount
      ) {
        return NextResponse.json(
          {
            error:
              "Payment amount does not match the current order total. Please try again.",
          },
          { status: 400 }
        );
      }

      const orderNumber =
        `BCH-${Date.now()
          .toString()
          .slice(-8)}`;

      /*
       * Create order, payment and
       * stock update in ONE transaction.
       */
      const order =
        await prisma.$transaction(
          async (tx) => {

            /*
             * Re-check and deduct stock.
             */
            for (const item of orderItems) {
              const inventory =
                await tx.inventory.findUnique(
                  {
                    where: {
                      variantId:
                        item.variantId,
                    },
                  }
                );

              if (!inventory) {
                throw new Error(
                  `Inventory not found for ${item.productName} (${item.packSizeLabel}).`
                );
              }

              if (
                inventory.quantity <
                item.quantity
              ) {
                throw new Error(
                  `${item.productName} (${item.packSizeLabel}) is no longer available in the requested quantity.`
                );
              }

              const newQuantity =
                inventory.quantity -
                item.quantity;

              const newStatus =
                newQuantity <= 0
                  ? "OUT_OF_STOCK"
                  : newQuantity <= 5
                    ? "LOW_STOCK"
                    : "IN_STOCK";

              await tx.inventory.update(
                {
                  where: {
                    variantId:
                      item.variantId,
                  },

                  data: {
                    quantity:
                      newQuantity,

                    status:
                      newStatus,
                  },
                }
              );
            }

            /*
             * Create order.
             */
            const createdOrder =
              await tx.order.create(
                {
                  data: {
                    orderNumber,

                    status:
                      "CONFIRMED",

                    total,

                    courierCharge,

                    grandTotal,

                    userId:
                      retailerUserId,

                    customerName,

                    customerMobile,

                    customerEmail,

                    shippingAddress1:
                      String(
                        shipping.line1 ??
                          ""
                      ).trim() ||
                      null,

                    shippingAddress2:
                      String(
                        shipping.line2 ??
                          ""
                      ).trim() ||
                      null,

                    shippingCity:
                      String(
                        shipping.city ??
                          ""
                      ).trim() ||
                      null,

                    shippingState:
                      String(
                        shipping.state ??
                          ""
                      ).trim() ||
                      null,

                    shippingPincode:
                      String(
                        shipping.pincode ??
                          ""
                      ).trim() ||
                      null,

                    items: {
                      create:
                        orderItems,
                    },
                  },

                  select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                    courierCharge: true,
                    grandTotal: true,
                    status: true,
                    userId: true,
                  },
                }
              );

            /*
             * Save successful Razorpay payment.
             *
             * Payment amount = final amount
             * including courier charge.
             */
            await tx.payment.create(
              {
                data: {
                  orderId:
                    createdOrder.id,

                  provider:
                    "RAZORPAY",

                  status:
                    "PAID",

                  amount:
                    grandTotal,

                  reference:
                    razorpayPaymentId,
                },
              }
            );

            return createdOrder;
          }
        );

      return NextResponse.json({
        order: {
          ...order,

          total:
            order.total.toString(),

          courierCharge:
            order.courierCharge.toString(),

          grandTotal:
            order.grandTotal.toString(),
        },
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid payment action.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "POST /api/payments/checkout",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process payment.",
      },
      { status: 500 }
    );
  }
}