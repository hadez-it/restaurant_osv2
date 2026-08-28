"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.replace(data.home);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-1 text-center text-3xl font-bold text-orange-600">
          🍊 OrangePOS
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Restaurant workflow — sign in to continue
        </p>
        {error && (
          <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <label className="mb-1 block text-sm font-medium">Username</label>
        <input
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          type="password"
          className="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full rounded-lg bg-orange-600 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-center text-xs text-gray-400">
          Demo: admin / waiter / kitchen / cashier — password123
        </p>
      </form>
    </div>
  );
}
