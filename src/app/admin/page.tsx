"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DashboardStats = {
  orders: number;
  paidOrders: number;
  pendingOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  retailers: number;
  approvedRetailers: number;
  products: number;
  activeProducts: number;
  brands: number;
  lowStockItems: number;
  revenue: number;
  todayOrders: number;
  todayRevenue: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerMobile: string | null;
  shippingCity: string | null;
  shippingStatus: string;
  total: number;
  grandTotal: number;
  createdAt: string;
  invoiceNumber: string | null;
  payments: Array<{
    status: string;
  }>;
};

type DashboardData = {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
};

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function statusStyle(status: string) {
  if (status === "DELIVERED") {
    return {
      background: "#edf8f0",
      color: "#13763a",
    };
  }

  if (
    status === "DISPATCHED" ||
    status === "IN_TRANSIT" ||
    status === "OUT_FOR_DELIVERY"
  ) {
    return {
      background: "#eef6ff",
      color: "#1769aa",
    };
  }

  if (status === "EXCEPTION") {
    return {
      background: "#fff0f0",
      color: "#b32020",
    };
  }

  return {
    background: "#fff6e8",
    color: "#9a5b00",
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/admin/login?next=/admin");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load dashboard."
        );
      }

      setData(result);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <main
        className="container"
        style={{
          padding: "45px 0 70px",
        }}
      >
        <div className="detail-card">
          <h2>Loading Dashboard...</h2>
          <p>Fetching live business data.</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main
        className="container"
        style={{
          padding: "45px 0 70px",
        }}
      >
        <div className="detail-card">
          <h2>Dashboard Error</h2>
          <p>{error || "Unable to load dashboard."}</p>

          <button
            className="btn green"
            onClick={() => loadDashboard()}
          >
            TRY AGAIN
          </button>
        </div>
      </main>
    );
  }

  const { stats, recentOrders } = data;

  return (
    <main
      className="container"
      style={{
        padding: "28px 0 65px",
      }}
    >
      {/* HEADER */}
      <div
        className="section-row"
        style={{
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#07823f",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: ".6px",
            }}
          >
            BYADGI CHILLI HUB
          </p>

          <h1
            style={{
              margin: "4px 0",
              fontSize: 25,
            }}
          >
            Admin Dashboard
          </h1>

          <p
            style={{
              margin: 0,
              color: "#777",
              fontSize: 11,
            }}
          >
            Live overview of your orders, sales, products and retailers.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn green"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? "REFRESHING..." : "REFRESH"}
          </button>

          <Link
            href="/admin/orders"
            className="btn"
          >
            ORDERS
          </Link>

          <Link
            href="/admin/products"
            className="btn"
          >
            PRODUCTS
          </Link>

          <button
            className="btn"
            onClick={logout}
          >
            LOG OUT
          </button>
        </div>
      </div>

      {/* TODAY */}
      <div
        style={{
          marginTop: 22,
          padding: 16,
          borderRadius: 12,
          background:
            "linear-gradient(135deg, #fff7ef, #fff)",
          border: "1px solid #eadfd3",
        }}
      >
        <div
          style={{
            color: "#b32020",
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: ".6px",
          }}
        >
          TODAY
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 15,
            marginTop: 7,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 950,
              }}
            >
              {money(stats.todayRevenue)}
            </div>

            <small style={{ color: "#777" }}>
              Paid revenue today
            </small>
          </div>

          <div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 950,
              }}
            >
              {stats.todayOrders}
            </div>

            <small style={{ color: "#777" }}>
              Orders received today
            </small>
          </div>
        </div>
      </div>

      {/* MAIN STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginTop: 12,
        }}
      >
        <div className="dashboard-stat">
          <span>💰</span>
          <b>{money(stats.revenue)}</b>
          <small>Total paid revenue</small>
        </div>

        <div className="dashboard-stat">
          <span>📦</span>
          <b>{stats.orders}</b>
          <small>Total orders</small>
        </div>

        <div className="dashboard-stat">
          <span>💳</span>
          <b>{stats.paidOrders}</b>
          <small>Paid orders</small>
        </div>

        <div className="dashboard-stat">
          <span>⏳</span>
          <b>{stats.pendingOrders}</b>
          <small>Pending / packed</small>
        </div>
      </div>

      {/* OPERATIONS */}
      <div
        style={{
          marginTop: 25,
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 17,
          }}
        >
          Order Operations
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <div className="dashboard-stat">
          <span>⏱️</span>
          <b>{stats.pendingOrders}</b>
          <small>Pending dispatch</small>
        </div>

        <div className="dashboard-stat">
          <span>🚚</span>
          <b>{stats.dispatchedOrders}</b>
          <small>Dispatched / transit</small>
        </div>

        <div className="dashboard-stat">
          <span>✅</span>
          <b>{stats.deliveredOrders}</b>
          <small>Delivered</small>
        </div>

        <div className="dashboard-stat">
          <span>⚠️</span>
          <b>{stats.lowStockItems}</b>
          <small>Low / out of stock</small>
        </div>
      </div>

      {/* BUSINESS */}
      <div
        style={{
          marginTop: 25,
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 17,
          }}
        >
          Business Overview
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <div className="dashboard-stat">
          <span>🏪</span>
          <b>{stats.retailers}</b>
          <small>Total retailers</small>
        </div>

        <div className="dashboard-stat">
          <span>✓</span>
          <b>{stats.approvedRetailers}</b>
          <small>Approved retailers</small>
        </div>

        <div className="dashboard-stat">
          <span>🌶️</span>
          <b>{stats.products}</b>
          <small>Total products</small>
        </div>

        <div className="dashboard-stat">
          <span>🏷️</span>
          <b>{stats.brands}</b>
          <small>Brands</small>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div
        style={{
          marginTop: 28,
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
            }}
          >
            Recent Orders
          </h2>

          <small style={{ color: "#888" }}>
            Latest orders from your database
          </small>
        </div>

        <Link
          href="/admin/orders"
          className="btn"
        >
          VIEW ALL
        </Link>
      </div>

      <div
        style={{
          border: "1px solid #e5dfd7",
          borderRadius: 10,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {recentOrders.length === 0 ? (
          <div
            style={{
              padding: 25,
              textAlign: "center",
              color: "#777",
            }}
          >
            No orders yet.
          </div>
        ) : (
          recentOrders.map((order, index) => {
            const payment =
              order.payments?.[0]?.status || "PENDING";

            const status = statusStyle(
              order.shippingStatus
            );

            return (
              <div
                key={order.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.2fr 1.3fr .7fr .8fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  borderBottom:
                    index === recentOrders.length - 1
                      ? "0"
                      : "1px solid #eee",
                }}
              >
                <div>
                  <b
                    style={{
                      fontSize: 11,
                    }}
                  >
                    {order.orderNumber}
                  </b>

                  <small
                    style={{
                      display: "block",
                      marginTop: 3,
                      color: "#777",
                      fontSize: 9,
                    }}
                  >
                    {new Date(
                      order.createdAt
                    ).toLocaleDateString("en-IN")}
                  </small>
                </div>

                <div>
                  <b
                    style={{
                      fontSize: 10,
                    }}
                  >
                    {order.customerName || "Customer"}
                  </b>

                  <small
                    style={{
                      display: "block",
                      marginTop: 2,
                      color: "#777",
                      fontSize: 9,
                    }}
                  >
                    {order.shippingCity || "-"}
                  </small>
                </div>

                <div>
                  <b
                    style={{
                      fontSize: 11,
                    }}
                  >
                    {money(
                      order.grandTotal > 0
                        ? order.grandTotal
                        : order.total
                    )}
                  </b>

                  <small
                    style={{
                      display: "block",
                      marginTop: 3,
                      color:
                        payment === "PAID"
                          ? "#13763a"
                          : "#9a5b00",
                      fontSize: 8,
                      fontWeight: 900,
                    }}
                  >
                    {payment}
                  </small>
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "5px 7px",
                      borderRadius: 5,
                      background: status.background,
                      color: status.color,
                      fontSize: 8,
                      fontWeight: 900,
                    }}
                  >
                    {order.shippingStatus}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div
        style={{
          marginTop: 28,
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 17,
          }}
        >
          Quick Actions
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <Link
          href="/admin/orders"
          className="dashboard-action"
        >
          <span>📦</span>
          <b>Manage Orders</b>
          <small>Dispatch, invoice and print</small>
        </Link>

        <Link
          href="/admin/products"
          className="dashboard-action"
        >
          <span>🌶️</span>
          <b>Manage Products</b>
          <small>Products, prices and stock</small>
        </Link>

        <Link
          href="/admin/retailers"
          className="dashboard-action"
        >
          <span>🏪</span>
          <b>Manage Retailers</b>
          <small>Retailer accounts and approvals</small>
        </Link>
      </div>

      <style jsx>{`
        .dashboard-stat {
          padding: 15px;
          border: 1px solid #e5dfd7;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.025);
        }

        .dashboard-stat span {
          display: block;
          font-size: 18px;
          margin-bottom: 6px;
        }

        .dashboard-stat b {
          display: block;
          font-size: 19px;
          font-weight: 950;
          color: #171717;
        }

        .dashboard-stat small {
          display: block;
          margin-top: 3px;
          color: #777;
          font-size: 9px;
        }

        .dashboard-action {
          display: block;
          padding: 15px;
          border: 1px solid #e5dfd7;
          border-radius: 10px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .dashboard-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
        }

        .dashboard-action span {
          display: block;
          font-size: 22px;
          margin-bottom: 7px;
        }

        .dashboard-action b {
          display: block;
          font-size: 12px;
        }

        .dashboard-action small {
          display: block;
          margin-top: 4px;
          color: #777;
          font-size: 9px;
        }

        @media (max-width: 850px) {
          .dashboard-stat {
            min-width: 0;
          }

          .dashboard-action {
            min-width: 0;
          }
        }

        @media (max-width: 650px) {
          .dashboard-stat {
            padding: 12px;
          }

          .dashboard-stat b {
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}