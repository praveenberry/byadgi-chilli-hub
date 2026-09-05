"use client";

import { whatsappUrl } from "@/lib/products";
import { useCart } from "./cart-provider";
import { useState } from "react";
import { CheckoutModal } from "./checkout-modal";

export function CartDrawer() {
  const { items, count, open, setOpen, change, clear } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [success, setSuccess] = useState("");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const sendOrder = () => {
    if (!items.length) return;
    const lines = items
      .map((item) => `• ${item.brand} — ${item.name} — ${item.packSize} × ${item.quantity}`)
      .join("\n");
    window.open(
      whatsappUrl(
        `Hello BYADGI CHILLI HUB,\nI want to order these items:\n\n${lines}\n\nPlease confirm pricing and availability.`
      ),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <aside className={`cart ${open ? "show" : ""}`} aria-hidden={!open}>
        <div className="cart-head">
          <h2>My Cart</h2>
          <button aria-label="Close cart" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="cart-body">
          {items.length ? items.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <b>{item.brand}</b><br />
                {item.name}<br />
                {item.packSize} ×{" "}
                <button onClick={() => change(item.id, item.quantity - 1)}>−</button>{" "}
                {item.quantity}{" "}
                <button onClick={() => change(item.id, item.quantity + 1)}>+</button>
              </div>
              <b>₹{item.price * item.quantity}</b>
            </div>
          )) : <p style={{ padding: 15, color: "#777" }}>Your cart is empty.</p>}
        </div>

        <div className="cart-foot">
          <b>Total Items: {count}</b><br />
          <b>Total: ₹{total}</b>

          {success ? (
            <div style={{ marginTop: 12, padding: 12, background: "#e9f8ee", borderRadius: 6 }}>
              <b>Order placed successfully!</b>
              <div>Order No: <strong>{success}</strong></div>
              <button className="btn green" style={{ marginTop: 8 }} onClick={() => setSuccess("")}>CONTINUE SHOPPING</button>
            </div>
          ) : (
            <>
              <button className="btn red" disabled={!items.length} onClick={() => setCheckoutOpen(true)}>
                PLACE ONLINE ORDER
              </button>
              <button className="btn green" disabled={!items.length} onClick={sendOrder}>
                ORDER ON WHATSAPP
              </button>
            </>
          )}
        </div>
      </aside>

      {open && <div className="shade show" onClick={() => setOpen(false)} />}

      <CheckoutModal
        items={items}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(orderNumber) => {
          setCheckoutOpen(false);
          setSuccess(orderNumber);
          clear();
        }}
      />
    </>
  );
}
