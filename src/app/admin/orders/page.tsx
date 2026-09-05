"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  orderNumber: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  status: string;
  shippingStatus: string;
  dispatchMethod: "DELHIVERY" | "TRANSPORT" | null;
  customerName: string | null;
  customerMobile: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
  total: string;
  awbNumber: string | null;
  trackingUrl: string | null;
  transportName: string | null;
  lrNumber: string | null;
  packageCount: number | null;
  totalWeight: string | null;
  dispatchNotes: string | null;
  items: Array<{
    productName: string;
    brandName: string;
    packSizeLabel: string;
    quantity: number;
    unitPrice: string;
  }>;
  createdAt: string;
};

const statuses = [
  "PENDING",
  "PACKED",
  "DISPATCHED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
];

export default function AdminOrdersPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/admin/login?next=/admin/orders");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();
      setOrders(data);

      if (selected) {
        const updatedSelected = data.find(
          (order: Order) => order.id === selected.id
        );

        if (updatedSelected) {
          setSelected(updatedSelected);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setCheckingAuth(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveDispatch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selected) return;

    setSaving(true);
    setMessage("");

    try {
      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());

      const response = await fetch(
        `/api/admin/orders/${selected.id}/dispatch`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to save.");
      } else {
        setMessage("Dispatch details saved.");
        setSelected(data.order);
        await load();
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to save dispatch details.");
    } finally {
      setSaving(false);
    }
  }

  async function generateInvoice() {
    if (!selected) return;

    setGeneratingInvoice(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${selected.id}/invoice`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Unable to generate invoice."
        );
        return;
      }

      setSelected(data.order);
      await load();

      setMessage(
        `Invoice generated: ${data.invoiceNumber}`
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to generate invoice.");
    } finally {
      setGeneratingInvoice(false);
    }
  }

  function printInvoice() {
    if (!selected?.invoiceNumber) {
      setMessage("Generate the invoice first.");
      return;
    }

    window.open(
      `/admin/orders/${selected.id}/invoice`,
      "_blank"
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking admin access...
      </div>
    );
  }

  return (
    <main
      className="container"
      style={{ padding: "28px 0 55px" }}
    >
      <div
        className="section-row"
        style={{ alignItems: "flex-start", gap: 12 }}
      >
        <div>
          <h1 style={{ marginBottom: 4 }}>Order Dispatch</h1>
          <p style={{ margin: 0, color: "#777", fontSize: 12 }}>
            Admin — dispatch methods are Delhivery and Transport only.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn green" onClick={load}>
            REFRESH
          </button>

          <button
            className="btn"
            onClick={async () => {
              await fetch("/api/admin/logout", {
                method: "POST",
              });

              window.location.href = "/admin/login";
            }}
          >
            LOG OUT
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : !orders.length ? (
        <div
          className="detail-card"
          style={{ display: "block", marginTop: 16 }}
        >
          <h2>No orders yet</h2>
          <p>
            Place an online order from the cart first. It will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, .9fr) minmax(0, 1.1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* ORDER LIST */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 9,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 17 }}>
                Orders ({orders.length})
              </h2>
              <span style={{ color: "#777", fontSize: 11 }}>
                Select an order
              </span>
            </div>

            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => {
                  setSelected(order);
                  setMessage("");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 8,
                  padding: "12px 13px",
                  border:
                    selected?.id === order.id
                      ? "2px solid #b32020"
                      : "1px solid #e1e1e1",
                  borderRadius: 9,
                  background: "#fff",
                  cursor: "pointer",
                  boxShadow:
                    selected?.id === order.id
                      ? "0 4px 14px rgba(179,32,32,.08)"
                      : "0 2px 7px rgba(0,0,0,.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: 13 }}>
                    {order.orderNumber}
                  </strong>
                  <strong style={{ color: "#b32020", fontSize: 13 }}>
                    ₹{order.total}
                  </strong>
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    color: "#333",
                  }}
                >
                  {order.customerName || "Customer"} ·{" "}
                  {order.customerMobile || "No mobile"}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    color: "#777",
                  }}
                >
                  {order.shippingCity || "-"},{" "}
                  {order.shippingState || "-"} -{" "}
                  {order.shippingPincode || "-"}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 7px",
                      borderRadius: 5,
                      background: "#edf8f0",
                      color: "#13763a",
                      fontSize: 8,
                      fontWeight: 900,
                    }}
                  >
                    {order.shippingStatus}
                  </span>

                  {order.dispatchMethod && (
                    <span style={{ fontSize: 9, color: "#666" }}>
                      {order.dispatchMethod}
                    </span>
                  )}

                  {order.invoiceNumber && (
                    <span style={{ fontSize: 9, color: "#666" }}>
                      Invoice: {order.invoiceNumber}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* SELECTED ORDER */}
          <div
            className="detail-card"
            style={{
              display: "block",
              padding: 18,
              position: "sticky",
              top: 12,
            }}
          >
            {!selected ? (
              <div style={{ textAlign: "center", padding: "30px 10px" }}>
                <div style={{ fontSize: 34 }}>📦</div>
                <h2 style={{ margin: "8px 0 4px", fontSize: 18 }}>
                  Select an order
                </h2>
                <p style={{ margin: 0, color: "#777", fontSize: 11 }}>
                  Choose an order from the list to manage dispatch and invoice.
                </p>
              </div>
            ) : (
              <>
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
                    <p
                      style={{
                        margin: 0,
                        color: "#07823f",
                        fontSize: 9,
                        fontWeight: 900,
                      }}
                    >
                      SELECTED ORDER
                    </p>
                    <h2 style={{ margin: "4px 0 5px", fontSize: 20 }}>
                      {selected.orderNumber}
                    </h2>
                    <p style={{ margin: 0, fontSize: 11, color: "#555" }}>
                      {selected.customerName || "Customer"} ·{" "}
                      {selected.customerMobile || "No mobile"}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "#fff5e8",
                      color: "#9a5b00",
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    ₹{selected.total}
                  </span>
                </div>

                {selected.invoiceNumber && (
                  <div
                    style={{
                      margin: "13px 0",
                      padding: "9px 11px",
                      background: "#f0fff4",
                      border: "1px solid #b7e4c7",
                      borderRadius: 7,
                      fontSize: 11,
                    }}
                  >
                    <b>Invoice:</b> {selected.invoiceNumber}
                    {selected.invoiceDate && (
                      <>
                        {" · "}
                        <small>
                          {new Date(
                            selected.invoiceDate
                          ).toLocaleDateString("en-IN")}
                        </small>
                      </>
                    )}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 13,
                    padding: 11,
                    border: "1px solid #eee",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <b style={{ fontSize: 11 }}>Items</b>

                  <div style={{ marginTop: 7 }}>
                    {selected.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "7px 0",
                          borderBottom:
                            i < selected.items.length - 1
                              ? "1px solid #e8e8e8"
                              : "0",
                          fontSize: 10,
                        }}
                      >
                        <span>
                          <b>{item.brandName}</b> — {item.productName}
                          <br />
                          <span style={{ color: "#777" }}>
                            {item.packSizeLabel} × {item.quantity}
                          </span>
                        </span>
                        <b style={{ whiteSpace: "nowrap" }}>
                          ₹{item.unitPrice}
                        </b>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={saveDispatch}
                  style={{ marginTop: 14 }}
                >
                  <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>
                    Dispatch Details
                  </h3>

                  <div
                    className="form-grid"
                    style={{ margin: 0, gap: 8 }}
                  >
                    <select
                      name="dispatchMethod"
                      defaultValue={
                        selected.dispatchMethod || "DELHIVERY"
                      }
                      required
                    >
                      <option value="DELHIVERY">Delhivery</option>
                      <option value="TRANSPORT">Transport</option>
                    </select>

                    <select
                      name="shippingStatus"
                      defaultValue={selected.shippingStatus}
                      required
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>

                    <input
                      name="awbNumber"
                      defaultValue={selected.awbNumber || ""}
                      placeholder="Delhivery AWB"
                    />

                    <input
                      name="trackingUrl"
                      defaultValue={selected.trackingUrl || ""}
                      placeholder="Delhivery tracking URL"
                    />

                    <input
                      name="transportName"
                      defaultValue={selected.transportName || ""}
                      placeholder="Transport name"
                    />

                    <input
                      name="lrNumber"
                      defaultValue={selected.lrNumber || ""}
                      placeholder="LR number"
                    />

                    <input
                      name="packageCount"
                      defaultValue={selected.packageCount || ""}
                      placeholder="No. of bags / packages"
                      type="number"
                      min="1"
                    />

                    <input
                      name="totalWeight"
                      defaultValue={selected.totalWeight || ""}
                      placeholder="Total weight (kg)"
                      type="number"
                      min="0"
                      step="0.01"
                    />

                    <textarea
                      name="dispatchNotes"
                      defaultValue={selected.dispatchNotes || ""}
                      placeholder="Dispatch notes"
                    />
                  </div>

                  {message && (
                    <p
                      style={{
                        margin: "10px 0 0",
                        color:
                          message.includes("saved") ||
                          message.includes("generated")
                            ? "green"
                            : "#b00020",
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {message}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 7,
                      marginTop: 11,
                    }}
                  >
                    <button
                      className="btn red"
                      disabled={saving}
                    >
                      {saving
                        ? "SAVING..."
                        : "SAVE DISPATCH DETAILS"}
                    </button>

                    <button
                      type="button"
                      className="btn green"
                      onClick={generateInvoice}
                      disabled={generatingInvoice}
                    >
                      {generatingInvoice
                        ? "GENERATING..."
                        : selected.invoiceNumber
                          ? `INVOICE: ${selected.invoiceNumber}`
                          : "GENERATE INVOICE"}
                    </button>

                    {selected.invoiceNumber && (
                      <button
                        type="button"
                        className="btn"
                        onClick={printInvoice}
                      >
                        PRINT INVOICE
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 820px) {
          main > div:nth-of-type(2) {
            grid-template-columns: 1fr !important;
          }

          .detail-card {
            position: static !important;
          }
        }

        @media (max-width: 560px) {
          .section-row {
            flex-direction: column !important;
          }

          .section-row > div:last-child {
            width: 100%;
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </main>
  );
}
