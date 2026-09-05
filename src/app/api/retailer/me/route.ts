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
      return NextResponse.json({
        authenticated: false,
      });
    }

    const user =
      await prisma.user.findUnique({
        where: { id: userId },
        include: { retailer: true },
      });

    if (
      !user ||
      user.role !== "RETAILER" ||
      !user.retailer
    ) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        retailer: {
          id: user.retailer.id,
          shopName: user.retailer.shopName,
          ownerName: user.retailer.ownerName,
          gstin: user.retailer.gstin,
          mobile: user.retailer.mobile,
          email: user.retailer.email,
          address: user.retailer.address,
          city: user.retailer.city,
          state: user.retailer.state,
          pincode: user.retailer.pincode,
        },
      },
    });
  } catch (error) {
    console.error(
      "Retailer session:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 500 }
    );
  }
}