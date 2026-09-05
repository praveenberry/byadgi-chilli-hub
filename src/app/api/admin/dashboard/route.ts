import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_COOKIE)?.value;

    if (!verifyAdminSession(session)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [
      orderCount,
      paidOrders,
      pendingOrders,
      dispatchedOrders,
      deliveredOrders,
      retailerCount,
      approvedRetailers,
      productCount,
      activeProducts,
      brandCount,
      lowStockItems,
      recentOrders,
      revenueResult,
      todayOrders,
      todayRevenueResult,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.count({
        where: {
          payments: {
            some: {
              status: "PAID",
            },
          },
        },
      }),

      prisma.order.count({
        where: {
          shippingStatus: {
            in: ["PENDING", "PACKED"],
          },
        },
      }),

      prisma.order.count({
        where: {
          shippingStatus: {
            in: [
              "DISPATCHED",
              "IN_TRANSIT",
              "OUT_FOR_DELIVERY",
            ],
          },
        },
      }),

      prisma.order.count({
        where: {
          shippingStatus: "DELIVERED",
        },
      }),

      prisma.retailer.count(),

      prisma.retailer.count({
        where: {
          isApproved: true,
        },
      }),

      prisma.product.count(),

      prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      prisma.brand.count(),

      prisma.inventory.count({
        where: {
          status: {
            in: [
              "LOW_STOCK",
              "OUT_OF_STOCK",
            ],
          },
        },
      }),

      prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerMobile: true,
          shippingCity: true,
          shippingStatus: true,
          total: true,
          grandTotal: true,
          createdAt: true,
          invoiceNumber: true,
          payments: {
            select: {
              status: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      }),

      prisma.order.aggregate({
        _sum: {
          grandTotal: true,
        },
        where: {
          payments: {
            some: {
              status: "PAID",
            },
          },
        },
      }),

      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(
              new Date().setHours(0, 0, 0, 0)
            ),
          },
        },
      }),

      prisma.order.aggregate({
        _sum: {
          grandTotal: true,
        },
        where: {
          createdAt: {
            gte: new Date(
              new Date().setHours(0, 0, 0, 0)
            ),
          },
          payments: {
            some: {
              status: "PAID",
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        orders: orderCount,
        paidOrders,
        pendingOrders,
        dispatchedOrders,
        deliveredOrders,
        retailers: retailerCount,
        approvedRetailers,
        products: productCount,
        activeProducts,
        brands: brandCount,
        lowStockItems,
        revenue: Number(
          revenueResult._sum.grandTotal || 0
        ),
        todayOrders,
        todayRevenue: Number(
          todayRevenueResult._sum.grandTotal || 0
        ),
      },

      recentOrders: recentOrders.map(
        (order) => ({
          ...order,
          total: Number(order.total),
          grandTotal: Number(order.grandTotal),
        })
      ),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/dashboard",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load dashboard.",
      },
      { status: 500 }
    );
  }
}