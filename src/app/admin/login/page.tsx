"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/admin/orders";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Login failed.");
      setLoading(false);
      return;
    }

    window.location.href = next.startsWith("/admin")
      ? next
      : "/admin/orders";
  }

  return (
    <main
      className="container"
      style={{
        minHeight: "80vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        className="detail-card"
        style={{
          maxWidth: 430,
          width: "100%",
        }}
      >
        <h1>Admin Login</h1>

        <p>Sign in to manage orders and dispatch.</p>

        <form onSubmit={submit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            required
            style={{
              width: "100%",
              marginBottom: 12,
            }}
          />

          {error && (
            <p
              style={{
                color: "#b00020",
                fontWeight: 700,
              }}
            >
              {error}
            </p>
          )}

          <button
            className="btn red"
            disabled={loading}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="container" />}>
      <AdminLoginForm />
    </Suspense>
  );
}