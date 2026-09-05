import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  return verifyAdminSession(token);
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const [
      products,
      brands,
      categories,
      packSizes,
    ] = await Promise.all([
      prisma.product.findMany({
        include: {
          brand: true,
          category: true,
          variants: {
            include: {
              packSize: true,
              inventory: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.brand.findMany({
        orderBy: {
          name: "asc",
        },
      }),

      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      }),

      prisma.packSize.findMany({
        orderBy: {
          grams: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      products,
      brands,
      categories,
      packSizes,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/products",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load products.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = String(
      body.name ?? ""
    ).trim();

    const brandId = String(
      body.brandId ?? ""
    );

    const categoryId = String(
      body.categoryId ?? ""
    );

    const description =
      String(
        body.description ?? ""
      ).trim() || null;

    const imageUrl =
      String(
        body.imageUrl ?? ""
      ).trim() || null;

    const variants = Array.isArray(
      body.variants
    )
      ? body.variants
      : [];

    if (
      !name ||
      !brandId ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          error:
            "Product name, brand and category are required.",
        },
        { status: 400 }
      );
    }

    if (!variants.length) {
      return NextResponse.json(
        {
          error:
            "Add at least one pack size.",
        },
        { status: 400 }
      );
    }

    const brand =
      await prisma.brand.findUnique({
        where: {
          id: brandId,
        },
      });

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!brand || !category) {
      return NextResponse.json(
        {
          error:
            "Invalid brand or category.",
        },
        { status: 400 }
      );
    }

    const cleanVariants =
      variants.map(
        (variant: any) => ({
          packSizeId: String(
            variant.packSizeId
          ),
          sku: String(
            variant.sku ?? ""
          ).trim(),
          price: Number(
            variant.price
          ),

          mrp:
            variant.mrp === "" ||
            variant.mrp === null ||
            variant.mrp === undefined
              ? null
              : Number(variant.mrp),

          specialPrice:
            variant.specialPrice === "" ||
            variant.specialPrice === null ||
            variant.specialPrice === undefined
              ? null
              : Number(
                  variant.specialPrice
                ),

          stock: Math.max(
            0,
            Number(variant.stock) || 0
          ),
        })
      );

    for (const variant of cleanVariants) {
      if (
        !variant.packSizeId ||
        !variant.sku ||
        !Number.isFinite(
          variant.price
        ) ||
        variant.price < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid variant details.",
          },
          { status: 400 }
        );
      }

      if (
        variant.mrp !== null &&
        (!Number.isFinite(
          variant.mrp
        ) ||
          variant.mrp < 0)
      ) {
        return NextResponse.json(
          {
            error: "Invalid MRP.",
          },
          { status: 400 }
        );
      }

      if (
        variant.specialPrice !== null &&
        (!Number.isFinite(
          variant.specialPrice
        ) ||
          variant.specialPrice < 0)
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid special price.",
          },
          { status: 400 }
        );
      }
    }

    const productSlug =
      `${name}-${brand.name}-${Date.now()}`
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );

    const product =
      await prisma.product.create({
        data: {
          name,
          slug: productSlug,
          description,
          imageUrl,
          isDemo: false,
          isActive: true,
          brandId,
          categoryId,

          variants: {
            create:
              cleanVariants.map(
                (variant: any) => ({
                  sku: variant.sku,
                  price: variant.price,
                  mrp: variant.mrp,
                  specialPrice:
                    variant.specialPrice,
                  packSizeId:
                    variant.packSizeId,

                  inventory: {
                    create: {
                      quantity:
                        variant.stock,
                      status:
                        variant.stock <= 0
                          ? "OUT_OF_STOCK"
                          : "IN_STOCK",
                    },
                  },
                })
              ),
          },
        },

        include: {
          brand: true,
          category: true,
          variants: {
            include: {
              packSize: true,
              inventory: true,
            },
          },
        },
      });

    return NextResponse.json(
      { product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/admin/products",
      error
    );

    if (
      error?.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "SKU or another unique value already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to create product.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const productId = String(
      body.id ?? ""
    ).trim();

    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          variants: {
            include: {
              inventory: true,
            },
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Product not found.",
        },
        { status: 404 }
      );
    }

    /*
     * UPDATE MAIN PRODUCT
     */

    const data: any = {};

    if (
      body.name !== undefined
    ) {
      const name = String(
        body.name
      ).trim();

      if (!name) {
        return NextResponse.json(
          {
            error:
              "Product name is required.",
          },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (
      body.description !== undefined
    ) {
      data.description =
        String(
          body.description ?? ""
        ).trim() || null;
    }

    if (
      body.imageUrl !== undefined
    ) {
      data.imageUrl =
        String(
          body.imageUrl ?? ""
        ).trim() || null;
    }

    if (
      body.brandId !== undefined
    ) {
      const brandId = String(
        body.brandId
      ).trim();

      const brand =
        await prisma.brand.findUnique({
          where: {
            id: brandId,
          },
        });

      if (!brand) {
        return NextResponse.json(
          {
            error:
              "Invalid brand.",
          },
          { status: 400 }
        );
      }

      data.brandId = brandId;
    }

    if (
      body.categoryId !== undefined
    ) {
      const categoryId =
        String(
          body.categoryId
        ).trim();

      const category =
        await prisma.category.findUnique({
          where: {
            id: categoryId,
          },
        });

      if (!category) {
        return NextResponse.json(
          {
            error:
              "Invalid category.",
          },
          { status: 400 }
        );
      }

      data.categoryId =
        categoryId;
    }

    if (
      body.isActive !== undefined
    ) {
      data.isActive =
        Boolean(body.isActive);
    }

    /*
     * UPDATE MAIN PRODUCT
     */

    if (
      Object.keys(data).length
    ) {
      await prisma.product.update({
        where: {
          id: productId,
        },
        data,
      });
    }

    /*
     * UPDATE VARIANTS
     *
     * Expected format:
     *
     * variants: [
     *   {
     *     id,
     *     packSizeId,
     *     sku,
     *     mrp,
     *     price,
     *     specialPrice,
     *     stock
     *   }
     * ]
     */

    if (
      Array.isArray(body.variants)
    ) {
      for (
        const variantInput of
          body.variants
      ) {
        const variantId =
          String(
            variantInput.id ??
              ""
          ).trim();

        if (!variantId) {
          return NextResponse.json(
            {
              error:
                "Variant ID is required.",
            },
            { status: 400 }
          );
        }

        const existingVariant =
          existing.variants.find(
            (variant) =>
              variant.id ===
              variantId
          );

        if (!existingVariant) {
          return NextResponse.json(
            {
              error:
                "Variant does not belong to this product.",
            },
            { status: 400 }
          );
        }

        const variantData: any =
          {};

        /*
         * SKU
         */

        if (
          variantInput.sku !==
          undefined
        ) {
          const sku = String(
            variantInput.sku
          ).trim();

          if (!sku) {
            return NextResponse.json(
              {
                error:
                  "SKU cannot be empty.",
              },
              { status: 400 }
            );
          }

          variantData.sku = sku;
        }

        /*
         * PACK SIZE
         */

        if (
          variantInput.packSizeId !==
          undefined
        ) {
          const packSizeId =
            String(
              variantInput.packSizeId
            ).trim();

          const packSize =
            await prisma.packSize.findUnique(
              {
                where: {
                  id: packSizeId,
                },
              }
            );

          if (!packSize) {
            return NextResponse.json(
              {
                error:
                  "Invalid pack size.",
              },
              { status: 400 }
            );
          }

          variantData.packSizeId =
            packSizeId;
        }

        /*
         * PRICE
         */

        if (
          variantInput.price !==
          undefined
        ) {
          const price =
            Number(
              variantInput.price
            );

          if (
            !Number.isFinite(
              price
            ) ||
            price < 0
          ) {
            return NextResponse.json(
              {
                error:
                  "Invalid selling price.",
              },
              { status: 400 }
            );
          }

          variantData.price =
            price;
        }

        /*
         * MRP
         */

        if (
          variantInput.mrp !==
          undefined
        ) {
          if (
            variantInput.mrp ===
              "" ||
            variantInput.mrp ===
              null
          ) {
            variantData.mrp =
              null;
          } else {
            const mrp =
              Number(
                variantInput.mrp
              );

            if (
              !Number.isFinite(
                mrp
              ) ||
              mrp < 0
            ) {
              return NextResponse.json(
                {
                  error:
                    "Invalid MRP.",
                },
                { status: 400 }
              );
            }

            variantData.mrp =
              mrp;
          }
        }

        /*
         * SPECIAL PRICE
         */

        if (
          variantInput.specialPrice !==
          undefined
        ) {
          if (
            variantInput.specialPrice ===
              "" ||
            variantInput.specialPrice ===
              null
          ) {
            variantData.specialPrice =
              null;
          } else {
            const specialPrice =
              Number(
                variantInput.specialPrice
              );

            if (
              !Number.isFinite(
                specialPrice
              ) ||
              specialPrice < 0
            ) {
              return NextResponse.json(
                {
                  error:
                    "Invalid special price.",
                },
                { status: 400 }
              );
            }

            variantData.specialPrice =
              specialPrice;
          }
        }

        /*
         * UPDATE PRODUCT VARIANT
         */

        await prisma.productVariant.update(
          {
            where: {
              id: variantId,
            },
            data: variantData,
          }
        );

        /*
         * UPDATE INVENTORY
         */

        if (
          variantInput.stock !==
          undefined
        ) {
          const stock =
            Number(
              variantInput.stock
            );

          if (
            !Number.isFinite(
              stock
            ) ||
            stock < 0
          ) {
            return NextResponse.json(
              {
                error:
                  "Invalid stock quantity.",
              },
              { status: 400 }
            );
          }

          const quantity =
            Math.floor(stock);

          const inventoryStatus =
            quantity <= 0
              ? "OUT_OF_STOCK"
              : quantity <= 5
                ? "LOW_STOCK"
                : "IN_STOCK";

          await prisma.inventory.upsert(
            {
              where: {
                variantId,
              },
              update: {
                quantity,
                status:
                  inventoryStatus,
              },
              create: {
                variantId,
                quantity,
                status:
                  inventoryStatus,
              },
            }
          );
        }
      }
    }

    /*
     * RETURN UPDATED PRODUCT
     */

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          brand: true,
          category: true,
          variants: {
            include: {
              packSize: true,
              inventory: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error(
      "PATCH /api/admin/products",
      error
    );

    if (
      error?.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "SKU or another unique value already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to update product.",
      },
      { status: 500 }
    );
  }
}