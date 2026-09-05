import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_COOKIE } from "@/lib/admin-auth-constants";
export { ADMIN_COOKIE } from "@/lib/admin-auth-constants";

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return value;
}
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function createAdminSession() { const payload = `admin:${Date.now()}`; return `${payload}.${sign(payload)}`; }
export function verifyAdminSession(token: string | undefined) {
  if (!token) return false;
  const dot = token.lastIndexOf("."); if (dot <= 0) return false;
  const payload = token.slice(0, dot), signature = token.slice(dot + 1), expected = sign(payload);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b) || !payload.startsWith("admin:")) return false;
  const timestamp = Number(payload.slice(6));
  return Number.isFinite(timestamp) && Date.now() - timestamp < 1000 * 60 * 60 * 24 * 7;
}
export function isAdminPasswordValid(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not configured");
  const a = Buffer.from(password), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
