import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  RETAILER_COOKIE,
  verifyRetailerSession,
} from "@/lib/retailer-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get(RETAILER_COOKIE)?.value;

    const userId =
      verifyRetailerSession(token);

    if (!userId) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Please login again.",
        },
        { status: 401 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          mobile: true,
          role: true,
          retailer: {
            select: {
              id: true,
              shopName: true,
              isApproved: true,
            },
          },
        },
      });

    if (
      !user ||
      user.role !== "RETAILER" ||
      !user.retailer
    ) {
      return NextResponse.json(
        {
          error:
            "Retailer account not found.",
        },
        { status: 403 }
      );
    }

    if (!user.retailer.isApproved) {
      return NextResponse.json(
        {
          error:
            "Your B2B account is awaiting approval.",
        },
        { status: 403 }
      );
    }

    const orders =
      await prisma.order.findMany({
        where: {
          userId: user.id,
        },

        include: {
          items: true,
          payments: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      authenticated: true,

      retailer: {
        userId: user.id,
        shopName:
          user.retailer.shopName,
      },

      orderCount: orders.length,

      orders: orders.map((order) => ({
        id: order.id,
        orderNumber:
          order.orderNumber,
        status: order.status,
        shippingStatus:
          order.shippingStatus,

        total:
          order.total.toString(),

        createdAt:
          order.createdAt.toISOString(),

        invoiceNumber:
          order.invoiceNumber,

        invoiceDate:
          order.invoiceDate
            ?.toISOString() ?? null,

        dispatchMethod:
          order.dispatchMethod,

        awbNumber:
          order.awbNumber,

        transportName:
          order.transportName,

        lrNumber:
          order.lrNumber,

        packageCount:
          order.packageCount,

        totalWeight:
          order.totalWeight?.toString() ??
          null,

        trackingUrl:
          order.trackingUrl,

        dispatchDate:
          order.dispatchDate
            ?.toISOString() ?? null,

        deliveryDate:
          order.deliveryDate
            ?.toISOString() ?? null,

        dispatchNotes:
          order.dispatchNotes,

        items: order.items.map(
          (item) => ({
            id: item.id,
            productName:
              item.productName,
            brandName:
              item.brandName,
            packSizeLabel:
              item.packSizeLabel,
            unitPrice:
              item.unitPrice.toString(),
            quantity:
              item.quantity,
          })
        ),

        payments: order.payments.map(
          (payment) => ({
            provider:
              payment.provider,
            status:
              payment.status,
            amount:
              payment.amount.toString(),
            reference:
              payment.reference,
          })
        ),
      })),
    });
  } catch (error) {
    console.error(
      "GET /api/retailer/orders:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load your orders.",
      },
      { status: 500 }
    );
  }
}