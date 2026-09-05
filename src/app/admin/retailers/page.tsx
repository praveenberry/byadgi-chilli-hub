"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Retailer = {
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
  isApproved: boolean;
  user: {
    id: string;
    name: string | null;
    mobile: string | null;
    email: string | null;
    createdAt: string;
  };
};

type Filter = "ALL" | "PENDING" | "APPROVED";

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
const [products, setProducts] = useState<any[]>([]);
const [editingProduct, setEditingProduct] =
  useState<any | null>(null);
const [productLoading, setProductLoading] =
  useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  async function loadRetailers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/retailers",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.href =
          "/admin/login?next=/admin/retailers";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load retailers."
        );
      }

      setRetailers(
        Array.isArray(data.retailers)
          ? data.retailers
          : []
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load retailers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRetailers();
  }, []);

  async function updateApproval(
    retailerId: string,
    approved: boolean
  ) {
    try {
      setBusyId(retailerId);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/admin/retailers",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            retailerId,
            approved,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href =
          "/admin/login?next=/admin/retailers";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update retailer."
        );
      }

      setRetailers((current) =>
        current.map((retailer) =>
          retailer.id === retailerId
            ? {
                ...retailer,
                isApproved: approved,
              }
            : retailer
        )
      );

      setMessage(
        approved
          ? "Retailer approved successfully."
          : "Retailer approval removed."
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to update retailer."
      );
    } finally {
      setBusyId("");
    }
  }

  const pendingCount = retailers.filter(
    (retailer) => !retailer.isApproved
  ).length;

  const approvedCount = retailers.filter(
    (retailer) => retailer.isApproved
  ).length;

  const filteredRetailers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return retailers.filter((retailer) => {
      if (
        filter === "PENDING" &&
        retailer.isApproved
      ) {
        return false;
      }

      if (
        filter === "APPROVED" &&
        !retailer.isApproved
      ) {
        return false;
      }

      if (!query) return true;

      return [
        retailer.shopName,
        retailer.ownerName,
        retailer.mobile,
        retailer.email,
        retailer.gstin,
        retailer.city,
        retailer.state,
        retailer.pincode,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [retailers, search, filter]);

  if (loading) {
    return (
      <main
        className="container"
        style={{
          padding: "40px 0 70px",
        }}
      >
        <div className="detail-card">
          <h1>B2B Retailers</h1>
          <p>
            Loading retailer applications...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="container"
      style={{
        padding: "28px 0 70px",
      }}
    >
      {/* HEADER */}
      <div
        className="section-row"
        style={{
          alignItems: "flex-start",
          gap: 15,
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
            B2B Retailers
          </h1>

          <p
            style={{
              margin: 0,
              color: "#777",
              fontSize: 11,
            }}
          >
            Review and manage retailer
            applications.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/admin"
            className="btn"
          >
            DASHBOARD
          </Link>

          <Link
            href="/admin/orders"
            className="btn"
          >
            ORDERS
          </Link>

          <button
            className="btn green"
            onClick={loadRetailers}
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 10,
          marginTop: 22,
        }}
      >
        <StatCard
          icon="🏪"
          value={retailers.length}
          label="TOTAL RETAILERS"
        />

        <StatCard
          icon="⏳"
          value={pendingCount}
          label="PENDING APPLICATIONS"
        />

        <StatCard
          icon="✅"
          value={approvedCount}
          label="APPROVED RETAILERS"
        />
      </div>

      {/* MESSAGES */}
      {message && (
        <div
          style={{
            marginTop: 15,
            padding: 12,
            borderRadius: 8,
            background: "#e9f8ee",
            color: "#087f23",
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 15,
            padding: 12,
            borderRadius: 8,
            background: "#fdeaea",
            color: "#b00020",
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {error}
        </div>
      )}

      {/* SEARCH + FILTER */}
      <div
        style={{
          marginTop: 24,
          padding: 14,
          border: "1px solid #e5dfd7",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr auto",
            gap: 10,
          }}
        >
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search shop, owner, mobile, GSTIN, city..."
            style={{
              width: "100%",
              minHeight: 42,
              padding: "0 12px",
              border: "1px solid #ddd",
              borderRadius: 7,
            }}
          />

          <button
            className="btn"
            onClick={() => setSearch("")}
          >
            CLEAR
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <FilterButton
            active={filter === "ALL"}
            onClick={() => setFilter("ALL")}
          >
            ALL ({retailers.length})
          </FilterButton>

          <FilterButton
            active={filter === "PENDING"}
            onClick={() => setFilter("PENDING")}
          >
            PENDING ({pendingCount})
          </FilterButton>

          <FilterButton
            active={filter === "APPROVED"}
            onClick={() =>
              setFilter("APPROVED")
            }
          >
            APPROVED ({approvedCount})
          </FilterButton>
        </div>
      </div>

      {/* RESULT COUNT */}
      <div
        style={{
          marginTop: 22,
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 17,
          }}
        >
          Retailer Applications
        </h2>

        <small
          style={{
            color: "#888",
          }}
        >
          Showing {filteredRetailers.length} of{" "}
          {retailers.length} retailers
        </small>
      </div>

      {/* RETAILER LIST */}
      {!filteredRetailers.length ? (
        <div
          className="detail-card"
          style={{
            display: "block",
            textAlign: "center",
            padding: 30,
          }}
        >
          <div
            style={{
              fontSize: 35,
            }}
          >
            🏪
          </div>

          <h2>
            No retailers found
          </h2>

          <p
            style={{
              color: "#777",
            }}
          >
            Try another search or filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {filteredRetailers.map(
            (retailer) => (
              <RetailerCard
                key={retailer.id}
                retailer={retailer}
                busy={
                  busyId === retailer.id
                }
                onApprove={() =>
                  updateApproval(
                    retailer.id,
                    true
                  )
                }
                onRemoveApproval={() =>
                  updateApproval(
                    retailer.id,
                    false
                  )
                }
              />
            )
          )}
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #e5dfd7",
        borderRadius: 10,
        background: "#fff",
        boxShadow:
          "0 2px 8px rgba(0,0,0,.025)",
      }}
    >
      <div
        style={{
          fontSize: 20,
          marginBottom: 7,
        }}
      >
        {icon}
      </div>

      <b
        style={{
          display: "block",
          fontSize: 21,
          fontWeight: 950,
        }}
      >
        {value}
      </b>

      <small
        style={{
          color: "#777",
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: ".4px",
        }}
      >
        {label}
      </small>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active
          ? "1px solid #b32020"
          : "1px solid #ddd",
        borderRadius: 6,
        padding: "7px 11px",
        background: active
          ? "#fff1f1"
          : "#fff",
        color: active
          ? "#b32020"
          : "#555",
        fontSize: 9,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function RetailerCard({
  retailer,
  busy,
  onApprove,
  onRemoveApproval,
}: {
  retailer: Retailer;
  busy: boolean;
  onApprove: () => void;
  onRemoveApproval: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5dfd7",
        borderRadius: 12,
        padding: 18,
        background: "#fff",
        boxShadow:
          "0 2px 8px rgba(0,0,0,.025)",
      }}
    >
      {/* TOP */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
            }}
          >
            {retailer.shopName}
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              color: "#555",
              fontSize: 10,
            }}
          >
            Owner:{" "}
            <b>{retailer.ownerName}</b>
          </p>
        </div>

        <span
          style={{
            padding: "6px 10px",
            borderRadius: 20,
            fontSize: 8,
            fontWeight: 900,
            background: retailer.isApproved
              ? "#e9f8ee"
              : "#fff3cd",
            color: retailer.isApproved
              ? "#087f23"
              : "#856404",
          }}
        >
          {retailer.isApproved
            ? "✓ APPROVED"
            : "⏳ PENDING"}
        </span>
      </div>

      {/* DETAILS */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <Detail
          label="MOBILE"
          value={retailer.mobile}
        />

        <Detail
          label="EMAIL"
          value={retailer.email || "-"}
        />

        <Detail
          label="GSTIN"
          value={
            retailer.gstin ||
            "Not provided"
          }
        />

        <Detail
          label="CITY"
          value={retailer.city}
        />

        <Detail
          label="STATE"
          value={retailer.state}
        />

        <Detail
          label="PINCODE"
          value={retailer.pincode}
        />
      </div>

      {/* ADDRESS */}
      <div
        style={{
          marginTop: 15,
          padding: 11,
          borderRadius: 7,
          background: "#faf8f5",
          fontSize: 10,
        }}
      >
        <b>ADDRESS</b>

        <div
          style={{
            marginTop: 4,
            color: "#555",
          }}
        >
          {retailer.address}
        </div>
      </div>

      {/* REGISTERED */}
      {retailer.user?.createdAt && (
        <small
          style={{
            display: "block",
            marginTop: 10,
            color: "#999",
            fontSize: 8,
          }}
        >
          Registered:{" "}
          {new Date(
            retailer.user.createdAt
          ).toLocaleDateString("en-IN")}
        </small>
      )}

      {/* ACTION */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {!retailer.isApproved ? (
          <button
            className="btn green"
            disabled={busy}
            onClick={onApprove}
          >
            {busy
              ? "APPROVING..."
              : "✓ APPROVE RETAILER"}
          </button>
        ) : (
          <button
            className="btn red"
            disabled={busy}
            onClick={onRemoveApproval}
          >
            {busy
              ? "UPDATING..."
              : "REMOVE APPROVAL"}
          </button>
        )}

        <a
          href={`tel:${retailer.mobile}`}
          className="btn"
        >
          ☎ CALL
        </a>

        {retailer.email && (
          <a
            href={`mailto:${retailer.email}`}
            className="btn"
          >
            ✉ EMAIL
          </a>
        )}
      </div>
    </div>
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
      <small
        style={{
          display: "block",
          color: "#999",
          fontSize: 7,
          fontWeight: 900,
          letterSpacing: ".5px",
        }}
      >
        {label}
      </small>

      <div
        style={{
          marginTop: 3,
          fontSize: 10,
          fontWeight: 700,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}