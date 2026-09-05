"use client";

import { FormEvent, useEffect, useState } from "react";
import { whatsappUrl } from "@/lib/products";

type Brand = {
  id: string;
  name: string;
};

export function BulkEnquiry({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);

  const [form, setForm] = useState({
    product: "Byadgi Chilli Powder",
    brand: "",
    packSize: "1kg",
    quantity: "",
    customer: "",
    shop: "",
    mobile: "",
    city: "",
    message: "",
  });

  useEffect(() => {
    if (!open) return;

    async function loadBrands() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        const products = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : [];

        const uniqueBrands = Array.from(
          new Map(
            products.map((product: { brand: string }) => [
              product.brand,
              product.brand,
            ])
          ).entries()
        ).map(([name]) => ({
          id: name,
          name,
        }));

        setBrands(uniqueBrands as Brand[]);

        if (uniqueBrands.length && !form.brand) {
          setForm((current) => ({
            ...current,
            brand: String(uniqueBrands[0].name),
          }));
        }
      } catch (error) {
        console.error("Load brands:", error);
      }
    }

    loadBrands();
  }, [open, form.brand]);

  if (!open) return null;

  const update = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const text = `Hello BYADGI CHILLI HUB,

I need a bulk quotation.

Product: ${form.product}
Brand: ${form.brand || "Any available brand"}
Pack size: ${form.packSize}
Quantity: ${form.quantity}
Customer: ${form.customer}
Shop: ${form.shop || "Not provided"}
Mobile: ${form.mobile}
Delivery city: ${form.city}
Message: ${form.message || "No additional message"}`;

    window.open(
      whatsappUrl(text),
      "_blank",
      "noopener,noreferrer"
    );

    onClose();
  };

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
    >
      <form
        className="modal-box"
        onSubmit={submit}
      >
        <button
          type="button"
          className="close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2>Bulk Enquiry</h2>

        <p>
          Send your bulk requirement on WhatsApp.
          Our team will contact you with pricing and
          availability.
        </p>

        <div className="form-grid">
          <select
            value={form.product}
            onChange={(e) =>
              update("product", e.target.value)
            }
          >
            <option>Byadgi Chilli Powder</option>
            <option>Dry Whole Chilli</option>
          </select>

          <select
            value={form.brand}
            onChange={(e) =>
              update("brand", e.target.value)
            }
          >
            <option value="">
              Select Brand
            </option>

            {brands.map((brand) => (
              <option
                key={brand.id}
                value={brand.name}
              >
                {brand.name}
              </option>
            ))}
          </select>

          <select
            value={form.packSize}
            onChange={(e) =>
              update("packSize", e.target.value)
            }
          >
            <option>50g</option>
            <option>100g</option>
            <option>250g</option>
            <option>500g</option>
            <option>1kg</option>
            <option>5kg</option>
            <option>10kg</option>
            <option>25kg</option>
          </select>

          <input
            required
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              update("quantity", e.target.value)
            }
          />

          <input
            required
            placeholder="Customer name"
            value={form.customer}
            onChange={(e) =>
              update("customer", e.target.value)
            }
          />

          <input
            placeholder="Shop name"
            value={form.shop}
            onChange={(e) =>
              update("shop", e.target.value)
            }
          />

          <input
            required
            placeholder="Mobile"
            value={form.mobile}
            onChange={(e) =>
              update("mobile", e.target.value)
            }
          />

          <input
            required
            placeholder="Delivery city"
            value={form.city}
            onChange={(e) =>
              update("city", e.target.value)
            }
          />

          <textarea
            placeholder="Message"
            value={form.message}
            onChange={(e) =>
              update("message", e.target.value)
            }
          />
        </div>

        <button
          className="btn green"
          type="submit"
        >
          SEND ENQUIRY ON WHATSAPP
        </button>
      </form>
    </div>
  );
}

