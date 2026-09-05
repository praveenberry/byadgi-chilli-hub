import { createHmac, timingSafeEqual } from "node:crypto";

export const RETAILER_COOKIE = "byadgi_retailer_session";

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;

  if (!value) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not configured"
    );
  }

  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret())
    .update(value)
    .digest("base64url");
}

export function createRetailerSession(
  userId: string
) {
  const payload = `retailer:${userId}:${Date.now()}`;

  return `${payload}.${sign(payload)}`;
}

export function verifyRetailerSession(
  token: string | undefined
) {
  if (!token) return null;

  const dot = token.lastIndexOf(".");

  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  let expected: string;

  try {
    expected = sign(payload);
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (
    a.length !== b.length ||
    !timingSafeEqual(a, b)
  ) {
    return null;
  }

  const parts = payload.split(":");

  if (
    parts.length !== 3 ||
    parts[0] !== "retailer"
  ) {
    return null;
  }

  const userId = parts[1];
  const timestamp = Number(parts[2]);

  if (!userId || !Number.isFinite(timestamp)) {
    return null;
  }

  // Session valid for 7 days.
  if (
    Date.now() - timestamp >
    1000 * 60 * 60 * 24 * 7
  ) {
    return null;
  }

  return userId;
}