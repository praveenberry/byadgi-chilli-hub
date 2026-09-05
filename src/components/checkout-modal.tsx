"use client";

import { FormEvent, useState } from "react";
import type { DemoProduct } from "@/lib/products";

type Props = {
  items: Array<DemoProduct & { quantity: number }>;
  open: boolean;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
};

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill: {
        name: string;
        email: string;
        contact: string;
      };
      theme: {
        color: string;
      };
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void;
      modal?: {
        ondismiss?: () => void;
      };
    }) => {
      open: () => void;
    };
  }
}

export function CheckoutModal({
  items,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<"COD" | "ONLINE">("ONLINE");

  if (!open) return null;

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function createCodOrder(payload: {
    customerName: string;
    customerMobile: string;
    customerEmail: string;
    shipping: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      pincode: string;
    };
    items: Array<{
      id: string;
      quantity: number;
    }>;
  }) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to place order."
      );
    }

    onSuccess(data.order.orderNumber);
  }

  async function startOnlinePayment(payload: {
    customerName: string;
    customerMobile: string;
    customerEmail: string;
    shipping: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      pincode: string;
    };
    items: Array<{
      id: string;
      quantity: number;
    }>;
  }) {
    const scriptLoaded =
      await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error(
        "Unable to load Razorpay. Please check your internet connection."
      );
    }

    const createResponse = await fetch(
      "/api/payments/checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          items: payload.items,
        }),
      }
    );

    const createData =
      await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(
        createData.error ||
          "Unable to start payment."
      );
    }

    await new Promise<void>((resolve, reject) => {
      let finished = false;

      const finishSuccess = () => {
        if (!finished) {
          finished = true;
          resolve();
        }
      };

      const finishError = (message: string) => {
        if (!finished) {
          finished = true;
          reject(new Error(message));
        }
      };

      const razorpay =
        new window.Razorpay({
          key: createData.keyId,
          amount: createData.amount,
          currency: createData.currency,
          name: "BYADGI CHILLI HUB",
          description:
            "Retail Chilli Products",
          order_id: createData.orderId,

          prefill: {
            name: payload.customerName,
            email: payload.customerEmail,
            contact: payload.customerMobile,
          },

          theme: {
            color: "#b5121b",
          },

          handler: async (
            paymentResponse
          ) => {
            try {
              const verifyResponse =
                await fetch(
                  "/api/payments/checkout",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body: JSON.stringify({
                      action: "verify",

                      razorpay_order_id:
                        paymentResponse.razorpay_order_id,

                      razorpay_payment_id:
                        paymentResponse.razorpay_payment_id,

                      razorpay_signature:
                        paymentResponse.razorpay_signature,

                      customerName:
                        payload.customerName,

                      customerMobile:
                        payload.customerMobile,

                      customerEmail:
                        payload.customerEmail,

                      shipping:
                        payload.shipping,

                      items: payload.items,
                    }),
                  }
                );

              const verifyData =
                await verifyResponse.json();

              if (!verifyResponse.ok) {
                finishError(
                  verifyData.error ||
                    "Payment verification failed."
                );
                return;
              }

              onSuccess(
                verifyData.order.orderNumber
              );

              finishSuccess();
            } catch (verificationError) {
              finishError(
                verificationError instanceof
                  Error
                  ? verificationError.message
                  : "Payment verification failed."
              );
            }
          },

          modal: {
            ondismiss: () => {
              finishError(
                "Payment was cancelled."
              );
            },
          },
        });

      razorpay.open();
    });
  }

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const form = new FormData(
      event.currentTarget
    );

    const payload = {
      customerName: String(
        form.get("customerName") ?? ""
      ).trim(),

      customerMobile: String(
        form.get("customerMobile") ?? ""
      ).trim(),

      customerEmail: String(
        form.get("customerEmail") ?? ""
      ).trim(),

      shipping: {
        line1: String(
          form.get("line1") ?? ""
        ).trim(),

        line2: String(
          form.get("line2") ?? ""
        ).trim(),

        city: String(
          form.get("city") ?? ""
        ).trim(),

        state: String(
          form.get("state") ?? ""
        ).trim(),

        pincode: String(
          form.get("pincode") ?? ""
        ).trim(),
      },

      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      if (paymentMethod === "COD") {
        await createCodOrder(payload);
      } else {
        await startOnlinePayment(payload);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to place order."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal show">
      <div
        className="modal-box"
        style={{ maxWidth: 620 }}
      >
        <button
          className="close"
          onClick={onClose}
          aria-label="Close"
          disabled={busy}
        >
          ×
        </button>

        <h2>Place Your Order</h2>

        <p>
          Enter your delivery details and
          choose your payment method.
        </p>

        <form onSubmit={submit}>
          <div className="form-grid">
            <input
              name="customerName"
              placeholder="Full name *"
              required
            />

            <input
              name="customerMobile"
              placeholder="Mobile number *"
              required
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              title="Enter a valid 10 digit mobile number"
            />

            <input
              name="customerEmail"
              type="email"
              placeholder="Email (optional)"
            />

            <input
              name="pincode"
              placeholder="Delivery pincode *"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
            />

            <input
              name="line1"
              placeholder="Address *"
              required
            />

            <input
              name="line2"
              placeholder="Area / landmark"
            />

            <input
              name="city"
              placeholder="City *"
              required
            />

            <input
              name="state"
              placeholder="State *"
              required
            />
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 15,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <strong>
              Select Payment Method
            </strong>

            <label
              style={{
                display: "block",
                marginTop: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="ONLINE"
                checked={
                  paymentMethod === "ONLINE"
                }
                onChange={() =>
                  setPaymentMethod("ONLINE")
                }
              />{" "}
              💳 Online Payment
              <small
                style={{
                  display: "block",
                  marginLeft: 24,
                  color: "#666",
                }}
              >
                Pay securely using UPI,
                cards or net banking.
              </small>
            </label>

            <label
              style={{
                display: "block",
                marginTop: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={
                  paymentMethod === "COD"
                }
                onChange={() =>
                  setPaymentMethod("COD")
                }
              />{" "}
              💵 Cash on Delivery
              <small
                style={{
                  display: "block",
                  marginLeft: 24,
                  color: "#666",
                }}
              >
                Pay when your order is
                delivered.
              </small>
            </label>
          </div>

          {error && (
            <p
              style={{
                color: "#b00020",
                fontWeight: 700,
                marginTop: 12,
              }}
            >
              {error}
            </p>
          )}

          <button
            className="btn red"
            disabled={busy}
            style={{ marginTop: 15 }}
          >
            {busy
              ? paymentMethod === "ONLINE"
                ? "OPENING PAYMENT..."
                : "PLACING ORDER..."
              : paymentMethod === "ONLINE"
                ? "PAY & PLACE ORDER"
                : "PLACE COD ORDER"}
          </button>
        </form>
      </div>
    </div>
  );
}