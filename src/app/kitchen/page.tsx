"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { Ticket } from "@/lib/types";

export default function KitchenPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const seenIds = useRef<Set<number> | null>(null);
  const autoPrintRef = useRef(autoPrint);
  autoPrintRef.current = autoPrint;

  const load = useCallback(() => {
    fetch("/api/tickets")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Ticket[]) => {
        setTickets(list);
        if (seenIds.current === null) {
          seenIds.current = new Set(list.map((t) => t.id));
          return;
        }
        const fresh = list.filter((t) => !seenIds.current!.has(t.id));
        for (const t of list) seenIds.current.add(t.id);
        if (fresh.length > 0 && autoPrintRef.current) {
          setPrintTicket(fresh[0]);
        }
      });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (printTicket) {
      const t = setTimeout(() => {
        window.print();
        setPrintTicket(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [printTicket]);

  async function markDone(id: number) {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    load();
  }

  const active = tickets.filter((t) => t.status === "NEW");
  const done = tickets.filter((t) => t.status === "DONE").slice(0, 8);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-700">Kitchen — Incoming slips</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoPrint}
            onChange={(e) => setAutoPrint(e.target.checked)}
            className="h-4 w-4 accent-orange-600"
          />
          Auto-print new slips
        </label>
      </div>

      {active.length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">
          No pending kitchen slips 🎉
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((t) => (
          <div key={t.id} className="rounded-xl border-2 border-orange-400 bg-white p-4 shadow">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold">Slip #{t.id} — {t.order.table.name}</span>
              <span className="text-xs text-gray-500">
                {new Date(t.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <ul className="mb-3 divide-y text-sm">
              {t.items.map((i) => (
                <li key={i.id} className="py-1.5">
                  <span className="font-semibold">{i.qty} ×</span> {i.menuItem.name}
                  {i.note && <div className="text-xs text-gray-500">Note: {i.note}</div>}
                </li>
              ))}
            </ul>
            <div className="mb-3 text-xs text-gray-500">Waiter: {t.order.waiter.name}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPrintTicket(t)}
                className="flex-1 rounded-lg border-2 border-orange-600 py-1.5 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              >
                🖨 Print slip
              </button>
              <button
                onClick={() => markDone(t.id)}
                className="flex-1 rounded-lg bg-orange-600 py-1.5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                ✓ Done
              </button>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-500">Recently completed</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {done.map((t) => (
              <div key={t.id} className="rounded-lg bg-white p-3 text-sm text-gray-500 shadow-sm">
                Slip #{t.id} — {t.order.table.name} ({t.items.length} items)
              </div>
            ))}
          </div>
        </>
      )}

      {printTicket && (
        <div className="print-area fixed left-0 top-0 hidden w-72 bg-white p-4 font-mono text-sm print:block">
          <div className="text-center font-bold">*** KITCHEN SLIP ***</div>
          <div className="mt-2">Slip #{printTicket.id}</div>
          <div>Table: {printTicket.order.table.name}</div>
          <div>Waiter: {printTicket.order.waiter.name}</div>
          <div>{new Date(printTicket.createdAt).toLocaleString()}</div>
          <div className="my-2 border-t border-dashed border-black" />
          {printTicket.items.map((i) => (
            <div key={i.id}>
              {i.qty} x {i.menuItem.name}
              {i.note ? ` (${i.note})` : ""}
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-black" />
          <div className="text-center">--- end ---</div>
        </div>
      )}
    </AppShell>
  );
}
