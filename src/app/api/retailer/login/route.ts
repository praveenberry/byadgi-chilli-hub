import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createRetailerSession,
  RETAILER_COOKIE,
} from "@/lib/retailer-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const mobile = String(
      body.mobile ?? ""
    ).trim();

    const password = String(
      body.password ?? ""
    );

    if (!mobile || !password) {
      return NextResponse.json(
        {
          error:
            "Mobile number and password are required.",
        },
        { status: 400 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: { mobile },
        include: { retailer: true },
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
        { status: 401 }
      );
    }

    // B2B retailer must be approved by admin
    if (!user.retailer.isApproved) {
      return NextResponse.json(
        {
          error:
            "Your B2B account is awaiting verification. Please wait for admin approval.",
          pendingApproval: true,
        },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "This retailer account is not configured for password login.",
        },
        { status: 401 }
      );
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!validPassword) {
      return NextResponse.json(
        {
          error:
            "Invalid mobile number or password.",
        },
        { status: 401 }
      );
    }

    const session =
      createRetailerSession(user.id);

    const response =
      NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          retailer: {
            id: user.retailer.id,
            shopName:
              user.retailer.shopName,
            ownerName:
              user.retailer.ownerName,
            gstin:
              user.retailer.gstin,
          },
        },
      });

    response.cookies.set(
      RETAILER_COOKIE,
      session,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Retailer login:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to login retailer.",
      },
      { status: 500 }
    );
  }
}