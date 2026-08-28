"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { TableInfo, orderTotal, money } from "@/lib/types";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
  RefreshCw,
  Loader2,
  X,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";

type FilterStatus = "ALL" | "FREE" | "OCCUPIED" | "CHECKOUT";

export default function WaiterPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [busyTableId, setBusyTableId] = useState<number | null>(null);
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

  // Calculate live KPI statistics
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
      // Filter by status tab
      if (statusFilter !== "ALL" && table.status !== statusFilter) {
        return false;
      }

      // Filter by search query
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
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="rounded-lg p-1 text-red-500 hover:bg-red-100 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Floor &amp; Seating Plan
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Live Sync
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Real-time table occupancy, active orders, and guest dining turnover
            </p>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => load(true)}
              disabled={isRefreshing}
              title="Refresh floor status now"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-98 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-zinc-500 ${isRefreshing ? "animate-spin text-orange-600" : ""}`}
              />
              <span className="hidden sm:inline">Refresh Floor</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </button>
          </div>
        </div>

        {/* KPI Stat Bar */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Total Tables */}
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`rounded-2xl border p-4 text-left shadow-xs transition-all ${
              statusFilter === "ALL"
                ? "border-zinc-900 bg-zinc-900 text-white ring-2 ring-zinc-900/10 shadow-sm"
                : "border-zinc-200/90 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  statusFilter === "ALL" ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                Total Tables
              </span>
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  statusFilter === "ALL" ? "bg-zinc-400" : "bg-zinc-300"
                }`}
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">{stats.total}</span>
              <span
                className={`text-xs font-medium ${
                  statusFilter === "ALL" ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                All stations
              </span>
            </div>
          </button>

          {/* Available (Free) */}
          <button
            type="button"
            onClick={() => setStatusFilter("FREE")}
            className={`rounded-2xl border p-4 text-left shadow-xs transition-all ${
              statusFilter === "FREE"
                ? "border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/20 shadow-sm"
                : "border-zinc-200/90 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Available (Free)
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-950">
                {stats.free}
              </span>
              <span className="text-xs font-medium text-emerald-700">Ready to seat</span>
            </div>
          </button>

          {/* Dining (Occupied) */}
          <button
            type="button"
            onClick={() => setStatusFilter("OCCUPIED")}
            className={`rounded-2xl border p-4 text-left shadow-xs transition-all ${
              statusFilter === "OCCUPIED"
                ? "border-amber-600 bg-amber-50/90 ring-2 ring-amber-500/20 shadow-sm"
                : "border-zinc-200/90 bg-white hover:border-amber-200 hover:bg-amber-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Dining (Occupied)
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-amber-950">
                {stats.occupied}
              </span>
              <span className="text-xs font-medium text-amber-700">In service</span>
            </div>
          </button>

          {/* Ready to Pay (Checkout) */}
          <button
            type="button"
            onClick={() => setStatusFilter("CHECKOUT")}
            className={`rounded-2xl border p-4 text-left shadow-xs transition-all ${
              statusFilter === "CHECKOUT"
                ? "border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-500/20 shadow-sm"
                : "border-zinc-200/90 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
                Ready to Pay (Checkout)
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-indigo-950">
                {stats.checkout}
              </span>
              <span className="text-xs font-medium text-indigo-700">Awaiting bill</span>
            </div>
          </button>
        </div>

        {/* Search Bar + Filter Tabs Control Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-2xs md:flex-row md:items-center md:justify-between">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100/90 p-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>All Tables</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  statusFilter === "ALL"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter("FREE")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "FREE"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-zinc-600 hover:text-emerald-700"
              }`}
            >
              <span>Available</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  statusFilter === "FREE"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {stats.free}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter("OCCUPIED")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "OCCUPIED"
                  ? "bg-white text-amber-900 shadow-xs"
                  : "text-zinc-600 hover:text-amber-800"
              }`}
            >
              <span>Dining</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  statusFilter === "OCCUPIED"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {stats.occupied}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter("CHECKOUT")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "CHECKOUT"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-zinc-600 hover:text-indigo-800"
              }`}
            >
              <span>Checkout</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  statusFilter === "CHECKOUT"
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-100 text-indigo-900"
                }`}
              >
                {stats.checkout}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, seats, server..."
              className="h-10 w-full rounded-xl border border-zinc-200/90 bg-zinc-50/50 pl-9 pr-8 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Grid */}
        {filteredTables.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {filteredTables.map((t) => {
              const active = t.orders?.[0];
              const total = active ? orderTotal(active.items) : 0;
              const isBusy = busyTableId === t.id;

              // Determine status badge and styling
              const isFree = t.status === "FREE";
              const isOccupied = t.status === "OCCUPIED";
              const isCheckout = t.status === "CHECKOUT";

              return (
                <div
                  key={t.id}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
                    isFree
                      ? "border-zinc-200/90 bg-white hover:border-emerald-300 hover:shadow-emerald-500/5"
                      : isOccupied
                      ? "border-amber-200/90 bg-gradient-to-b from-amber-50/20 via-white to-white hover:border-amber-400 hover:shadow-amber-500/5"
                      : "border-indigo-200/90 bg-gradient-to-b from-indigo-50/20 via-white to-white hover:border-indigo-400 hover:shadow-indigo-500/5"
                  }`}
                >
                  {/* Card Top: Table Name & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                          {t.name}
                        </h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {/* Capacity Chip */}
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-100/70 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                            <Users className="h-3.5 w-3.5 text-zinc-500" />
                            <span>{t.seats} seats</span>
                          </span>

                          {/* Server Name if active */}
                          {active?.waiter && (
                            <span
                              className="inline-flex max-w-[130px] items-center gap-1 truncate text-xs text-zinc-500"
                              title={`Server: ${active.waiter.name}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300"></span>
                              <span className="truncate">{active.waiter.name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge with Pulsing Ring */}
                      <div>
                        {isFree && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            Available
                          </span>
                        )}

                        {isOccupied && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                            </span>
                            Dining
                          </span>
                        )}

                        {isCheckout && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                            </span>
                            Awaiting Bill
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Middle: Active Order Details or Free Table Placeholder */}
                    <div className="my-4 min-h-[64px] flex flex-col justify-center">
                      {isFree && (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/70 p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/60 text-emerald-600">
                            <UtensilsCrossed className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-zinc-800">Clean &amp; Ready</p>
                            <p className="text-[11px] text-zinc-500">Ready to seat new guests</p>
                          </div>
                        </div>
                      )}

                      {isOccupied && (
                        <div className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-amber-50/40 p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                              <ShoppingBag className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-800">
                                {active?.items.length || 0}{" "}
                                {(active?.items.length || 0) === 1 ? "item" : "items"}
                              </p>
                              <p className="text-[11px] font-medium text-amber-700">
                                Order #{active?.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              Running Total
                            </span>
                            <span className="text-base font-bold tracking-tight text-amber-900">
                              {money(total)}
                            </span>
                          </div>
                        </div>
                      )}

                      {isCheckout && (
                        <div className="flex items-center justify-between rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                              <Receipt className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-indigo-950">
                                {active?.items.length || 0}{" "}
                                {(active?.items.length || 0) === 1 ? "item" : "items"}
                              </p>
                              <p className="text-[11px] font-medium text-indigo-600">
                                Bill Printed · Order #{active?.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                              Final Total
                            </span>
                            <span className="text-base font-bold tracking-tight text-indigo-950">
                              {money(total)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Quick Action Button */}
                  <div className="pt-2">
                    {isFree && (
                      <button
                        type="button"
                        onClick={() => openTable(t)}
                        disabled={isBusy}
                        className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Opening Table...</span>
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
                      <button
                        type="button"
                        onClick={() => openTable(t)}
                        disabled={isBusy}
                        className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading Order...</span>
                          </>
                        ) : (
                          <>
                            <span>View Order #{active?.id}</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}

                    {isCheckout && (
                      <button
                        type="button"
                        onClick={() => openTable(t)}
                        disabled={isBusy}
                        className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading Order...</span>
                          </>
                        ) : (
                          <>
                            <Receipt className="h-4 w-4" />
                            <span>View Order #{active?.id}</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Polished Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 shadow-inner">
              {tables.length === 0 ? (
                <LayoutGrid className="h-7 w-7 text-zinc-400" />
              ) : (
                <Search className="h-7 w-7 text-zinc-400" />
              )}
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900">
              {tables.length === 0
                ? "No dining tables configured"
                : "No matching tables found"}
            </h3>
            <p className="mt-1.5 max-w-sm text-xs text-zinc-500 leading-relaxed">
              {tables.length === 0
                ? "No tables have been set up in the database. Please contact a manager or administrator to configure the restaurant floor."
                : `No tables matched "${searchQuery || statusFilter}". Try adjusting your search query or switching the status filter.`}
            </p>
            {tables.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-orange-600"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
