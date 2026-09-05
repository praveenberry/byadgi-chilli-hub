"use client";

import Link from "next/link";
import { useState } from "react";
import type { DemoProduct } from "@/lib/products";
import { useCart } from "./cart-provider";

export function ProductCard({
  product,
}: {
  product: DemoProduct;
}) {
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const { add } = useCart();

  const discount =
    product.mrp > 0
      ? Math.max(
          0,
          Math.round(
            (1 - product.price / product.mrp) * 100
          )
        )
      : 0;

  const saving = Math.max(
    0,
    product.mrp - product.price
  );

  return (
    <article className="product">

      {/* PRODUCT IMAGE */}
      <div className="product-img">

        {discount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 5,
              background: "#c91519",
              color: "#fff",
              padding: "4px 7px",
              borderRadius: 5,
              fontSize: 8,
              fontWeight: 900,
            }}
          >
            {discount}% OFF
          </span>
        )}

        <Link
          className="product-image-link"
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}, ${product.packSize}`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={`${product.brand} ${product.name}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 10,
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 70,
                lineHeight: 1,
              }}
            >
              🌶️
            </span>
          )}
        </Link>

        <button
          className="heart"
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          onClick={() => setLiked(!liked)}
          style={{
            color: liked ? "#c91519" : "#555",
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      {/* PRODUCT INFORMATION */}
      <Link
        className="product-link"
        href={`/products/${product.slug}`}
      >
        <div className="product-body">

          <span className="size">
            {product.packSize}
          </span>

          <div className="product-brand">
            {product.brand}
          </div>

          <div className="product-name">
            {product.name}
          </div>

          <div className="pricing-wrap">

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 7,
                flexWrap: "wrap",
              }}
            >
              <span className="price">
                ₹{product.price}
              </span>

              {product.mrp > product.price && (
                <span className="mrp">
                  ₹{product.mrp}
                </span>
              )}
            </div>

            {discount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 3,
                }}
              >
                <span className="sale">
                  {discount}% OFF
                </span>

                <span
                  style={{
                    color: "#16843b",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  Save ₹{saving}
                </span>
              </div>
            )}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginTop: 6,
                padding: "3px 6px",
                borderRadius: 4,
                background: "#edf8f0",
                color: "#13763a",
                fontSize: 7,
                fontWeight: 900,
                letterSpacing: ".3px",
              }}
            >
              B2B PRICE
            </div>

          </div>
        </div>
      </Link>

      {/* QUANTITY + CART */}
      <div
        className="product-body"
        style={{
          paddingTop: 0,
          paddingBottom: 10,
        }}
      >
        <div className="qty-row">

          <div className="qty">

            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() =>
                setQuantity(
                  Math.max(1, quantity - 1)
                )
              }
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() =>
                setQuantity(quantity + 1)
              }
            >
              +
            </button>

          </div>

          <button
            type="button"
            className="add"
            onClick={() =>
              add(product, quantity)
            }
          >
            🛒 ADD TO CART
          </button>

        </div>
      </div>

    </article>
  );
}