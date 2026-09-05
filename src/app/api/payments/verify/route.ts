import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const razorpayOrderId = String(
      body.razorpay_order_id ?? ""
    ).trim();

    const razorpayPaymentId = String(
      body.razorpay_payment_id ?? ""
    ).trim();

    const razorpaySignature = String(
      body.razorpay_signature ?? ""
    ).trim();

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        { error: "Payment verification details are missing." },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay is not configured." },
        { status: 500 }
      );
    }

    /*
     * Razorpay signature:
     *
     * HMAC-SHA256(
     *   razorpay_order_id + "|" + razorpay_payment_id,
     *   RAZORPAY_KEY_SECRET
     * )
     *
     * This verification must happen on the server.
     */
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    const valid = safeCompare(
      generatedSignature,
      razorpaySignature
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    /*
     * Do not trust the browser's payment amount/order.
     * At this stage we only confirm the Razorpay signature.
     *
     * The final checkout integration will connect this
     * verified payment to our database Order and Payment.
     */
    return NextResponse.json({
      verified: true,
      paymentId: razorpayPaymentId,
      razorpayOrderId,
    });
  } catch (error) {
    console.error(
      "Razorpay payment verification:",
      error
    );

    return NextResponse.json(
      { error: "Unable to verify payment." },
      { status: 500 }
    );
  }
}