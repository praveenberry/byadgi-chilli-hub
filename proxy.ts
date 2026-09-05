import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth-constants";

const encoder = new TextEncoder();

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value)
  );

  return Buffer.from(signature).toString("base64url");
}

async function validSession(token: string | undefined) {
  if (!token || !process.env.ADMIN_SESSION_SECRET) {
    return false;
  }

  const dot = token.lastIndexOf(".");

  if (dot <= 0) {
    return false;
  }

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = await hmac(
    process.env.ADMIN_SESSION_SECRET,
    payload
  );

  if (signature !== expected || !payload.startsWith("admin:")) {
    return false;
  }

  const timestamp = Number(payload.slice(6));

  return (
    Number.isFinite(timestamp) &&
    Date.now() - timestamp < 1000 * 60 * 60 * 24 * 7
  );
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Login page must remain accessible
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect admin pages and admin APIs
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    if (await validSession(token)) {
      return NextResponse.next();
    }

    // API request
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Browser request
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};