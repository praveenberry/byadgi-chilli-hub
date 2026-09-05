import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  RETAILER_COOKIE,
  verifyRetailerSession,
} from "@/lib/retailer-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const retailerToken =
      cookieStore.get(RETAILER_COOKIE)?.value;

    const retailerUserId =
      verifyRetailerSession(retailerToken);

    let isApprovedRetailer = false;

    if (retailerUserId) {
      const retailer =
        await prisma.retailer.findUnique({
          where: {
            userId: retailerUserId,
          },
          select: {
            isApproved: true,
          },
        });

      isApprovedRetailer =
        retailer?.isApproved === true;
    }

    const products =
      await prisma.product.findMany({
        where: {
          isActive: true,
        },

        include: {
          brand: true,
          category: true,

          variants: {
            where: {
              inventory: {
                isNot: null,
              },
            },

            include: {
              packSize: true,
              inventory: true,
            },

            orderBy: {
              packSize: {
                grams: "asc",
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const catalogue =
      products.map((product) => ({
        id: product.id,
        slug: product.slug,
        brand: product.brand.name,
        name: product.name,
        category: product.category.slug,
        description:
          product.description ?? "",
        imageUrl:
          product.imageUrl ?? null,

        variants:
          product.variants.map(
            (variant) => {
              const retailPrice =
                Number(variant.price);

              const b2bPrice =
                variant.specialPrice !== null
                  ? Number(
                      variant.specialPrice
                    )
                  : retailPrice;

              return {
                id: variant.id,
                sku: variant.sku,
                packSize:
                  variant.packSize.label,

                // Only approved retailers get
                // the special B2B price.
                price:
                  isApprovedRetailer
                    ? b2bPrice
                    : retailPrice,

                // Keep the normal retail price
                // available for displaying MRP/
                // B2B savings later.
                retailPrice,

                mrp:
                  Number(
                    variant.mrp ??
                      variant.price
                  ),

                stock:
                  variant.inventory
                    ?.quantity ?? 0,
              };
            }
          ),
      }));

    return NextResponse.json({
      isB2BRetailer:
        isApprovedRetailer,
      products: catalogue,
    });
  } catch (error) {
    console.error(
      "GET /api/products",
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