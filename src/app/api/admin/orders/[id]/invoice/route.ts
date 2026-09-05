import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getFinancialYear(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}

function getInvoicePrefixNumber(invoiceNumber: string | null) {
  if (!invoiceNumber) return 0;

  const match = invoiceNumber.match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // If invoice already exists, return it.
    if (order.invoiceNumber) {
      return NextResponse.json({
        invoiceNumber: order.invoiceNumber,
        invoiceDate: order.invoiceDate,
        order,
      });
    }

    const invoiceDate = new Date();
    const financialYear = getFinancialYear(invoiceDate);

    const existingInvoices = await prisma.order.findMany({
      where: {
        invoiceNumber: {
          startsWith: `BYD/${financialYear}/`,
        },
      },
      select: {
        invoiceNumber: true,
      },
    });

    const lastNumber = existingInvoices.reduce(
      (max, item) =>
        Math.max(max, getInvoicePrefixNumber(item.invoiceNumber)),
      0
    );

    const nextNumber = lastNumber + 1;

    const invoiceNumber = `BYD/${financialYear}/${String(
      nextNumber
    ).padStart(4, "0")}`;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        invoiceNumber,
        invoiceDate,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      invoiceNumber,
      invoiceDate,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Generate invoice error:", error);

    return NextResponse.json(
      { error: "Unable to generate invoice." },
      { status: 500 }
    );
  }
}