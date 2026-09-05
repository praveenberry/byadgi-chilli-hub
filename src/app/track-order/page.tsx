"use client";

import { FormEvent, useState } from "react";

type Order = {
  orderNumber: string;
  status: string;
  shippingStatus: string;
  total: string;
  customerName: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
  dispatchMethod: "DELHIVERY" | "TRANSPORT" | null;
  awbNumber: string | null;
  trackingUrl: string | null;
  transportName: string | null;
  lrNumber: string | null;
  packageCount: number | null;
  totalWeight: string | null;
  dispatchDate: string | null;
  deliveryDate: string | null;
  createdAt: string;
  items: {
    productName: string;
    brandName: string;
    packSizeLabel: string;
    unitPrice: string;
    quantity: number;
  }[];
};

const statusSteps = [
  { key: "PENDING", label: "Order Confirmed" },
  { key: "PACKED", label: "Packed" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

function getStepIndex(status: string) {
  const index = statusSteps.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(value: string) {
  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function trackOrder(event: FormEvent) {
    event.preventDefault();

    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          mobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to find order.");
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order
    ? getStepIndex(order.shippingStatus)
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Track Your Order
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your order number and registered mobile number.
          </p>
        </div>

        <form
          onSubmit={trackOrder}
          className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow"
        >
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Order Number
              </label>

              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="BCH-12345678"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Mobile Number
              </label>

              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                inputMode="numeric"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Checking..." : "Track Order"}
            </button>
          </div>
        </form>

        {order && (
          <section className="mt-8 space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order Number
                  </p>

                  <h2 className="text-2xl font-bold">
                    {order.orderNumber}
                  </h2>

                  <p className="mt-1 text-gray-600">
                    {order.customerName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Order Total
                  </p>

                  <p className="text-xl font-bold">
                    {money(order.total)}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <div className="grid gap-4 md:grid-cols-6">
                  {statusSteps.map((step, index) => {
                    const completed = index <= currentStep;

                    return (
                      <div
                        key={step.key}
                        className="text-center"
                      >
                        <div
                          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                            completed
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <p className="mt-2 text-xs font-medium">
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold">
                Dispatch Details
              </h2>

              {order.dispatchMethod === "DELHIVERY" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">
                      Courier
                    </p>
                    <p className="font-semibold">
                      Delhivery
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      AWB Number
                    </p>
                    <p className="font-semibold">
                      {order.awbNumber || "Not assigned yet"}
                    </p>
                  </div>

                  {order.trackingUrl && (
                    <div className="md:col-span-2">
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block rounded-lg px-5 py-3 font-semibold text-white"
                      >
                        Track Delhivery Shipment
                      </a>
                    </div>
                  )}
                </div>
              )}

              {order.dispatchMethod === "TRANSPORT" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">
                      Transport
                    </p>
                    <p className="font-semibold">
                      {order.transportName || "Not assigned yet"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      LR Number
                    </p>
                    <p className="font-semibold">
                      {order.lrNumber || "Not assigned yet"}
                    </p>
                  </div>
                </div>
              )}

              {!order.dispatchMethod && (
                <p className="mt-4 text-gray-600">
                  Dispatch details will appear after your order is dispatched.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold">
                Order Items
              </h2>

              <div className="mt-4 space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap justify-between gap-3 border-b pb-3"
                  >
                    <div>
                      <p className="font-medium">
                        {item.productName}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.brandName} • {item.packSizeLabel}
                      </p>
                    </div>

                    <div className="text-right">
                      <p>
                        {item.quantity} × {money(item.unitPrice)}
                      </p>

                      <p className="font-semibold">
                        {money(
                          String(
                            Number(item.unitPrice) * item.quantity
                          )
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold">
                Delivery Information
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">
                    City
                  </p>
                  <p>{order.shippingCity || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    State
                  </p>
                  <p>{order.shippingState || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Pincode
                  </p>
                  <p>{order.shippingPincode || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Packages
                  </p>
                  <p>{order.packageCount ?? "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Weight
                  </p>
                  <p>
                    {order.totalWeight
                      ? `${order.totalWeight} kg`
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Dispatch Date
                  </p>
                  <p>{formatDate(order.dispatchDate)}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}