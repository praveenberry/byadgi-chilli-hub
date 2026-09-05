"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/cart-provider";
import type { DemoProduct } from "@/lib/products";

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
  imageUrl?: string | null;
  variants: ApiVariant[];
};

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { add } = useCart();

  const [product, setProduct] =
    useState<ApiProduct | null>(null);

  const [selectedVariant, setSelectedVariant] =
    useState<ApiVariant | null>(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();

        const products: ApiProduct[] =
          data.products ?? [];

        const found = products.find((item) => {
          if (item.slug === slug) return true;

          return item.variants.some(
            (variant) =>
              `${item.slug}-${variant.packSize
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")}` ===
              slug
          );
        });

        if (!found) {
          setNotFound(true);
          return;
        }

        setProduct(found);

        const matchingVariant =
          found.variants.find(
            (variant) =>
              `${found.slug}-${variant.packSize
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")}` ===
              slug
          );

        setSelectedVariant(
          matchingVariant ||
            found.variants[0] ||
            null
        );
      } catch (error) {
        console.error("Load product:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  function addToCart() {
    if (!product || !selectedVariant) return;

    const cartProduct: DemoProduct = {
      id: selectedVariant.id,

      slug: `${product.slug}-${selectedVariant.packSize
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,

      brand: product.brand,

      name: product.name,

      category:
        product.category === "dry-red-chilli"
          ? "dry-whole-chilli"
          : "chilli-powder",

      packSize: selectedVariant.packSize,

      price: selectedVariant.price,

      mrp: selectedVariant.mrp,
      
      stock: selectedVariant.stock,

      description: product.description,

      imageUrl: product.imageUrl ?? null,
    };

    add(cartProduct);
  }

  if (loading) {
    return (
      <>
        <Header
          onSearch={() => {}}
          onLogin={() => {}}
        />

        <main 
className="container detail-page">
          <div className="detail-card">
            <p>Loading product...</p>
          </div>
        </main>

        <CartDrawer />
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <Header
          onSearch={() => {}}
          onLogin={() => {}}
        />

        <main className="container detail-page">
          <div className="detail-card">
            <h1>Product not found</h1>

            <p>
              This product is no longer available.
            </p>

            <Link
              href="/#products"
              className="btn red"
            >
              BACK TO CATALOGUE
            </Link>
          </div>
        </main>

        <CartDrawer />
      </>
    );
  }

  const discount =
    selectedVariant &&
    selectedVariant.mrp > selectedVariant.price
      ? Math.round(
          (1 -
            selectedVariant.price /
              selectedVariant.mrp) *
            100
        )
      : 0;

  return (
    <>
      <Header
        onSearch={() => {}}
        onLogin={() => {}}
      />

      <main className="container detail-page">

        <Link
          href="/#products"
          className="section-row"
        >
          ← Back to catalogue
        </Link>

        <div className="detail-card">

          {/* PRODUCT IMAGE */}

          <div className="detail-art">

            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
              />
            ) : (
              <span>🌶️</span>
            )}

          </div>

          {/* PRODUCT INFORMATION */}

          <div>

            <p className="live-product">
  PRODUCT DETAILS
</p>
            <h1>
              {product.name}
            </h1>

            <h2>
              {product.brand}
            </h2>

            {product.description && (
              <p>
                {product.description}
              </p>
            )}

            <h3>
              Choose Pack Size
            </h3>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
              }}
            >

              {product.variants.map(
                (variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={
                      selectedVariant?.id ===
                      variant.id
                        ? "btn red"
                        : "btn"
                    }
                    onClick={() =>
                      setSelectedVariant(
                        variant
                      )
                    }
                  >
                    {variant.packSize}
                  </button>
                )
              )}

            </div>

            {selectedVariant && (
              <>

                <span className="size">
                  {selectedVariant.packSize}
                </span>

                <div className="price">
                  ₹{selectedVariant.price}
                </div>

                {selectedVariant.mrp >
                  selectedVariant.price && (
                  <p className="mrp">
                    MRP ₹
                    {selectedVariant.mrp}
                  </p>
                )}

                {discount > 0 && (
                  <p className="sale">
                    {discount}% OFF
                  </p>
                )}

                {selectedVariant.stock > 0 ? (
                  <>

                    <p>
                      <b>
                        Stock available:
                      </b>{" "}
                      {selectedVariant.stock}
                    </p>

                    <button
                      type="button"
                      className="btn red"
                      onClick={addToCart}
                    >
                      🛒 ADD TO CART
                    </button>

                  </>
                ) : (
                  <p
                    style={{
                      color: "#b00020",
                      fontWeight: 700,
                    }}
                  >
                    OUT OF STOCK
                  </p>
                )}

                <p
                  className="product-sku"
                  style={{
                    marginTop: 15,
                  }}
                >
                  SKU:{" "}
                  {selectedVariant.sku}
                </p>

              </>
            )}

          </div>

        </div>

      </main>

      <CartDrawer />
    </>
  );
}





