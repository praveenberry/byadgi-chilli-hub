"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RetailerUser = {
  id: string;
  name: string | null;
  mobile: string;
  email: string | null;
  role: string;
  retailer: {
    id: string;
    shopName: string;
    ownerName: string;
    gstin: string | null;
    mobile: string;
    email: string | null;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
};

type OrderItem = {
  id: string;
  productName: string;
  brandName: string;
  packSizeLabel: string;
  unitPrice: string;
  quantity: number;
};

type RetailerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  shippingStatus: string;
  total: string;
  createdAt: string;
  invoiceNumber: string | null;
  dispatchMethod: string | null;
  awbNumber: string | null;
  transportName: string | null;
  lrNumber: string | null;
  packageCount: number | null;
  totalWeight: string | null;
  trackingUrl: string | null;
  dispatchDate: string | null;
  deliveryDate: string | null;
  dispatchNotes: string | null;
  items: OrderItem[];
  payments: {
    provider: string;
    status: string;
    amount: string;
    reference: string | null;
  }[];
};

export default function RetailerDashboard() {
  const [user, setUser] =
    useState<RetailerUser | null>(null);

  const [orders, setOrders] =
    useState<RetailerOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [ordersLoading, setOrdersLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setOrdersLoading(true);
      setError("");

      const accountResponse =
        await fetch(
          "/api/retailer/me",
          {
            cache: "no-store",
          }
        );

      const accountData =
        await accountResponse.json();

      if (
        !accountResponse.ok ||
        !accountData.authenticated
      ) {
        window.location.href = "/";
        return;
      }

      setUser(accountData.user);

      const ordersResponse =
        await fetch(
          "/api/retailer/orders",
          {
            cache: "no-store",
          }
        );

      const ordersData =
        await ordersResponse.json();

      if (!ordersResponse.ok) {
        throw new Error(
          ordersData.error ||
            "Unable to load orders."
        );
      }

      setOrders(
        Array.isArray(
          ordersData.orders
        )
          ? ordersData.orders
          : []
      );
    } catch (error) {
      console.error(
        "Retailer dashboard:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
      setOrdersLoading(false);
    }
  }

  async function logout() {
    try {
      setLoggingOut(true);

      await fetch(
        "/api/retailer/logout",
        {
          method: "POST",
        }
      );

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Logout:",
        error
      );

      setLoggingOut(false);
      setError(
        "Unable to logout."
      );
    }
  }

  if (loading) {
    return (
      <main
        style={{
          maxWidth: 1100,
          margin: "50px auto",
          padding: 20,
        }}
      >
        <h1>B2B Retailer Account</h1>
        <p>
          Loading your account...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        style={{
          maxWidth: 1100,
          margin: "50px auto",
          padding: 20,
        }}
      >
        <h1>B2B Retailer Account</h1>

        <p>
          {error ||
            "Unable to load account."}
        </p>

        <Link
          href="/"
          className="btn red"
        >
          BACK TO SHOP
        </Link>
      </main>
    );
  }

  const retailer =
    user.retailer;

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "30px auto",
        padding: "20px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 25,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            B2B Retailer Account
          </h1>

          <p
            style={{
              color: "#666",
              marginTop: 6,
            }}
          >
            Welcome,{" "}
            <strong>
              {retailer.shopName}
            </strong>
          </p>
        </div>

        <button
          className="btn red"
          onClick={logout}
          disabled={loggingOut}
        >
          {loggingOut
            ? "LOGGING OUT..."
            : "LOGOUT"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            padding: 14,
            marginBottom: 20,
            borderRadius: 8,
            background: "#fdeaea",
            color: "#b00020",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {/* VERIFIED */}
      <section
        style={{
          padding: 20,
          borderRadius: 12,
          background: "#e9f8ee",
          border:
            "1px solid #b8e5c4",
          marginBottom: 25,
        }}
      >
        <strong
          style={{
            fontSize: 18,
            color: "#087f23",
          }}
        >
          ✓ VERIFIED B2B RETAILER
        </strong>

        <p
          style={{
            marginBottom: 0,
            color: "#276b35",
          }}
        >
          {retailer.shopName} is an
          approved B2B retailer account.
          Special B2B pricing is active.
        </p>
      </section>

      {/* MY ORDERS */}
      <section
        style={{
          border:
            "1px solid #ddd",
          borderRadius: 12,
          padding: 25,
          marginBottom: 30,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 15,
          }}
        >
          <div>
            <h2
              style={{
                marginTop: 0,
                marginBottom: 5,
              }}
            >
              📦 My Orders
            </h2>

            <p
              style={{
                color: "#666",
                marginTop: 0,
              }}
            >
              Your B2B orders
            </p>
          </div>

          <button
            className="btn"
            onClick={loadDashboard}
            disabled={ordersLoading}
          >
            {ordersLoading
              ? "LOADING..."
              : "↻ REFRESH"}
          </button>
        </div>

        {/* Loading */}
        {ordersLoading && (
          <div
            style={{
              textAlign: "center",
              padding: 30,
              color: "#666",
            }}
          >
            Loading orders...
          </div>
        )}

        {/* No orders */}
        {!ordersLoading &&
          orders.length === 0 && (
            <div
              style={{
                marginTop: 20,
                padding: 30,
                textAlign: "center",
                border:
                  "1px dashed #ccc",
                borderRadius: 10,
              }}
            >
              <h3>
                No orders yet
              </h3>

              <p
                style={{
                  color: "#666",
                }}
              >
                Your successful B2B
                orders will appear here.
              </p>

              <Link
                href="/"
                className="btn red"
              >
                START SHOPPING
              </Link>
            </div>
          )}

        {/* ORDERS */}
        {!ordersLoading &&
          orders.length > 0 && (
            <div
              style={{
                marginTop: 20,
              }}
            >
              {orders.map(
                (order) => (
                  <div
                    key={order.id}
                    style={{
                      border:
                        "1px solid #ddd",
                      borderRadius: 12,
                      padding: 20,
                      marginBottom: 18,
                    }}
                  >
                    {/* Order top */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        flexWrap: "wrap",
                        gap: 15,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                          }}
                        >
                          {
                            order.orderNumber
                          }
                        </div>

                        <div
                          style={{
                            color: "#777",
                            fontSize: 13,
                            marginTop: 5,
                          }}
                        >
                          {new Date(
                            order.createdAt
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month:
                                "short",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                        }}
                      >
                        ₹
                        {Number(
                          order.total
                        ).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits:
                              2,
                          }
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap:
                          "wrap",
                        marginTop: 15,
                      }}
                    >
                      <span
                        style={{
                          padding:
                            "7px 12px",
                          borderRadius:
                            20,
                          background:
                            "#e9f8ee",
                          color:
                            "#087f23",
                          fontWeight:
                            700,
                          fontSize: 13,
                        }}
                      >
                        {order.status}
                      </span>

                      <span
                        style={{
                          padding:
                            "7px 12px",
                          borderRadius:
                            20,
                          background:
                            "#f2f2f2",
                          color: "#555",
                          fontWeight:
                            700,
                          fontSize: 13,
                        }}
                      >
                        {
                          order.shippingStatus
                        }
                      </span>
                    </div>

                    {/* Items */}
                    <div
                      style={{
                        marginTop: 18,
                        padding: 15,
                        borderRadius: 8,
                        background:
                          "#f7f7f7",
                      }}
                    >
                      <strong>
                        Order Items
                      </strong>

                      {order.items.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              gap: 15,
                              padding:
                                "12px 0",
                              borderBottom:
                                "1px solid #e5e5e5",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontWeight:
                                    700,
                                }}
                              >
                                {
                                  item.productName
                                }
                              </div>

                              <small
                                style={{
                                  color:
                                    "#777",
                                }}
                              >
                                {
                                  item.brandName
                                }{" "}
                                •{" "}
                                {
                                  item.packSizeLabel
                                }{" "}
                                ×{" "}
                                {
                                  item.quantity
                                }
                              </small>
                            </div>

                            <strong>
                              ₹
                              {(
                                Number(
                                  item.unitPrice
                                ) *
                                item.quantity
                              ).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits:
                                    2,
                                }
                              )}
                            </strong>
                          </div>
                        )
                      )}
                    </div>

                    {/* Payment */}
                    {order.payments
                      .length >
                      0 && (
                      <div
                        style={{
                          marginTop: 15,
                          fontSize: 13,
                          color: "#555",
                        }}
                      >
                        Payment:{" "}
                        <strong>
                          {
                            order
                              .payments[0]
                              .status
                          }
                        </strong>{" "}
                        •{" "}
                        {
                          order
                            .payments[0]
                            .provider
                        }
                      </div>
                    )}

                    {/* Dispatch */}
                    {(order.awbNumber ||
                      order.transportName ||
                      order.lrNumber ||
                      order.dispatchDate) && (
                      <div
                        style={{
                          marginTop: 15,
                          padding: 15,
                          borderRadius: 8,
                          background:
                            "#fff8e8",
                        }}
                      >
                        <strong>
                          🚚 Dispatch Details
                        </strong>

                        {order.dispatchMethod && (
                          <div
                            style={{
                              marginTop: 7,
                            }}
                          >
                            Method:{" "}
                            {
                              order.dispatchMethod
                            }
                          </div>
                        )}

                        {order.awbNumber && (
                          <div>
                            AWB:{" "}
                            <strong>
                              {
                                order.awbNumber
                              }
                            </strong>
                          </div>
                        )}

                        {order.transportName && (
                          <div>
                            Transport:{" "}
                            {
                              order.transportName
                            }
                          </div>
                        )}

                        {order.lrNumber && (
                          <div>
                            LR Number:{" "}
                            {
                              order.lrNumber
                            }
                          </div>
                        )}

                        {order.packageCount && (
                          <div>
                            Packages:{" "}
                            {
                              order.packageCount
                            }
                          </div>
                        )}

                        {order.totalWeight && (
                          <div>
                            Weight:{" "}
                            {
                              order.totalWeight
                            }
                          </div>
                        )}
                      </div>
                    )}

                    {/* Buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap:
                          "wrap",
                        marginTop: 18,
                      }}
                    >
                      <Link
                        href={`/track-order?order=${encodeURIComponent(
                          order.orderNumber
                        )}`}
                        className="btn"
                      >
                        TRACK ORDER
                      </Link>

                      {order.trackingUrl && (
                        <a
                          href={
                            order.trackingUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                        >
                          LIVE TRACKING
                        </a>
                      )}

                      {order.invoiceNumber && (
                        <span
                          style={{
                            padding:
                              "8px 12px",
                            borderRadius:
                              6,
                            background:
                              "#f2f2f2",
                            fontSize: 13,
                            fontWeight:
                              700,
                          }}
                        >
                          Invoice:{" "}
                          {
                            order.invoiceNumber
                          }
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </section>

      {/* QUICK ACTIONS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 15,
          marginBottom: 30,
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration:
              "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              border:
                "1px solid #ddd",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3>
              🛒 Shop Products
            </h3>

            <p
              style={{
                color: "#666",
              }}
            >
              Browse products with
              B2B pricing.
            </p>
          </div>
        </Link>

        <Link
          href="/track-order"
          style={{
            textDecoration:
              "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              border:
                "1px solid #ddd",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3>
              🔎 Track Order
            </h3>

            <p
              style={{
                color: "#666",
              }}
            >
              Track your orders.
            </p>
          </div>
        </Link>

        <div
          style={{
            border:
              "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3>
            💰 B2B Pricing
          </h3>

          <p
            style={{
              color: "#666",
            }}
          >
            Approved retailer
            pricing is active.
          </p>
        </div>
      </section>

      {/* ACCOUNT DETAILS */}
      <section
        style={{
          border:
            "1px solid #ddd",
          borderRadius: 12,
          padding: 25,
          background: "#fff",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Account Details
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <Detail
            label="Shop Name"
            value={
              retailer.shopName
            }
          />

          <Detail
            label="Owner Name"
            value={
              retailer.ownerName
            }
          />

          <Detail
            label="Mobile"
            value={
              retailer.mobile
            }
          />

          <Detail
            label="Email"
            value={
              retailer.email || "-"
            }
          />

          <Detail
            label="GSTIN"
            value={
              retailer.gstin ||
              "Not provided"
            }
          />

          <Detail
            label="Address"
            value={
              retailer.address
            }
          />

          <Detail
            label="City"
            value={
              retailer.city
            }
          />

          <Detail
            label="State"
            value={
              retailer.state
            }
          />

          <Detail
            label="Pincode"
            value={
              retailer.pincode
            }
          />
        </div>
      </section>

      {/* FOOTER ACTION */}
      <div
        style={{
          marginTop: 25,
        }}
      >
        <Link
          href="/"
          className="btn"
        >
          ← CONTINUE SHOPPING
        </Link>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          color: "#777",
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}