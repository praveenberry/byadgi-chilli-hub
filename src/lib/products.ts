export type CategorySlug =
  | "chilli-powder"
  | "dry-whole-chilli";

export type DemoProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: CategorySlug;
  packSize: string;
  price: number;
    mrp: number;
  stock: number;
  description: string;
  imageUrl?: string | null;
};

export const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
  "917019848055";

export const whatsappUrl = (message = "") =>
  `https://wa.me/${whatsappNumber}${
    message
      ? `?text=${encodeURIComponent(message)}`
      : ""
  }`;
export const demoBrands = [
  "RED CHILLI LOCAL",
];