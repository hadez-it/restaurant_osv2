"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TableInfo, Order, orderTotal, money } from "@/lib/types";

export default function CashierPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [receipt, setReceipt] = useState<{ order: Order; table: TableInfo } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/tables")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTables);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  async function markPaid(order: Order, table: TableInfo) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${order.id}/pay`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      setReceipt({ order, table });
      load();
    }
  }

  const withOrders = tables.filter((t) => (t.orders?.length ?? 0) > 0);
  const checkout = withOrders.filter((t) => t.status === "CHECKOUT");
  const occupied = withOrders.filter((t) => t.status !== "CHECKOUT");

  function TableCard({ table, highlight }: { table: TableInfo; highlight: boolean }) {
    const order = table.orders![0];
    const total = orderTotal(order.items);
    return (
      <div
        className={`rounded-xl border-2 bg-white p-4 shadow-sm ${
          highlight ? "border-blue-500" : "border-orange-200"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-bold">{table.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
              highlight ? "bg-blue-500" : "bg-orange-500"
            }`}
          >
            {highlight ? "READY TO PAY" : "DINING"}
          </span>
        </div>
        <div className="mb-1 text-xs text-gray-500">
          Order #{order.id} · Waiter: {order.waiter?.name}
        </div>
        <ul className="mb-2 max-h-40 divide-y overflow-auto text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-1">
              <span>
                {i.qty} × {i.menuItem.name}
              </span>
              <span>{money(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t pt-2 font-bold">
          <span>Total</span>
          <span className="text-orange-700">{money(total)}</span>
        </div>
        {highlight && (
          <button
            disabled={busy}
            onClick={() => markPaid(order, table)}
            className="mt-3 w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Mark paid & free table
          </button>
        )}
      </div>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-bold text-orange-700">Cashier</h1>

      <h2 className="mb-2 text-lg font-semibold text-blue-700">Checkout requests</h2>
      {checkout.length === 0 ? (
        <div className="mb-6 rounded-xl bg-white p-6 text-center text-gray-400 shadow-sm">
          No tables waiting to pay.
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {checkout.map((t) => (
            <TableCard key={t.id} table={t} highlight />
          ))}
        </div>
      )}

      <h2 className="mb-2 text-lg font-semibold text-orange-700">Open tables</h2>
      {occupied.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-gray-400 shadow-sm">
          No open tables.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {occupied.map((t) => (
            <TableCard key={t.id} table={t} highlight={false} />
          ))}
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:bg-transparent">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="print-area font-mono text-sm">
              <div className="text-center text-base font-bold">🍊 OrangePOS</div>
              <div className="text-center">*** RECEIPT ***</div>
              <div className="mt-2">Order #{receipt.order.id} — {receipt.table.name}</div>
              <div>{new Date().toLocaleString()}</div>
              <div className="my-2 border-t border-dashed border-black" />
              {receipt.order.items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>
                    {i.qty} x {i.menuItem.name}
                  </span>
                  <span>{money(i.qty * i.price)}</span>
                </div>
              ))}
              <div className="my-2 border-t border-dashed border-black" />
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>{money(orderTotal(receipt.order.items))}</span>
              </div>
              <div className="mt-2 text-center">PAID — Thank you!</div>
            </div>
            <div className="mt-4 flex gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-lg border-2 border-orange-600 py-2 font-semibold text-orange-700 hover:bg-orange-50"
              >
                🖨 Print receipt
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 rounded-lg bg-orange-600 py-2 font-semibold text-white hover:bg-orange-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
