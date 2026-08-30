"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { TableInfo, orderTotal, money } from "@/lib/types";
import {
  Users,
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
} from "lucide-react";

type FilterStatus = "ALL" | "FREE" | "OCCUPIED" | "CHECKOUT";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badge: string;
    dot: string;
    border: string;
  }
> = {
  FREE: {
    label: "Available",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    border: "border-zinc-200 hover:border-emerald-300 hover:shadow-emerald-500/5",
  },
  OCCUPIED: {
    label: "Dining",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    border: "border-amber-200/90 bg-amber-50/10 hover:border-amber-300 hover:shadow-amber-500/5",
  },
  CHECKOUT: {
    label: "Checkout",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    border: "border-indigo-200/90 bg-indigo-50/10 hover:border-indigo-300 hover:shadow-indigo-500/5",
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
    }, 5000);
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
      <div className="space-y-4 sm:space-y-5">
        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="rounded-lg p-1 text-red-500 hover:bg-red-100 hover:text-red-700"
              title="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Clean Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                Floor Plan
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-zinc-500">
              {stats.total} tables • {stats.free} available • {stats.occupied} dining
              {stats.checkout > 0 ? ` • ${stats.checkout} ready to pay` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={isRefreshing}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition active:scale-95 disabled:opacity-60"
              title="Refresh floor status"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-zinc-500 ${isRefreshing ? "animate-spin text-orange-600" : ""}`}
              />
              <span>Refresh</span>
              <span className="hidden sm:inline text-[11px] text-zinc-400">
                {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          </div>
        </div>

        {/* Unified Filter Tabs & Search Toolbar */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200/80 bg-white p-2 sm:p-2.5 shadow-2xs">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All", count: stats.total, badge: "bg-zinc-100 text-zinc-700" },
              { id: "FREE", label: "Available", count: stats.free, badge: "bg-emerald-100 text-emerald-800" },
              { id: "OCCUPIED", label: "Dining", count: stats.occupied, badge: "bg-amber-100 text-amber-800" },
              { id: "CHECKOUT", label: "Checkout", count: stats.checkout, badge: "bg-indigo-100 text-indigo-800" },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as FilterStatus)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : tab.badge
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
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, server, order..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-8 pr-7 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Cards Grid */}
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
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
                  className={`group flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition-all duration-150 hover:shadow-md ${cfg.border}`}
                >
                  {/* Top: Name, seats, and status badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                          {t.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                          <Users className="h-3 w-3 text-zinc-400" />
                          {t.seats}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Middle: Order / Seating Info */}
                    <div className="my-3 min-h-[52px] flex flex-col justify-center">
                      {isFree && (
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-500">
                          <span>Ready to seat guests ({t.seats} chairs)</span>
                        </div>
                      )}

                      {(isOccupied || isCheckout) && (
                        <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-800 truncate">
                              <span>Order #{active?.id}</span>
                              {active?.waiter && (
                                <span className="text-[11px] font-normal text-zinc-500 truncate">
                                  • {active.waiter.name}
                                </span>
                              )}
                            </div>
                            <span className="block text-[11px] text-zinc-500">
                              {itemCount} {itemCount === 1 ? "item" : "items"}
                              {isCheckout ? " • Bill requested" : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] uppercase font-medium text-zinc-400">Total</span>
                            <span className="text-sm font-bold text-zinc-900 tabular-nums">
                              {money(total)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {isFree && (
                      <button
                        type="button"
                        onClick={() => openTable(t)}
                        disabled={isBusy}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Opening...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span>Open Table</span>
                          </>
                        )}
                      </button>
                    )}

                    {isOccupied && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedTable(t)}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 shadow-2xs transition"
                          title="View order summary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openTable(t)}
                          disabled={isBusy}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-600 active:scale-[0.99] disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <span>Manage Order</span>
                              <ArrowRight className="h-4 w-4" />
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
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 shadow-2xs transition"
                          title="View bill summary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openTable(t)}
                          disabled={isBusy}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Receipt className="h-4 w-4" />
                              <span>View Bill</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
              {tables.length === 0 ? (
                <LayoutGrid className="h-6 w-6" />
              ) : (
                <Search className="h-6 w-6" />
              )}
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-900">
              {tables.length === 0
                ? "No tables configured"
                : "No matching tables found"}
            </h3>
            <p className="mt-1 max-w-xs text-xs text-zinc-500">
              {tables.length === 0
                ? "No tables found in database. Contact a manager to configure floor plan."
                : `No tables match "${searchQuery || statusFilter}". Try adjusting your search query or filter.`}
            </p>
            {tables.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-orange-600"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        )}

        {/* Table Quick Overview Modal */}
        <Modal
          isOpen={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          title={
            <div className="flex items-center gap-2">
              <span>{selectedTable?.name}</span>
              {selectedTable && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
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
            selectedTable ? `${selectedTable.seats} seats capacity` : undefined
          }
          maxWidth="max-w-md"
        >
          {selectedTable && (
            <div className="space-y-4">
              {/* If FREE */}
              {selectedTable.status === "FREE" && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-center">
                  <p className="text-xs text-zinc-600">
                    Table is clean and ready to seat guests.
                  </p>
                </div>
              )}

              {/* If OCCUPIED or CHECKOUT */}
              {selectedTable.orders && selectedTable.orders.length > 0 && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-zinc-900">
                      <span>Order #{selectedTable.orders[0].id}</span>
                      <span className="text-sm text-zinc-900 font-extrabold tabular-nums">
                        {money(orderTotal(selectedTable.orders[0].items))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Server: {selectedTable.orders[0].waiter?.name || "Unassigned"}</span>
                      <span>
                        {selectedTable.status === "CHECKOUT"
                          ? "Awaiting bill payment"
                          : "Currently dining"}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="rounded-xl border border-zinc-200/80 bg-white p-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">
                      <span>Item</span>
                      <span>Subtotal</span>
                    </div>
                    <div className="divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                      {selectedTable.orders[0].items.length > 0 ? (
                        selectedTable.orders[0].items.map((item) => (
                          <div key={item.id} className="py-2 flex justify-between items-center">
                            <span className="text-zinc-800">
                              <span className="font-semibold text-zinc-900">{item.qty}×</span>{" "}
                              {item.menuItem?.name}
                            </span>
                            <span className="font-medium text-zinc-600 tabular-nums">
                              {money(item.qty * item.price)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="py-3 text-center text-xs text-zinc-400">
                          No items ordered yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
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
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-orange-600 transition"
                >
                  <span>
                    {selectedTable.status === "FREE"
                      ? "Open Table"
                      : "Open Order Details"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
