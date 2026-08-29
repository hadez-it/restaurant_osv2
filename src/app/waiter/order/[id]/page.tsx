"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { MenuItem, Order, orderTotal, money } from "@/lib/types";
import {
  Search,
  Flame,
  Receipt,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  ChefHat,
  ShoppingBag,
  UtensilsCrossed,
  Check,
  LayoutGrid,
} from "lucide-react";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [itemBusyId, setItemBusyId] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"menu" | "ticket">("menu");
  const [showFireModal, setShowFireModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const load = useCallback(
    async (showSilent = false) => {
      if (!showSilent) setError("");
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) {
          router.replace("/waiter");
          return;
        }
        const data: Order = await res.json();
        setOrder(data);
      } catch {
        router.replace("/waiter");
      }
    },
    [id, router]
  );

  useEffect(() => {
    load();
    fetch("/api/menu")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMenu)
      .catch(() => setMenu([]));
  }, [load]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successNotice) return;
    const t = setTimeout(() => setSuccessNotice(""), 4000);
    return () => clearTimeout(t);
  }, [successNotice]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    menu.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ["All", ...Array.from(set)];
  }, [menu]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: menu.length };
    for (const m of menu) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [menu]);

  const filteredMenu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menu.filter((m) => {
      const matchCat = category === "All" || m.category === category;
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [menu, category, searchQuery]);

  async function act(path: string, opts?: RequestInit) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(path, opts);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Action failed");
        setBusy(false);
        return false;
      }
      await load(true);
      setBusy(false);
      return true;
    } catch {
      setError("Network error occurred");
      setBusy(false);
      return false;
    }
  }

  // Add item or increment existing draft item
  async function addItem(menuItem: MenuItem) {
    if (!order || order.status !== "OPEN" || busy) return;
    setItemBusyId(menuItem.id);

    // Check if an unsent draft item for this menuItem already exists
    const existingDraft = order.items.find(
      (i) => !i.ticketId && i.menuItemId === menuItem.id
    );

    if (existingDraft) {
      await act(`/api/orders/${order.id}/items/${existingDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: existingDraft.qty + 1 }),
      });
    } else {
      await act(`/api/orders/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ menuItemId: menuItem.id, qty: 1 }] }),
      });
    }

    setItemBusyId(null);
  }

  // Stepper: decrement or remove
  async function decrementItem(itemId: number, currentQty: number) {
    if (busy || !order || order.status !== "OPEN") return;
    setItemBusyId(itemId);
    if (currentQty <= 1) {
      await act(`/api/orders/${order.id}/items/${itemId}`, {
        method: "DELETE",
      });
    } else {
      await act(`/api/orders/${order.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: currentQty - 1 }),
      });
    }
    setItemBusyId(null);
  }

  // Stepper: increment
  async function incrementItem(itemId: number, currentQty: number) {
    if (busy || !order || order.status !== "OPEN") return;
    setItemBusyId(itemId);
    await act(`/api/orders/${order.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: currentQty + 1 }),
    });
    setItemBusyId(null);
  }

  // Remove completely
  async function removeItem(itemId: number) {
    if (busy || !order || order.status !== "OPEN") return;
    setItemBusyId(itemId);
    await act(`/api/orders/${order.id}/items/${itemId}`, {
      method: "DELETE",
    });
    setItemBusyId(null);
  }

  // Confirm and send to kitchen
  async function fireKitchen() {
    if (!order || busy) return;
    const ok = await act(`/api/orders/${order.id}/confirm`, {
      method: "POST",
    });
    if (ok) {
      setSuccessNotice("Order fired! Sent directly to the kitchen display.");
    }
  }

  // Request checkout
  async function requestCheckout() {
    if (!order || busy) return;
    const ok = await act(`/api/orders/${order.id}/checkout`, {
      method: "POST",
    });
    if (ok) {
      router.push("/waiter");
    }
  }

  if (!order) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-orange-600" />
          <p className="text-sm font-medium text-zinc-600">Loading POS terminal…</p>
        </div>
      </AppShell>
    );
  }

  const draft = order.items.filter((i) => !i.ticketId);
  const sent = order.items.filter((i) => i.ticketId);
  const total = orderTotal(order.items);
  const draftTotal = orderTotal(draft);
  const sentTotal = orderTotal(sent);
  const totalItemsCount = order.items.reduce((s, i) => s + i.qty, 0);
  const draftItemsCount = draft.reduce((s, i) => s + i.qty, 0);
  const isOpen = order.status === "OPEN";
  const isCheckout = order.status === "CHECKOUT";
  const isPaid = order.status === "PAID" || order.status === "COMPLETED";

  // Map how many of each menuItem are currently in draft
  const draftCountByMenuItemId = new Map<number, number>();
  draft.forEach((i) => {
    draftCountByMenuItemId.set(
      i.menuItemId,
      (draftCountByMenuItemId.get(i.menuItemId) || 0) + i.qty
    );
  });

  return (
    <AppShell>
      <div className="space-y-5 pb-12">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <Link
              href="/waiter"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-2xs hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 transition-all"
              title="Back to Floor Plan"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  POS Station
                </span>
                <span className="text-zinc-300">•</span>
                <span className="text-xs font-semibold text-zinc-600">
                  Order #{order.id}
                </span>
                <span className="text-zinc-300">•</span>
                {isOpen && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Order
                  </span>
                )}
                {isCheckout && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/80">
                    <Clock className="h-3 w-3" />
                    In Checkout
                  </span>
                )}
                {isPaid && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200/80">
                    <CheckCircle2 className="h-3 w-3" />
                    Paid & Closed
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2 mt-0.5">
                <span>{order.table?.name || `Table #${order.tableId}`}</span>
                {order.table?.seats && (
                  <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                    {order.table.seats} seats
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-left sm:text-right">
              <span className="text-xs font-medium text-zinc-500 block">Total Bill</span>
              <span className="text-2xl font-black text-zinc-900 tracking-tight">
                {money(total)}
              </span>
            </div>
            <button
              onClick={() => load(false)}
              disabled={busy}
              title="Refresh order"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-2xs hover:border-zinc-300 hover:text-zinc-900 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin text-orange-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Global Notifications / Status Alerts */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 shadow-xs animate-toast">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="rounded-lg p-1 text-red-500 hover:bg-red-100 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successNotice && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-xs animate-toast">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice("")}
              className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Status Callout when in CHECKOUT */}
        {isCheckout && (
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-blue-950">
                    Table is in Checkout
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Customer is settling the bill at the cashier register. Ordering is locked.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/waiter")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
              >
                <LayoutGrid className="h-4 w-4" />
                Back to Floor Plan
              </button>
            </div>
          </div>
        )}

        {/* Status Callout when PAID */}
        {isPaid && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-950">
                    Order Paid & Completed
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    Payment has been settled with the cashier. Table is ready to be cleared.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/waiter")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <LayoutGrid className="h-4 w-4" />
                Back to Floor Plan
              </button>
            </div>
          </div>
        )}

        {/* Mobile View Toggle Tabs (Visible on < lg screens) */}
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <button
            onClick={() => setMobileTab("menu")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
              mobileTab === "menu"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-white text-zinc-700 border border-zinc-200/80 hover:bg-zinc-50"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>Menu Catalog</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-xs">
              {menu.length}
            </span>
          </button>
          <button
            onClick={() => setMobileTab("ticket")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all relative ${
              mobileTab === "ticket"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-white text-zinc-700 border border-zinc-200/80 hover:bg-zinc-50"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Ticket Slip</span>
            {draftItemsCount > 0 && (
              <span className="rounded-full bg-white text-orange-600 px-1.5 py-0.2 text-xs font-bold shadow-2xs">
                {draftItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Main Dual-Panel POS Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Menu Catalog Browser */}
          <div
            className={`lg:col-span-7 xl:col-span-7 space-y-4 ${
              mobileTab === "ticket" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Search & Category Filter Section */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs space-y-3.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search dishes by name or category…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category Pills with counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((c) => {
                  const isActive = category === c;
                  const count = categoryCounts[c] ?? 0;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                        isActive
                          ? "bg-orange-600 text-white shadow-2xs"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 border border-transparent"
                      }`}
                    >
                      <span>{c}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          isActive
                            ? "bg-orange-700/80 text-white"
                            : "bg-zinc-200/90 text-zinc-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dish Cards Grid */}
            <div>
              {filteredMenu.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
                  <ChefHat className="mx-auto h-10 w-10 text-zinc-300" />
                  <h3 className="mt-3 text-base font-bold text-zinc-900">
                    No dishes found
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                    {searchQuery
                      ? `No items match your search for "${searchQuery}".`
                      : "No menu items in this category."}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filteredMenu.map((m) => {
                    const inDraftCount = draftCountByMenuItemId.get(m.id) || 0;
                    const isItemBusy = itemBusyId === m.id;
                    const canAdd = m.available && isOpen && !busy;

                    return (
                      <div
                        key={m.id}
                        className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 ${
                          m.available
                            ? "border-zinc-200/90 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5"
                            : "border-zinc-200/50 bg-zinc-50/60 opacity-60"
                        }`}
                      >
                        <div>
                          {/* Top Row: Category & In-Stock Indicator */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                              {m.category}
                            </span>
                            {m.available ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                                Sold Out
                              </span>
                            )}
                          </div>

                          {/* Dish Name */}
                          <h3 className="text-base font-bold text-zinc-900 group-hover:text-orange-950 transition-colors leading-snug line-clamp-2">
                            {m.name}
                          </h3>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-100 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-extrabold text-zinc-900">
                              {money(m.price)}
                            </span>
                            {inDraftCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-700 border border-orange-200/80 animate-pop">
                                <Check className="h-3 w-3 text-orange-600" />
                                {inDraftCount} in ticket
                              </span>
                            )}
                          </div>

                          {/* Touch-Friendly + Add Button */}
                          <button
                            type="button"
                            disabled={!canAdd}
                            onClick={() => addItem(m)}
                            className={`flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-sm font-bold shadow-2xs transition-all active:scale-[0.98] ${
                              canAdd
                                ? "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-sm"
                                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                            }`}
                          >
                            {isItemBusy ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-4 w-4 stroke-[2.5]" />
                                <span>{inDraftCount > 0 ? "Add Another" : "Add to Order"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Order Ticket Slip */}
          <div
            className={`lg:col-span-5 xl:col-span-5 ${
              mobileTab === "menu" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="sticky top-20 rounded-2xl border border-zinc-200/90 bg-white shadow-sm overflow-hidden flex flex-col">
              {/* Receipt Header Banner */}
              <div className="border-b border-zinc-200/80 bg-zinc-900 text-white p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-2xs">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                        Live Kitchen Ticket
                      </span>
                      <h2 className="text-lg font-black tracking-tight text-white leading-none mt-0.5">
                        {order.table?.name || `Table #${order.tableId}`}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-zinc-400 block">
                      Order #{order.id}
                    </span>
                    <span className="text-xs font-medium text-emerald-400 inline-block">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Items Container */}
              <div className="p-4 sm:p-5 space-y-5 max-h-[calc(100vh-380px)] overflow-y-auto">
                {order.items.length === 0 ? (
                  <div className="py-10 text-center space-y-2.5">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      No items on ticket yet
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      Select dishes from the menu catalog on the left to start taking the customer&apos;s order.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* SECTION 1: New / Unsent Items (Draft) */}
                    {draft.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-950">
                              New / Unsent Items
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-800">
                            <Clock className="h-3 w-3" />
                            {draftItemsCount} to fire
                          </span>
                        </div>

                        <div className="divide-y divide-zinc-100">
                          {draft.map((item) => (
                            <div
                              key={item.id}
                              className="py-3 flex flex-col gap-2 transition-colors hover:bg-orange-50/40 rounded-xl px-1.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                                    {item.menuItem?.name}
                                  </h4>
                                  <span className="text-xs font-medium text-zinc-500">
                                    {money(item.price)} each
                                  </span>
                                </div>
                                <span className="text-sm font-extrabold text-zinc-900 tabular-nums">
                                  {money(item.qty * item.price)}
                                </span>
                              </div>

                              {/* Quantity Stepper Controls (Touch-Friendly 44px+ targets) */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50/80 p-0.5">
                                  {/* Decrement Button (Min 44px target) */}
                                  <button
                                    type="button"
                                    disabled={!isOpen || busy}
                                    onClick={() => decrementItem(item.id, item.qty)}
                                    aria-label="Decrease quantity"
                                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 transition-all disabled:opacity-50"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>

                                  {/* Quantity Badge */}
                                  <span className="w-9 text-center text-sm font-extrabold text-zinc-900 tabular-nums">
                                    {item.qty}
                                  </span>

                                  {/* Increment Button (Min 44px target) */}
                                  <button
                                    type="button"
                                    disabled={!isOpen || busy}
                                    onClick={() => incrementItem(item.id, item.qty)}
                                    aria-label="Increase quantity"
                                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 transition-all disabled:opacity-50"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Trash Delete Button (Min 44px target) */}
                                <button
                                  type="button"
                                  disabled={!isOpen || busy}
                                  onClick={() => removeItem(item.id)}
                                  aria-label="Remove item"
                                  title="Remove item"
                                  className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: Sent to Kitchen (Fired) */}
                    {sent.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                              Sent to Kitchen
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/80">
                            <Flame className="h-3 w-3 text-amber-600" />
                            Fired ({sent.length} items)
                          </span>
                        </div>

                        <div className="divide-y divide-zinc-100">
                          {sent.map((item) => (
                            <div
                              key={item.id}
                              className="py-2.5 flex items-center justify-between text-zinc-600"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-zinc-100 px-1.5 text-xs font-bold text-zinc-700">
                                  {item.qty}×
                                </span>
                                <div>
                                  <span className="text-sm font-semibold text-zinc-800 block leading-tight">
                                    {item.menuItem?.name}
                                  </span>
                                  <span className="text-[11px] text-zinc-400">
                                    {money(item.price)} each {item.ticketId ? `• Slip #${item.ticketId}` : ""}
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-zinc-700 tabular-nums">
                                {money(item.qty * item.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Receipt Bill Calculation & Totals */}
              <div className="border-t-2 border-dashed border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItemsCount} items)</span>
                    <span className="font-semibold text-zinc-800">{money(total)}</span>
                  </div>
                  {draft.length > 0 && sent.length > 0 && (
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span>Sent: {money(sentTotal)} • Unsent: {money(draftTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Estimated Tax & Service</span>
                    <span className="font-semibold text-emerald-600">Taxes Included</span>
                  </div>
                </div>

                <div className="border-t border-zinc-200/80 pt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      Total Due
                    </span>
                    <span className="text-xs text-zinc-400">All applicable fees included</span>
                  </div>
                  <span className="text-3xl font-black tracking-tight text-zinc-900">
                    {money(total)}
                  </span>
                </div>

                {/* POS Action Buttons */}
                {isOpen && (
                  <div className="space-y-2.5 pt-1">
                    {/* Primary Button: Fire to Kitchen */}
                    <button
                      type="button"
                      disabled={draft.length === 0 || busy}
                      onClick={() => setShowFireModal(true)}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 px-4 text-sm sm:text-base font-bold text-white shadow-sm hover:bg-orange-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Flame className="h-5 w-5" />
                      <span>
                        Fire to Kitchen {draft.length > 0 ? `(${draftItemsCount} items)` : ""}
                      </span>
                    </button>

                    {/* Secondary Button: Request Checkout */}
                    <button
                      type="button"
                      disabled={sent.length === 0 || draft.length > 0 || busy}
                      onClick={() => setShowCheckoutModal(true)}
                      title={
                        draft.length > 0
                          ? "Fire or remove unsent items before requesting checkout"
                          : sent.length === 0
                          ? "Cannot checkout with an empty ticket"
                          : "Send order to Cashier"
                      }
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-zinc-900 bg-transparent py-2.5 px-4 text-xs sm:text-sm font-bold text-zinc-900 hover:bg-zinc-900 hover:text-white active:scale-[0.99] transition-all disabled:border-zinc-300 disabled:text-zinc-400 disabled:cursor-not-allowed"
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Request Checkout (Send to Cashier)</span>
                    </button>
                    {draft.length > 0 && sent.length > 0 && (
                      <p className="text-[11px] text-center text-zinc-400">
                        * Fire or clear new items before requesting checkout.
                      </p>
                    )}
                  </div>
                )}

                {isCheckout && (
                  <div className="rounded-xl bg-blue-100/60 p-3 text-center text-xs font-semibold text-blue-900">
                    Order submitted to cashier. Awaiting customer payment.
                  </div>
                )}

                {isPaid && (
                  <div className="rounded-xl bg-green-100/60 p-3 text-center text-xs font-semibold text-green-900">
                    Order is settled and paid.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Floating Mobile Ticket Bar */}
        <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden print:hidden">
          <button
            type="button"
            onClick={() => setMobileTab(mobileTab === "ticket" ? "menu" : "ticket")}
            className="w-full flex items-center justify-between rounded-2xl bg-zinc-900 text-white p-3.5 shadow-xl border border-zinc-800 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-white font-bold text-xs">
                {totalItemsCount}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">
                  {mobileTab === "ticket" ? "Back to Menu Catalog" : "View Order Ticket"}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {draftItemsCount > 0 ? `${draftItemsCount} new to fire` : "All items sent"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black text-sm text-emerald-400">
              <span>{money(total)}</span>
              <Receipt className="h-4 w-4 text-white" />
            </div>
          </button>
        </div>

        {/* Fire to Kitchen Confirmation Modal */}
        <Modal
          isOpen={showFireModal}
          onClose={() => setShowFireModal(false)}
          title="Fire Order to Kitchen"
          subtitle={`${order.table?.name || `Table #${order.tableId}`} • Order #${order.id}`}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-orange-50/80 p-4 border border-orange-200/80">
              <div className="flex items-center gap-2 text-sm font-bold text-orange-950 mb-2">
                <Flame className="h-4 w-4 text-orange-600" />
                <span>Items to Send to Kitchen ({draftItemsCount})</span>
              </div>
              <div className="divide-y divide-orange-100 text-xs">
                {draft.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between items-center">
                    <span className="font-semibold text-zinc-900">
                      {item.qty}× {item.menuItem?.name}
                    </span>
                    <span className="font-bold text-zinc-700">
                      {money(item.qty * item.price)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-orange-200 flex justify-between font-bold text-sm text-zinc-900">
                <span>New Items Subtotal</span>
                <span className="text-orange-700">{money(draftTotal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFireModal(false)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setShowFireModal(false);
                  await fireKitchen();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] transition disabled:opacity-50"
              >
                <Flame className="h-4 w-4" />
                {busy ? "Sending..." : "Confirm & Fire to Kitchen"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Request Checkout Confirmation Modal */}
        <Modal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          title="Request Checkout"
          subtitle={`${order.table?.name || `Table #${order.tableId}`} • Order #${order.id}`}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
              <p className="text-xs text-zinc-600">
                This will lock the order for editing and alert the cashier register that guests are ready to settle the bill.
              </p>
              <div className="mt-3 pt-3 border-t border-zinc-200 flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase text-zinc-500">
                  Total Due ({totalItemsCount} items)
                </span>
                <span className="text-2xl font-black text-zinc-900">{money(total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setShowCheckoutModal(false);
                  await requestCheckout();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-black active:scale-[0.99] transition disabled:opacity-50"
              >
                <Receipt className="h-4 w-4" />
                {busy ? "Submitting..." : "Send to Cashier"}
              </button>
            </div>
          </div>
        </Modal>
    </AppShell>
  );
}
