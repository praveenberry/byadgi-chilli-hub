import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shopName = String(body.shopName ?? "").trim();
    const ownerName = String(body.ownerName ?? "").trim();
    const mobile = String(body.mobile ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const gstin = String(body.gstin ?? "").trim() || null;
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim();
    const pincode = String(body.pincode ?? "").trim();
    const password = String(body.password ?? "");

    if (
      !shopName ||
      !ownerName ||
      !mobile ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !password
    ) {
      return NextResponse.json(
        { error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Enter a valid 10 digit mobile number." },
        { status: 400 }
      );
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: "Enter a valid 6 digit pincode." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const existingMobile = await prisma.user.findUnique({
      where: { mobile },
    });

    if (existingMobile) {
      return NextResponse.json(
        {
          error:
            "This mobile number is already registered.",
        },
        { status: 409 }
      );
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            error:
              "This email is already registered.",
          },
          { status: 409 }
        );
      }
    }

    if (gstin) {
      const existingGstin =
        await prisma.retailer.findUnique({
          where: { gstin },
        });

      if (existingGstin) {
        return NextResponse.json(
          {
            error:
              "This GSTIN is already registered.",
          },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const user = await prisma.user.create({
      data: {
        mobile,
        email,
        name: ownerName,
        passwordHash,
        role: "RETAILER",

        retailer: {
          create: {
            shopName,
            ownerName,
            gstin,
            mobile,
            email,
            address,
            city,
            state,
            pincode,
            isApproved: false,
          },
        },
      },

      select: {
        id: true,
        mobile: true,
        email: true,
        name: true,
        role: true,

        retailer: {
          select: {
            id: true,
            shopName: true,
            ownerName: true,
            gstin: true,
            isApproved: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message:
        "Registration successful. Your B2B account is awaiting verification by BYADGI CHILLI HUB.",
      user,
    });
  } catch (error) {
    console.error(
      "Retailer registration:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to register retailer.",
      },
      { status: 500 }
    );
  }
}