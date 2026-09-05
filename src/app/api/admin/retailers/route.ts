import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
} from "@/lib/admin-auth";

import {
  verifyAdminSession,
} from "@/lib/admin-auth";

import { cookies } from "next/headers";

async function requireAdmin() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return false;
  }

  return true;
}

export async function GET() {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const retailers =
      await prisma.retailer.findMany({
        orderBy: {
          id: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              mobile: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

    return NextResponse.json({
      retailers,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/retailers",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load retailer applications.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const retailerId = String(
      body.retailerId ?? ""
    ).trim();

    const approved =
      Boolean(body.approved);

    if (!retailerId) {
      return NextResponse.json(
        {
          error:
            "Retailer ID is required.",
        },
        { status: 400 }
      );
    }

    const retailer =
      await prisma.retailer.update({
        where: {
          id: retailerId,
        },
        data: {
          isApproved: approved,
        },
        select: {
          id: true,
          shopName: true,
          ownerName: true,
          mobile: true,
          isApproved: true,
        },
      });

    return NextResponse.json({
      success: true,
      retailer,
      message: approved
        ? "Retailer approved successfully."
        : "Retailer approval removed.",
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/retailers",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update retailer approval.",
      },
      { status: 500 }
    );
  }
}