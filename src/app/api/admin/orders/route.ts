import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth-constants";

function isAdminAuthenticated(request: NextRequest) {
  const session = request.cookies.get(ADMIN_COOKIE)?.value;

  return Boolean(session);
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { prisma } = await import("@/lib/prisma");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payments: true,
    },
  });

  return NextResponse.json(orders);
}