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
  ShoppingBag,
} from "lucide-react";
import { Order } from "@/lib/types";

type FilterStatus = "ALL" | "FREE" | "OCCUPIED" | "CHECKOUT" | "TAKEAWAY";

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
  const [takeaways, setTakeaways] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [busyTableId, setBusyTableId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTakeoutModal, setShowTakeoutModal] = useState(false);
  const [takeoutCustomerName, setTakeoutCustomerName] = useState("");
  const [creatingTakeout, setCreatingTakeout] = useState(false);
  const router = useRouter();

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [tRes, oRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/orders?status=OPEN,CHECKOUT"),
      ]);

      if (tRes.ok) {
        const data = await tRes.json();
        setTables(data);
      } else {
        setErrorMessage("Failed to refresh tables from server.");
      }

      if (oRes.ok) {
        const allOrders: Order[] = await oRes.json();
        setTakeaways(allOrders.filter((o) => o.orderType === "TAKEAWAY"));
      }
      setErrorMessage(null);
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

  async function createTakeawayOrder() {
    setCreatingTakeout(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "TAKEAWAY",
          customerName: takeoutCustomerName.trim() || undefined,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        setShowTakeoutModal(false);
        setTakeoutCustomerName("");
        router.push(`/waiter/order/${order.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || "Failed to create takeaway order.");
      }
    } catch {
      setErrorMessage("Network error creating takeaway order.");
    } finally {
      setCreatingTakeout(false);
    }
  }

  async function openTable(table: TableInfo) {
    const active = table.status !== "FREE" ? table.orders?.[0] : null;
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
    const total = tables.length + takeaways.length;
    const free = tables.filter((t) => t.status === "FREE").length;
    const occupied = tables.filter((t) => t.status === "OCCUPIED").length;
    const checkout = tables.filter((t) => t.status === "CHECKOUT").length;
    const takeawayCount = takeaways.length;
    return { total, free, occupied, checkout, takeawayCount };
  }, [tables, takeaways]);

  const filteredTables = useMemo(() => {
    if (statusFilter === "TAKEAWAY") return [];
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
      const statusMatch = table.status.toLowerCase().includes(query);

      return nameMatch || seatsMatch || orderIdMatch || waiterMatch || statusMatch;
    });
  }, [tables, statusFilter, searchQuery]);

  const filteredTakeaways = useMemo(() => {
    if (statusFilter !== "ALL" && statusFilter !== "TAKEAWAY") return [];
    return takeaways.filter((order) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const idMatch = `#${order.id}`.includes(query) || `${order.id}`.includes(query);
      const nameMatch = (order.customerName || "").toLowerCase().includes(query);
      const waiterMatch = order.waiter?.name.toLowerCase().includes(query) ?? false;
      const typeMatch = "takeaway".includes(query) || "takeout".includes(query);
      return idMatch || nameMatch || waiterMatch || typeMatch;
    });
  }, [takeaways, statusFilter, searchQuery]);

  const STATUS_TABS = [
    { id: "ALL", label: "All", count: stats.total },
    { id: "FREE", label: "Available", count: stats.free },
    { id: "OCCUPIED", label: "Dining", count: stats.occupied },
    { id: "CHECKOUT", label: "Bill", count: stats.checkout },
    { id: "TAKEAWAY", label: "Takeout", count: stats.takeawayCount },
  ];

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
              type="button"
              onClick={() => setErrorMessage(null)}
              className="rounded-lg p-1 text-rose-400 hover:bg-rose-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter Navigation Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as FilterStatus)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                    active
                      ? "bg-white/10 text-white border border-amber-500/40 shadow-glow-copper"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
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
                className="h-9 w-full rounded-xl border border-white/[0.1] bg-obsidian-950/80 pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none transition font-mono"
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
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-obsidian-950/60 px-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06] transition"
              title="Refresh tables"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-amber-400" : "text-zinc-500"}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowTakeoutModal(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-3 text-xs font-black text-obsidian-950 shadow-glow-copper hover:brightness-110 active:scale-95 transition shrink-0"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>+ Takeout</span>
            </button>
          </div>
        </div>

        {/* Takeaway Orders Section (when on ALL or TAKEOUT) */}
        {filteredTakeaways.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Active Takeout Orders ({filteredTakeaways.length})
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredTakeaways.map((o) => {
                const total = orderTotal(o.items);
                const isCheckout = o.status === "CHECKOUT";
                const itemCount = o.items.reduce((sum, i) => sum + i.qty, 0);

                return (
                  <div
                    key={o.id}
                    className={`group relative flex flex-col justify-between rounded-3xl border bg-obsidian-900 p-4 sm:p-5 shadow-xl transition-all duration-200 ${
                      isCheckout
                        ? "border-indigo-500/40 shadow-2xl"
                        : "border-amber-500/40 shadow-glow-copper"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-mono font-medium text-amber-300">
                        <ShoppingBag className="h-3 w-3 text-amber-400" />
                        <span>Takeout</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isCheckout
                            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isCheckout ? "bg-indigo-400" : "bg-amber-400"
                          }`}
                        />
                        {isCheckout ? "Bill Ready" : "Preparing"}
                      </span>
                    </div>

                    <div className="py-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors truncate">
                        {o.customerName || `Order #${o.id}`}
                      </h2>

                      <div className="mt-2 min-h-[32px] flex items-center">
                        <div className="flex items-baseline justify-between w-full">
                          <span className="text-xs font-mono text-zinc-400">
                            #{o.id} • {itemCount} items
                          </span>
                          <span className="text-lg font-black text-white font-mono tabular-nums">
                            {money(total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/waiter/order/${o.id}`)}
                        className={`w-full h-10 flex items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition active:scale-[0.98] ${
                          isCheckout
                            ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/30 hover:text-white"
                            : "bg-white/[0.08] border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 hover:text-white"
                        }`}
                      >
                        <span>{isCheckout ? "View Bill" : "Order Details"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* High-Visibility Table Cards Grid */}
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredTables.map((t) => {
              const active = t.status !== "FREE" ? t.orders?.[0] : null;
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

        {/* Modal: New Takeout Order */}
        <Modal
          isOpen={showTakeoutModal}
          onClose={() => {
            if (!creatingTakeout) setShowTakeoutModal(false);
          }}
          title="New Takeout Order"
          subtitle="Create an order without reserving a dine-in table"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Customer Name / Phone (Optional)
              </label>
              <input
                type="text"
                value={takeoutCustomerName}
                onChange={(e) => setTakeoutCustomerName(e.target.value)}
                placeholder="e.g. Alex (09-123456)"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    createTakeawayOrder();
                  }
                }}
                className="w-full h-10 rounded-xl border border-white/[0.1] bg-obsidian-950 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Leave blank to automatically assign the next order number.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowTakeoutModal(false)}
                disabled={creatingTakeout}
                className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createTakeawayOrder}
                disabled={creatingTakeout}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-xs font-black text-obsidian-950 shadow-glow-copper hover:brightness-110 active:scale-95 transition disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {creatingTakeout ? (
                  <Loader2 className="h-4 w-4 animate-spin text-obsidian-950" />
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
                    <span>Create Takeout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
