"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { MenuItem, Order, orderTotal, money } from "@/lib/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setOrder)
      .catch(() => router.replace("/waiter"));
  }, [id, router]);

  useEffect(() => {
    load();
    fetch("/api/menu")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMenu);
  }, [load]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(menu.map((m) => m.category)))],
    [menu]
  );

  async function act(path: string, opts?: RequestInit) {
    setError("");
    setBusy(true);
    const res = await fetch(path, opts);
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Action failed");
      return false;
    }
    load();
    return true;
  }

  async function addItem(menuItemId: number) {
    await act(`/api/orders/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ menuItemId, qty: 1 }] }),
    });
  }

  if (!order) {
    return (
      <AppShell>
        <div className="text-orange-600">Loading…</div>
      </AppShell>
    );
  }

  const draft = order.items.filter((i) => !i.ticketId);
  const sent = order.items.filter((i) => i.ticketId);
  const total = orderTotal(order.items);
  const isOpen = order.status === "OPEN";

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/waiter")} className="text-sm text-orange-600 hover:underline">
            ← Back to tables
          </button>
          <h1 className="text-2xl font-bold text-orange-700">
            {order.table?.name} — Order #{order.id}
          </h1>
          <div className="text-sm text-gray-500">Status: {order.status}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-orange-700">{money(total)}</div>
        </div>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Menu</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  category === c ? "bg-orange-600 text-white" : "bg-white text-gray-700 hover:bg-orange-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {menu
              .filter((m) => m.available && (category === "All" || m.category === category))
              .map((m) => (
                <button
                  key={m.id}
                  disabled={!isOpen || busy}
                  onClick={() => addItem(m.id)}
                  className="rounded-lg border border-orange-200 bg-white p-3 text-left shadow-sm hover:border-orange-500 disabled:opacity-50"
                >
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-sm text-orange-700">{money(m.price)}</div>
                </button>
              ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Current order</h2>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            {draft.length > 0 && (
              <>
                <div className="mb-1 text-xs font-semibold uppercase text-gray-400">New (not sent)</div>
                <ul className="mb-3 divide-y">
                  {draft.map((i) => (
                    <li key={i.id} className="flex items-center justify-between py-2">
                      <span>
                        {i.qty} × {i.menuItem.name}
                      </span>
                      <span className="flex items-center gap-3">
                        <span>{money(i.qty * i.price)}</span>
                        <button
                          onClick={() => act(`/api/orders/${order.id}/items/${i.id}`, { method: "DELETE" })}
                          className="text-sm text-red-500 hover:underline"
                        >
                          remove
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {sent.length > 0 && (
              <>
                <div className="mb-1 text-xs font-semibold uppercase text-gray-400">Sent to kitchen</div>
                <ul className="mb-3 divide-y">
                  {sent.map((i) => (
                    <li key={i.id} className="flex items-center justify-between py-2 text-gray-600">
                      <span>
                        {i.qty} × {i.menuItem.name}
                      </span>
                      <span>{money(i.qty * i.price)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {order.items.length === 0 && <div className="py-4 text-center text-gray-400">No items yet — tap menu items to add.</div>}

            <div className="mt-2 flex items-center justify-between border-t pt-3 font-semibold">
              <span>Total</span>
              <span className="text-orange-700">{money(total)}</span>
            </div>

            {isOpen && (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  disabled={draft.length === 0 || busy}
                  onClick={() => act(`/api/orders/${order.id}/confirm`, { method: "POST" })}
                  className="rounded-lg bg-orange-600 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  Confirm & send to kitchen ({draft.length})
                </button>
                <button
                  disabled={sent.length === 0 || draft.length > 0 || busy}
                  onClick={async () => {
                    if (await act(`/api/orders/${order.id}/checkout`, { method: "POST" })) {
                      router.push("/waiter");
                    }
                  }}
                  className="rounded-lg border-2 border-orange-600 py-2.5 font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                >
                  Send to cashier for checkout
                </button>
              </div>
            )}
            {order.status === "CHECKOUT" && (
              <div className="mt-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Waiting for cashier — customer is checking out.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
