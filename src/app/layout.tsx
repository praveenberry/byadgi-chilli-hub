import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";

export const metadata: Metadata = { title: "BYADGI CHILLI HUB | All Chilli Brands. One Hub.",  description: "Byadgi Chilli Hub — B2B chilli marketplace for retailers, traders and bulk buyers.",};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><CartProvider>{children}</CartProvider></body></html>; }
