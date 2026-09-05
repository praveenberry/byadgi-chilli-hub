"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";

type RetailerUser = {
  name: string | null;
  mobile: string | null;
  retailer: {
    shopName: string;
    ownerName: string;
  };
};

export function Header({
  onSearch,
  onLogin,
}: {
  onSearch: (value: string) => void;
  onLogin: () => void;
}) {
  const { count, setOpen } = useCart();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [retailer, setRetailer] =
    useState<RetailerUser | null>(null);

  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
    async function checkRetailerSession() {
      try {
        const response = await fetch(
          "/api/retailer/me",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (
          response.ok &&
          data.authenticated &&
          data.user?.retailer
        ) {
          setRetailer(data.user);
        } else {
          setRetailer(null);
        }
      } catch (error) {
        console.error(
          "Retailer session check:",
          error
        );

        setRetailer(null);
      } finally {
        setCheckingSession(false);
      }
    }

    checkRetailerSession();
  }, []);

  async function logout() {
    try {
      await fetch(
        "/api/retailer/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(
        "Retailer logout:",
        error
      );
    } finally {
      setRetailer(null);
      window.location.href = "/";
    }
  }

  return (
    <>
      {/* TOP STRIP */}
      <div className="top-strip">
        <div>
          🌶️{" "}
          <b>Premium Chilli Catalogue.</b>
          All Chilli Brands. One Hub.
        </div>

        <div>
          ▣ B2B & Retail Orders
        </div>

        <div>
          🚚 Pan India Delivery
        </div>

        <div>
          ☎ Bulk Orders:{" "}
          <b>+91 70198 48055</b>
        </div>
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="head-inner">

          {/* MOBILE MENU */}
          <button
            aria-label="Open navigation"
            className="mobile-menu"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
          >
            ☰
          </button>

          {/* LOGO */}
          <Link
            className="logo"
            href="/"
          >
            <span className="logo-mark">
              🌶️
            </span>

            <span>
              <b>BYADGI</b>

              <strong>
                CHILLI HUB
              </strong>

              <small>
                All Chilli Brands. One Hub.
              </small>
            </span>
          </Link>

          {/* SEARCH */}
          <div className="search">
            <input
              aria-label="Search products"
             placeholder="Search chilli brands or products..."
              onChange={(event) =>
                onSearch(
                  event.target.value
                )
              }
            />

            <button
              aria-label="Search"
            >
              ⌕
            </button>
          </div>

          {/* ACTIONS */}
          <div className="head-actions">

            {checkingSession ? (
              <button
                disabled
                style={{
                  opacity: 0.7,
                  cursor: "default",
                }}
              >
                Checking...
              </button>
            ) : retailer ? (
              <>
                {/* SHOP / ACCOUNT */}
                <Link
                  href="/retailer"
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <button
                    title="B2B Retailer Account"
                  >
                    🏪{" "}
                    <span>
                      {
                        retailer.retailer
                          .shopName
                      }
                    </span>
                  </button>
                </Link>

                {/* MY ORDERS */}
                <Link
                  href="/retailer"
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <button
                    title="My Orders"
                  >
                    📦{" "}
                    <span>
                      My Orders
                    </span>
                  </button>
                </Link>

                {/* LOGOUT */}
                <button
                  onClick={logout}
                  title="Logout"
                >
                  🚪{" "}
                  <span>
                    Logout
                  </span>
                </button>
              </>
            ) : (
              /* LOGIN */
              <button
                onClick={onLogin}
              >
                ♙{" "}
                <span>
                  Login / Register
                </span>
              </button>
            )}

            {/* CART */}
            <button
              onClick={() =>
                setOpen(true)
              }
              title="My Cart"
            >
              🛒{" "}
              <span>
                My Cart
              </span>

              <i>{count}</i>
            </button>

          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav
        id="nav"
        className={
          menuOpen
            ? "mobile-open"
            : ""
        }
      >
        <div className="nav-inner">

          <a
            className="categories"
            href="#products"
          >
            ☰ &nbsp; ALL CATEGORIES
          </a>

          <Link
            className="active"
            href="/"
          >
            HOME
          </Link>

          <a href="#brands">
            SHOP BY BRAND
          </a>

          <a href="#products">
            CHILLI POWDER
          </a>

          <a href="#dry">
            DRY CHILLI
          </a>

          <a href="#bulk">
            B2B / BULK ORDERS
          </a>

          <a href="#about">
            ABOUT US
          </a>

          <a href="#footer">
            CONTACT US
          </a>

        </div>
      </nav>
    </>
  );
}