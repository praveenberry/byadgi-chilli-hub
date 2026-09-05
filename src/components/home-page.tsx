"use client";

import { useEffect, useMemo, useState } from "react";
import type { DemoProduct } from "@/lib/products";
import { whatsappUrl } from "@/lib/products";
import { Header } from "./header";
import { ProductCard } from "./product-card";
import { CartDrawer } from "./cart-drawer";
import { BulkEnquiry } from "./bulk-enquiry";

type ApiVariant = {
  id: string;
  sku: string;
  packSize: string;
  price: number;
  mrp: number;
  stock: number;
};

type ApiProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: "chilli-powder" | "dry-red-chilli";
  description: string;
  variants: ApiVariant[];
};

export function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<
    "all" | "chilli-powder" | "dry-red-chilli"
  >("all");

  const [bulkOpen, setBulkOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();

                if (Array.isArray(data)) {
          setApiProducts(data);
        } else if (Array.isArray(data.products)) {
          setApiProducts(data.products);
        } else {
          console.error(
            "Unexpected products API response:",
            data
          );
          setApiProducts([]);
        }
      } catch (error) {
        console.error("Load products:", error);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  /*
   * Convert database products + variants into the existing
   * DemoProduct format used by ProductCard and CartProvider.
   */
  const products = useMemo<DemoProduct[]>(() => {
    const result: DemoProduct[] = [];

    for (const product of apiProducts) {
      for (const variant of product.variants) {
        result.push({
          id: variant.id,
          slug: `${product.slug}-${variant.packSize
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}`,
          brand: product.brand,
          name: product.name,
          category:
            product.category === "dry-red-chilli"
              ? "dry-whole-chilli"
              : "chilli-powder",
          packSize: variant.packSize,
          price: variant.price,
          mrp: variant.mrp,
          stock: variant.stock,
          description: product.description,
        });
      }
    }

    return result;
  }, [apiProducts]);

  const filteredProducts = useMemo(() => {
    const searchText = search.toLowerCase();

    return products
      .filter(
        (product) =>
          category === "all" ||
          product.category === category
      )
      .filter((product) =>
        `${product.brand} ${product.name} ${product.packSize}`
          .toLowerCase()
          .includes(searchText)
      );
  }, [products, search, category]);

  const brands = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.brand))
    );
  }, [products]);

  return (
    <>
      <Header
        onSearch={setSearch}
        onLogin={() => setLoginOpen(true)}
      />

      <main>
        <section className="hero">
          <div className="hero-bg" />

          <div className="hero-content">
            <div className="hero-copy">
              <div className="hero-kicker">
                QUALITY CHILLI PRODUCTS
              </div>

              <h1>
  QUALITY CHILLI PRODUCTS
  <br />
  <span>FOR RETAIL & BUSINESS</span>
</h1>

              <h2>
                From 50g Pouches to 25kg Bulk Packs
              </h2>

              <div className="hero-features">
                <div>
                  🌶️ <b>Live</b>
                  <small>Product Catalogue</small>
                </div>

                <div>
                  ✦ <b>{brands.length}</b>
                  <small>Brands</small>
                </div>

                <div>
                  ♢ <b>Retailer</b>
                  <small>Pricing Ready</small>
                </div>

                <div>
                  ▣ <b>Pan India</b>
                  <small>Delivery Ready</small>
                </div>
              </div>

              <div className="hero-buttons">
                <a
                  className="btn red"
                  href="#products"
                  onClick={() =>
                    setCategory("chilli-powder")
                  }
                >
                  🛒 SHOP RETAIL
                </a>

                <a
                  className="btn green"
                  href="#products"
                  onClick={() =>
                    setCategory("dry-red-chilli")
                  }
                >
                  🏪 B2B / BULK ORDERS
                </a>
              </div>
            </div>
          </div>

          <div className="dots">● ○ ○</div>
        </section>

        <section className="categories-section container">
          <h2 className="section-title">
            <span />
            SHOP BY CATEGORY
            <span />
          </h2>

          <div className="category-grid">
            <article className="category-card powder">
              <div>
                <h3>CHILLI POWDER</h3>

                <p>
                  50g | 100g | 250g | 500g | 1kg
                </p>

                <a
                  href="#products"
                  onClick={() =>
                    setCategory("chilli-powder")
                  }
                >
                  SHOP NOW
                </a>
              </div>

              <div className="cat-art">
                🌶️ 🛍️
              </div>
            </article>

            <article
              className="category-card dry"
              id="dry"
            >
              <div>
                <h3>DRY RED CHILLI</h3>

                <p>
                  1kg | 5kg | 10kg | 25kg
                </p>

                <a
                  href="#products"
                  onClick={() =>
                    setCategory("dry-red-chilli")
                  }
                >
                  SHOP NOW
                </a>
              </div>

              <div className="cat-art">
                🌶️ 🧺
              </div>
            </article>
          </div>
        </section>

        <section
          className="brands container"
          id="brands"
        >
          <div className="section-row">
            <h2>SHOP BY BRAND</h2>
          </div>

          <div className="brand-slider">
            {brands.map((brand) => (
              <div
                className="brand-pill"
                key={brand}
              >
                {brand}
              </div>
            ))}
          </div>
        </section>

        <section
          className="products-section"
          id="products"
        >
          <div className="container">
            <div className="section-row">
              <h2>PRODUCT CATALOGUE</h2>
            </div>

            <div className="tabs">
              <button
                className={
                  category === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory("all")
                }
              >
                All
              </button>

              <button
                className={
                  category === "chilli-powder"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory("chilli-powder")
                }
              >
                Chilli Powder
              </button>

              <button
                className={
                  category === "dry-red-chilli"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory("dry-red-chilli")
                }
              >
                Dry Red Chilli
              </button>
            </div>

            {loadingProducts ? (
              <p>Loading products...</p>
            ) : (
              <>
                <div className="product-grid">
                  {filteredProducts.map(
                    (product) => (
                      <ProductCard
                        product={product}
                        key={product.id}
                      />
                    )
                  )}
                </div>

                {!filteredProducts.length && (
                  <p>
                    No products match your search.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <section
          className="bulk-banner container"
          id="bulk"
        >
          <div className="bulk-icon">📦</div>

          <div>
            <h2>BUY IN BULK & SAVE MORE</h2>

            <p>
              1kg, 5kg, 10kg and 25kg packs
              available for shops, hotels,
              restaurants and traders.
            </p>
          </div>

          <button
            className="btn green"
            onClick={() => setBulkOpen(true)}
          >
            ENQUIRE NOW
          </button>

          <div className="bulk-art">
            🌶️🌶️
          </div>
        </section>

        <section
          className="about-section container"
          id="about"
        >
          <div className="why">
            <h2>
              WHY CHOOSE BYADGI CHILLI HUB?
            </h2>

            <div className="why-grid">
              <div>
                🛡️
                <b>Live Catalogue</b>
                <small>
                  Products managed by admin
                </small>
              </div>

              <div>
                🏅
                <b>One Order</b>
                <small>
                  Multiple brands supported
                </small>
              </div>

              <div>
                🏷️
                <b>Retailer Ready</b>
                <small>
                  Special pricing supported
                </small>
              </div>

              <div>
                🚚
                <b>Delivery Ready</b>
                <small>
                  Shipping management available
                </small>
              </div>

              <div>
                ♧
                <b>Dedicated Support</b>
                <small>
                  +91 70198 48055
                </small>
              </div>

              <div>
                ✓
                <b>Quality Focus</b>
                <small>
                  Approved products
                </small>
              </div>
            </div>
          </div>

          <div className="mix">
            <div>
              <span>MIX & MATCH</span>

              <h2>BUILD YOUR ORDER</h2>

              <p>
                Select different brands and pack
                sizes in one cart.
              </p>

              <a
                className="btn yellow"
                href="#products"
              >
                START ORDERING
              </a>
            </div>

            <div className="mix-art">
              🌶️ 🛍️ 🌶️
            </div>
          </div>
        </section>

        <section className="trust">
          <div className="container trust-grid">
            <div>
              🔒
              <b>Payment-ready</b>
              <small>
                Secure checkout ready
              </small>
            </div>

            <div>
              ◤
              <b>GST-ready</b>
              <small>
                Invoice system ready
              </small>
            </div>

            <div>
              ↻
              <b>Order Support</b>
              <small>
                Admin order management
              </small>
            </div>

            <div>
              ♧
              <b>Customer Support</b>
              <small>
                +91 70198 48055
              </small>
            </div>
          </div>
        </section>
      </main>

      <Footer
        onBulk={() => setBulkOpen(true)}
      />

      <div className="float-tools">
        <button
          onClick={() =>
            window.open(
              whatsappUrl(),
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          ◉<span>WhatsApp</span>
        </button>

        <button
          onClick={() =>
            setBulkOpen(true)
          }
        >
          ▣<span>Bulk Enquiry</span>
        </button>

        <a href="tel:+917019848055">
          ☎<span>Call Us</span>
        </a>
      </div>

      <CartDrawer />

      <BulkEnquiry
        open={bulkOpen}
        onClose={() =>
          setBulkOpen(false)
        }
      />

      {loginOpen && (
        <RetailerAuthModal
          onClose={() => setLoginOpen(false)}
        />
      )}
    </>
  );
}

function RetailerAuthModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    mobile: "",
    password: "",
    shopName: "",
    ownerName: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    state: "Karnataka",
    pincode: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const endpoint =
        mode === "login"
          ? "/api/retailer/login"
          : "/api/retailer/register";

      const payload =
        mode === "login"
          ? { mobile: form.mobile, password: form.password }
          : form;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to complete request.");
      }

      onClose();
      window.location.reload();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to complete request."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal show">
      <div
        className="modal-box"
        style={{
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          className="close"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          type="button"
        >
          ×
        </button>

        <h2>
          {mode === "login" ? "B2B Retailer Login" : "Create B2B Account"}
        </h2>

        <p>
          {mode === "login"
            ? "Login to access your retailer account and B2B pricing."
            : "Register your shop to access B2B pricing and bulk ordering."}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="form-grid">
                <input
                  value={form.shopName}
                  onChange={(e) => update("shopName", e.target.value)}
                  placeholder="Shop name *"
                  required
                />
                <input
                  value={form.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                  placeholder="Owner name *"
                  required
                />
              </div>

              <div className="form-grid">
                <input
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  type="email"
                  placeholder="Email"
                />
                <input
                  value={form.gstin}
                  onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                  placeholder="GSTIN (optional)"
                />
              </div>

              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Shop / delivery address *"
                required
                style={{ width: "100%", marginTop: 12 }}
              />

              <div className="form-grid" style={{ marginTop: 12 }}>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="City *"
                  required
                />
                <input
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="State *"
                  required
                />
                <input
                  value={form.pincode}
                  onChange={(e) =>
                    update("pincode", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Pincode *"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
            </>
          )}

          <div className="form-grid" style={{ marginTop: 12 }}>
            <input
              value={form.mobile}
              onChange={(e) =>
                update("mobile", e.target.value.replace(/\D/g, ""))
              }
              placeholder="Mobile number *"
              inputMode="numeric"
              maxLength={10}
              required
            />
            <input
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              type="password"
              placeholder="Password *"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p style={{ color: "#b00020", fontWeight: 700, marginTop: 12 }}>
              {error}
            </p>
          )}

          <button
            className="btn red"
            disabled={busy}
            style={{ marginTop: 15 }}
            type="submit"
          >
            {busy
              ? "PLEASE WAIT..."
              : mode === "login"
                ? "LOGIN"
                : "CREATE B2B ACCOUNT"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          {mode === "login" ? (
            <>
              Don't have a B2B account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                style={{
                  border: 0,
                  background: "none",
                  color: "#b5121b",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                REGISTER
              </button>
            </>
          ) : (
            <>
              Already have a B2B account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                style={{
                  border: 0,
                  background: "none",
                  color: "#b5121b",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                LOGIN
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer({
  onBulk,
}: {
  onBulk: () => void;
}) {
  return (
    <footer id="footer">
      <div className="footer-main container">
        <div className="footer-brand">
          <div className="logo light-logo">
            <span className="logo-mark">
              🌶️
            </span>

            <span>
              <b>BYADGI</b>
              <strong>CHILLI HUB</strong>
              <small>
                All Chilli Brands. One Hub.
              </small>
            </span>
          </div>

          <p>
            Your B2B hub for approved chilli
            suppliers and retailers.
          </p>
        </div>

        <div>
          <h4>QUICK LINKS</h4>

          <a href="#brands">
            Shop By Brand
          </a>

          <a href="#products">
            Chilli Powder
          </a>

          <a href="#dry">
            Dry Red Chilli
          </a>

          <button
            className="subscribe"
            onClick={onBulk}
          >
            Bulk Orders
          </button>
        </div>

        <div>
          <h4>HELP & SUPPORT</h4>

          <a>How to Order</a>
          <a>Shipping & Delivery</a>
          <a>Payment Methods</a>
          <a>Returns & Refunds</a>
        </div>

        <div>
          <h4>CONTACT US</h4>

          <p>☎ +91 70198 48055</p>
          <p>✉ info@byadgichillihub.com</p>

          <p>
            ⌖ APMC YARD BYADGI,
            <br />
            Karnataka - 581115
          </p>
        </div>
      </div>

      <div className="copyright">
        © 2026 Byadgi Chilli Hub.
        All Rights Reserved.
      </div>
    </footer>
  );
}