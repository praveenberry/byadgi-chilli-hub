import { NextResponse } from "next/server";
import { RETAILER_COOKIE } from "@/lib/retailer-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(
    RETAILER_COOKIE,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );

  return response;
}