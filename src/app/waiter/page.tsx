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
  LayoutGrid,
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
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-400",
    border: "border-white/[0.08] hover:border-emerald-500/40 hover:shadow-glow-emerald",
    cardBg: "bg-obsidian-900/80",
  },
  OCCUPIED: {
    label: "Dining",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    dot: "bg-amber-400",
    border: "border-amber-500/35 shadow-glow-copper",
    cardBg: "bg-obsidian-900",
  },
  CHECKOUT: {
    label: "Settlement",
    badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
    dot: "bg-indigo-400",
    border: "border-indigo-500/35 shadow-2xl",
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
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const router = useRouter();

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch("/api/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        setLastSyncTime(new Date());
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
    }, 4000);
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

  // Calculate live statistics
  const stats = useMemo(() => {
    const total = tables.length;
    const free = tables.filter((t) => t.status === "FREE").length;
    const occupied = tables.filter((t) => t.status === "OCCUPIED").length;
    const checkout = tables.filter((t) => t.status === "CHECKOUT").length;
    return { total, free, occupied, checkout };
  }, [tables]);

  // Filter tables by search query and selected filter tab
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      if (statusFilter !== "ALL" && table.status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const nameMatch = table.name.toLowerCase().includes(query);
      const seatsMatch = `${table.seats}`.includes(query) || `${table.seats} seats`.toLowerCase().includes(query);

      const activeOrder = table.orders?.[0];
      const orderIdMatch = activeOrder ? `#${activeOrder.id}`.includes(query) || `${activeOrder.id}`.includes(query) : false;
      const waiterMatch = activeOrder?.waiter?.name.toLowerCase().includes(query) ?? false;

      return nameMatch || seatsMatch || orderIdMatch || waiterMatch;
    });
  }, [tables, statusFilter, searchQuery]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs sm:text-sm text-rose-300 shadow-xs animate-toast">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="rounded-lg p-1 text-rose-400 hover:bg-rose-500/20 hover:text-rose-200"
              title="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Floor Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Dining Floor Plan
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {stats.total} Total Tables • {stats.free} Available for Seating • {stats.occupied} Currently Dining
              {stats.checkout > 0 ? ` • ${stats.checkout} Ready to Settle` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={isRefreshing}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.09] bg-obsidian-900 px-3 text-xs font-medium text-zinc-300 shadow-xs hover:border-white/[0.18] hover:bg-obsidian-850 transition active:scale-95 disabled:opacity-60"
              title="Refresh floor status"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-zinc-400 ${isRefreshing ? "animate-spin text-amber-400" : ""}`}
              />
              <span>Sync</span>
              <span className="text-[11px] font-mono text-zinc-500">
                {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All Tables", count: stats.total, badge: "text-zinc-300 bg-white/10" },
              { id: "FREE", label: "Available", count: stats.free, badge: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" },
              { id: "OCCUPIED", label: "Dining", count: stats.occupied, badge: "text-amber-300 bg-amber-500/10 border border-amber-500/20" },
              { id: "CHECKOUT", label: "Checkout", count: stats.checkout, badge: "text-indigo-300 bg-indigo-500/10 border border-indigo-500/20" },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as FilterStatus)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-white/10 text-white border border-amber-500/40 shadow-glow-copper"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      active ? "bg-amber-400 text-obsidian-950" : tab.badge
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, server, order..."
              className="h-9 w-full rounded-xl border border-white/[0.09] bg-obsidian-950/80 pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-hidden transition font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Cards Grid */}
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  className={`group flex flex-col justify-between rounded-2xl border ${cfg.cardBg} p-4 shadow-xl transition-all duration-200 ${cfg.border}`}
                >
                  {/* Top: Table Identifier, Seats, and Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white tracking-tight">
                          {t.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300">
                          <Armchair className="h-3 w-3 text-zinc-400" />
                          {t.seats} seats
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${cfg.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Middle: Order Details or Seat Ready State */}
                    <div className="my-3.5 min-h-[58px] flex flex-col justify-center">
                      {isFree && (
                        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-xs text-zinc-400 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                            Clean & ready for party
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">READY</span>
                        </div>
                      )}

                      {(isOccupied || isCheckout) && (
                        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-100 truncate">
                              <span className="font-mono text-amber-400">Order #{active?.id}</span>
                              {active?.waiter && (
                                <span className="text-[11px] font-normal text-zinc-400 truncate">
                                  • {active.waiter.name}
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] font-mono text-zinc-400 mt-0.5">
                              {itemCount} {itemCount === 1 ? "item" : "items"}
                              {isCheckout ? " • Bill requested" : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500">Total</span>
                            <span className="text-base font-black text-white tabular-nums font-mono">
                              {money(total)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Touch Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {isFree && (
                      <button
                        type="button"
                        onClick={() => openTable(t)}
                        disabled={isBusy}
                        className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-obsidian-950" />
                            <span>Opening Table...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 stroke-[2.5]" />
                            <span>Open Table & Take Order</span>
                          </>
                        )}
                      </button>
                    )}

                    {isOccupied && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedTable(t)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition active:scale-95"
                          title="View order ticket"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openTable(t)}
                          disabled={isBusy}
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.08] border border-amber-500/40 text-amber-300 px-3 text-xs font-semibold hover:bg-amber-500/15 hover:text-white transition active:scale-[0.98] disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <span>Manage Order</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {isCheckout && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedTable(t)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition active:scale-95"
                          title="View bill"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openTable(t)}
                          disabled={isBusy}
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 px-3 text-xs font-semibold hover:bg-indigo-500/30 hover:text-white transition active:scale-[0.98] disabled:opacity-50"
                        >
                          <span>Review & Checkout</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-obsidian-900/60 p-8 text-center backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-zinc-400 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No matching dining tables</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Try adjusting your search query or status filter to view available restaurant tables.
            </p>
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Quick Table Detail Modal */}
        <Modal
          isOpen={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{selectedTable?.name}</span>
              {selectedTable && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                    STATUS_CONFIG[selectedTable.status]?.badge || ""
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      STATUS_CONFIG[selectedTable.status]?.dot || ""
                    }`}
                  />
                  {STATUS_CONFIG[selectedTable.status]?.label}
                </span>
              )}
            </div>
          }
          subtitle={
            selectedTable ? `${selectedTable.seats} Seats Dining Area` : undefined
          }
          maxWidth="max-w-md"
        >
          {selectedTable && (
            <div className="space-y-4">
              {/* If FREE */}
              {selectedTable.status === "FREE" && (
                <div className="rounded-2xl border border-white/[0.08] bg-obsidian-850/80 p-4 text-center">
                  <p className="text-xs text-zinc-400">
                    Table is sanitized and ready for guest seating.
                  </p>
                </div>
              )}

              {/* If OCCUPIED or CHECKOUT */}
              {selectedTable.orders && selectedTable.orders.length > 0 && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-obsidian-850/80 p-3.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="font-mono text-amber-400">Order #{selectedTable.orders[0].id}</span>
                      <span className="text-base text-white font-mono font-black tabular-nums">
                        {money(orderTotal(selectedTable.orders[0].items))}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>Server: {selectedTable.orders[0].waiter?.name || "Unassigned"}</span>
                      <span>
                        {selectedTable.status === "CHECKOUT"
                          ? "Awaiting settlement"
                          : "Dining in progress"}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="rounded-2xl border border-white/[0.08] bg-obsidian-950/80 p-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                      <span>Item</span>
                      <span>Subtotal</span>
                    </div>
                    <div className="divide-y divide-white/[0.06] max-h-56 overflow-y-auto">
                      {selectedTable.orders[0].items.length > 0 ? (
                        selectedTable.orders[0].items.map((item) => (
                          <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                            <span className="text-zinc-200">
                              <span className="font-mono font-bold text-amber-400">{item.qty}×</span>{" "}
                              {item.menuItem?.name}
                            </span>
                            <span className="font-mono font-semibold text-zinc-300 tabular-nums">
                              {money(item.qty * item.price)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="py-4 text-center text-xs text-zinc-500 font-mono">
                          No items added to ticket yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="min-h-[40px] rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition"
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
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110 transition"
                >
                  <span>
                    {selectedTable.status === "FREE"
                      ? "Open Table & Take Order"
                      : "Open Order Terminal"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
