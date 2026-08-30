"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { TableInfo, orderTotal, money } from "@/lib/types";
import {
  Search,
  Plus,
  ArrowRight,
  Receipt,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  Eye,
  Armchair,
} from "lucide-react";

type FilterStatus = "ALL" | "FREE" | "OCCUPIED" | "CHECKOUT";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badge: string;
    dot: string;
    border: string;
    cardBg: string;
  }
> = {
  FREE: {
    label: "Available",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    border: "border-white/[0.08] hover:border-emerald-500/40 hover:shadow-glow-emerald",
    cardBg: "bg-obsidian-900/80",
  },
  OCCUPIED: {
    label: "Dining",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    border: "border-amber-500/40 shadow-glow-copper",
    cardBg: "bg-obsidian-900",
  },
  CHECKOUT: {
    label: "Bill Ready",
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    dot: "bg-indigo-400",
    border: "border-indigo-500/40 shadow-2xl",
    cardBg: "bg-obsidian-900",
  },
};

export default function WaiterPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [busyTableId, setBusyTableId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch("/api/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        setErrorMessage(null);
      } else {
        setErrorMessage("Failed to refresh tables from server.");
      }
    } catch {
      setErrorMessage("Network error refreshing floor plan.");
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      load(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [load]);

  async function openTable(table: TableInfo) {
    const active = table.orders?.[0];
    if (active) {
      router.push(`/waiter/order/${active.id}`);
      return;
    }
    if (busyTableId !== null) return;

    setBusyTableId(table.id);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: table.id }),
      });

      if (res.ok) {
        const order = await res.json();
        router.push(`/waiter/order/${order.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || "Unable to open table order.");
      }
    } catch {
      setErrorMessage("Network connection error opening table.");
    } finally {
      setBusyTableId(null);
    }
  }

  const stats = useMemo(() => {
    const total = tables.length;
    const free = tables.filter((t) => t.status === "FREE").length;
    const occupied = tables.filter((t) => t.status === "OCCUPIED").length;
    const checkout = tables.filter((t) => t.status === "CHECKOUT").length;
    return { total, free, occupied, checkout };
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      if (statusFilter !== "ALL" && table.status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const nameMatch = table.name.toLowerCase().includes(query);
      const seatsMatch = `${table.seats}`.includes(query);
      const activeOrder = table.orders?.[0];
      const orderIdMatch = activeOrder ? `#${activeOrder.id}`.includes(query) || `${activeOrder.id}`.includes(query) : false;
      const waiterMatch = activeOrder?.waiter?.name.toLowerCase().includes(query) ?? false;

      return nameMatch || seatsMatch || orderIdMatch || waiterMatch;
    });
  }, [tables, statusFilter, searchQuery]);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 shadow-xs animate-toast">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="rounded-lg p-1 text-rose-400 hover:bg-rose-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Floorplan Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: "All", count: stats.total },
              { id: "FREE", label: "Available", count: stats.free },
              { id: "OCCUPIED", label: "Dining", count: stats.occupied },
              { id: "CHECKOUT", label: "Bill", count: stats.checkout },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as FilterStatus)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-white/10 text-white border border-amber-500/40 shadow-glow-copper"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      active ? "bg-amber-400 text-obsidian-950 font-black" : "bg-white/[0.08] text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search & Sync */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tables..."
                className="h-8.5 w-full rounded-xl border border-white/[0.1] bg-obsidian-950/80 pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-hidden transition font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={isRefreshing}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-obsidian-950/60 px-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06] transition"
              title="Refresh tables"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-amber-400" : "text-zinc-500"}`} />
            </button>
          </div>
        </div>

        {/* High-Visibility Table Cards Grid */}
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredTables.map((t) => {
              const active = t.orders?.[0];
              const total = active ? orderTotal(active.items) : 0;
              const isBusy = busyTableId === t.id;
              const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.FREE;
              const isFree = t.status === "FREE";
              const isOccupied = t.status === "OCCUPIED";
              const isCheckout = t.status === "CHECKOUT";
              const itemCount = active?.items.reduce((sum, item) => sum + item.qty, 0) || 0;

              return (
                <div
                  key={t.id}
                  className={`group relative flex flex-col justify-between rounded-3xl border ${cfg.cardBg} p-4 sm:p-5 shadow-xl transition-all duration-200 ${cfg.border}`}
                >
                  {/* Top Bar: Status Badge & Seat Count */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300">
                      <Armchair className="h-3 w-3 text-zinc-400" />
                      <span>{t.seats}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${cfg.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* HERO TABLE NAME (Large & Commanding) */}
                  <div className="py-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors">
                      {t.name}
                    </h2>

                    {/* Minimal High-Signal Info */}
                    <div className="mt-2 min-h-[32px] flex items-center">
                      {isFree ? (
                        <span className="text-xs font-mono text-zinc-500">Ready</span>
                      ) : (
                        <div className="flex items-baseline justify-between w-full">
                          <span className="text-xs font-mono text-zinc-400">
                            #{active?.id} • {itemCount} items
                          </span>
                          <span className="text-lg font-black text-white font-mono tabular-nums">
                            {money(total)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Touch Actions */}
                  <div className="pt-2">
                    {isFree && (
                      <button
                        type="button"
                        onClick={() => openTable(t)}
                        disabled={isBusy}
                        className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-3 text-xs font-black text-obsidian-950 shadow-glow-copper hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-obsidian-950" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 stroke-[2.5]" />
                            <span>Open Table</span>
                          </>
                        )}
                      </button>
                    )}

                    {isOccupied && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTable(t)}
                          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition"
                          title="Quick preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openTable(t)}
                          disabled={isBusy}
                          className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.08] border border-amber-500/40 text-amber-300 px-3 text-xs font-bold hover:bg-amber-500/15 hover:text-white active:scale-[0.98] transition disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <span>Order Details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {isCheckout && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTable(t)}
                          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition"
                          title="Quick preview"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openTable(t)}
                          disabled={isBusy}
                          className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 px-3 text-xs font-bold hover:bg-indigo-500/30 hover:text-white active:scale-[0.98] transition disabled:opacity-50"
                        >
                          <span>Checkout</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.12] bg-obsidian-900/40 p-8 text-center">
            <h3 className="text-sm font-bold text-white">No tables found</h3>
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="mt-3 text-xs font-semibold text-amber-400 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Modal: Quick Order Preview */}
        <Modal
          isOpen={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          title={selectedTable?.name || "Table"}
          subtitle={`${selectedTable?.seats || 4} Seats Capacity`}
          maxWidth="max-w-md"
        >
          {selectedTable && (
            <div className="space-y-4">
              {selectedTable.orders && selectedTable.orders.length > 0 && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-obsidian-850/80 p-3.5 text-xs font-mono flex items-center justify-between">
                    <div>
                      <span className="text-amber-400 font-bold">Order #{selectedTable.orders[0].id}</span>
                      <p className="text-zinc-500 text-[11px]">
                        Server: {selectedTable.orders[0].waiter?.name || "Floor"}
                      </p>
                    </div>
                    <span className="text-base text-white font-black tabular-nums">
                      {money(orderTotal(selectedTable.orders[0].items))}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-obsidian-950/80 p-3.5 text-xs">
                    <div className="divide-y divide-white/[0.06] max-h-52 overflow-y-auto">
                      {selectedTable.orders[0].items.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between items-center text-xs">
                          <span className="text-zinc-200">
                            <span className="font-mono font-bold text-amber-400 mr-1.5">{item.qty}×</span>
                            {item.menuItem?.name}
                          </span>
                          <span className="font-mono text-zinc-400 tabular-nums">
                            {money(item.qty * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = selectedTable;
                    setSelectedTable(null);
                    openTable(t);
                  }}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
                >
                  <span>Open Order</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
