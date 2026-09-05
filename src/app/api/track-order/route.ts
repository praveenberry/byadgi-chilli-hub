import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderNumber = String(body.orderNumber ?? "")
      .trim()
      .toUpperCase();

    const mobile = String(body.mobile ?? "").trim();

    if (!orderNumber || !mobile) {
      return NextResponse.json(
        { error: "Order number and mobile number are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        customerMobile: mobile,
      },
      select: {
        orderNumber: true,
        status: true,
        shippingStatus: true,
        total: true,
        customerName: true,
        shippingCity: true,
        shippingState: true,
        shippingPincode: true,
        dispatchMethod: true,
        awbNumber: true,
        trackingUrl: true,
        transportName: true,
        lrNumber: true,
        packageCount: true,
        totalWeight: true,
        dispatchDate: true,
        deliveryDate: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            brandName: true,
            packSizeLabel: true,
            unitPrice: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please check your order number and mobile number." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        ...order,
        total: order.total.toString(),
        totalWeight: order.totalWeight?.toString() ?? null,
        items: order.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("POST /api/track-order", error);

    return NextResponse.json(
      { error: "Unable to track order." },
      { status: 500 }
    );
  }
}