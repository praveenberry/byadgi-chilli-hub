import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, isAdminPasswordValid } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");
    if (!password || !isAdminPasswordValid(password)) return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    console.error("admin login", error);
    return NextResponse.json({ error: "Admin login is not configured correctly." }, { status: 500 });
  }
}
