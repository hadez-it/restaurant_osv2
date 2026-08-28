"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { TableInfo, orderTotal, money } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  FREE: "border-green-300 bg-green-50 hover:border-green-500",
  OCCUPIED: "border-orange-400 bg-orange-100 hover:border-orange-600",
  CHECKOUT: "border-blue-400 bg-blue-50 hover:border-blue-600",
};

const STATUS_BADGE: Record<string, string> = {
  FREE: "bg-green-500",
  OCCUPIED: "bg-orange-500",
  CHECKOUT: "bg-blue-500",
};

export default function WaiterPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const load = useCallback(() => {
    fetch("/api/tables")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTables);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function openTable(table: TableInfo) {
    const active = table.orders?.[0];
    if (active) {
      router.push(`/waiter/order/${active.id}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: table.id }),
    });
    setBusy(false);
    if (res.ok) {
      const order = await res.json();
      router.push(`/waiter/order/${order.id}`);
    }
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-700">Tables</h1>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-500" /> Free</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-500" /> Occupied</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-500" /> Checkout</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((t) => {
          const active = t.orders?.[0];
          const total = active ? orderTotal(active.items) : 0;
          return (
            <button
              key={t.id}
              onClick={() => openTable(t)}
              className={`rounded-xl border-2 p-4 text-left shadow-sm transition ${STATUS_STYLES[t.status] ?? ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{t.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${STATUS_BADGE[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">{t.seats} seats</div>
              {active && (
                <div className="mt-2 text-sm">
                  <div className="text-gray-600">{active.items.length} item(s)</div>
                  <div className="font-semibold text-orange-700">{money(total)}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}
