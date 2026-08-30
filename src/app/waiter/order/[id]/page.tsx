/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { MenuItem, Order, orderTotal, money } from "@/lib/types";
import { getMenuItemImage } from "@/lib/menu-images";
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
  Loader2,
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
      setSuccessNotice("Order fired successfully to kitchen display.");
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
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="h-7 w-7 animate-spin text-amber-500" />
          <p className="text-sm font-medium tracking-wide">Loading Order Terminal...</p>
        </div>
      </AppShell>
    );
  }

  const draft = order.items.filter((i) => !i.ticketId);
  const sent = order.items.filter((i) => i.ticketId);
  const total = orderTotal(order.items);
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
        {/* Top Control Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <Link
              href="/waiter"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-obsidian-900 text-zinc-300 hover:text-white hover:bg-obsidian-850 active:scale-95 transition-all shadow-xs"
              title="Back to Floor Plan"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  POS STATION
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono font-semibold text-amber-400">
                  ORDER #{order.id}
                </span>
                <span className="text-zinc-600">•</span>
                {isOpen && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE DRAFT
                  </span>
                )}
                {isCheckout && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-indigo-300 border border-indigo-500/30">
                    <Clock className="h-3 w-3" />
                    IN CHECKOUT
                  </span>
                )}
                {isPaid && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    PAID & CLOSED
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 mt-0.5">
                <span>{order.table?.name || `Table #${order.tableId}`}</span>
                {order.table?.seats && (
                  <span className="text-xs font-mono font-normal text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08]">
                    {order.table.seats} seats
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-left sm:text-right">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">Total Due</span>
              <span className="text-2xl font-black text-white tracking-tight font-mono tabular-nums">
                {money(total)}
              </span>
            </div>
            <button
              onClick={() => load(false)}
              disabled={busy}
              title="Refresh order"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-obsidian-900 text-zinc-300 shadow-xs hover:border-white/[0.2] hover:text-white active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-300 shadow-xs animate-toast">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="rounded-lg p-1 text-rose-400 hover:bg-rose-500/20 hover:text-rose-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successNotice && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-300 shadow-xs animate-toast">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice("")}
              className="rounded-lg p-1 text-emerald-400 hover:bg-emerald-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Status Callout when in CHECKOUT */}
        {isCheckout && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Table Settlement Pending
                  </h2>
                  <p className="text-xs text-indigo-200/80">
                    Customer bill is currently pending cashier settlement. Modifications are temporarily locked.
                  </p>
                </div>
              </div>
              <Link
                href="/cashier"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-600 transition active:scale-95"
              >
                <span>Go to Cashier Register</span>
                <Receipt className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Mobile View Toggle */}
        <div className="flex lg:hidden rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-1">
          <button
            type="button"
            onClick={() => setMobileTab("menu")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mobileTab === "menu"
                ? "bg-white/10 text-white border border-amber-500/30 shadow-xs"
                : "text-zinc-400"
            }`}
          >
            Menu Catalog ({menu.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("ticket")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "ticket"
                ? "bg-white/10 text-white border border-amber-500/30 shadow-xs"
                : "text-zinc-400"
            }`}
          >
            <span>Live Ticket</span>
            {totalItemsCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-mono text-obsidian-950 font-black">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Main Dual-Panel POS Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Menu Catalog Browser */}
          <div
            className={`lg:col-span-7 xl:col-span-7 space-y-4 ${
              mobileTab === "ticket" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Search & Category Filter Section */}
            <div className="rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-4 shadow-2xl space-y-3.5 backdrop-blur-xl">
              {/* Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search dishes by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.12] bg-obsidian-950/80 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-hidden transition-all font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((c) => {
                  const isActive = category === c;
                  const count = categoryCounts[c] ?? 0;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                        isActive
                          ? "bg-gradient-to-r from-amber-500 to-copper-600 text-obsidian-950 font-bold shadow-glow-copper"
                          : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 border border-white/[0.06]"
                      }`}
                    >
                      <span>{c}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                          isActive
                            ? "bg-obsidian-950/30 text-obsidian-950"
                            : "bg-white/[0.08] text-zinc-400"
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
                <div className="rounded-2xl border border-dashed border-white/[0.12] bg-obsidian-900/40 p-12 text-center">
                  <ChefHat className="mx-auto h-10 w-10 text-zinc-600" />
                  <h3 className="mt-3 text-base font-bold text-white">
                    No dishes found
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    {searchQuery
                      ? `No items match your search for "${searchQuery}".`
                      : "No menu items in this category."}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
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
                        className={`group relative flex flex-col justify-between rounded-2xl border bg-obsidian-900/90 overflow-hidden shadow-xl transition-all duration-200 ${
                          m.available
                            ? "border-white/[0.08] hover:border-amber-500/40 hover:shadow-glow-copper hover:-translate-y-0.5"
                            : "border-white/[0.04] opacity-50 bg-obsidian-950/60"
                        }`}
                      >
                        {/* Food Photography Image Banner */}
                        <div className="relative h-36 w-full bg-obsidian-950 overflow-hidden">
                          <img
                            src={getMenuItemImage(m)}
                            alt={m.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-black/30" />

                          {/* Category Badge Overlay */}
                          <div className="absolute top-2.5 left-2.5">
                            <span className="inline-block rounded-md bg-obsidian-950/80 border border-white/[0.12] px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-200 backdrop-blur-md">
                              {m.category}
                            </span>
                          </div>

                          {/* Availability / Quantity Tag */}
                          <div className="absolute top-2.5 right-2.5">
                            {inDraftCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-mono font-black text-obsidian-950 shadow-sm">
                                {inDraftCount} on ticket
                              </span>
                            ) : m.available ? (
                              <span className="inline-block rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 backdrop-blur-md">
                                Available
                              </span>
                            ) : (
                              <span className="inline-block rounded-md bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-rose-400 backdrop-blur-md">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Content & Action Button */}
                        <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                          <div>
                            <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                              {m.name}
                            </h3>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-base font-black text-white font-mono tabular-nums">
                                {money(m.price)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canAdd || isItemBusy}
                            onClick={() => addItem(m)}
                            className={`w-full min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                              canAdd
                                ? inDraftCount > 0
                                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:text-white"
                                  : "bg-white/[0.06] border border-white/[0.12] text-zinc-200 hover:bg-gradient-to-r hover:from-amber-500 hover:to-copper-600 hover:text-obsidian-950 hover:border-transparent"
                                : "bg-white/[0.02] text-zinc-600 border border-white/[0.04] cursor-not-allowed"
                            }`}
                          >
                            {isItemBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
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

          {/* RIGHT PANEL: Live Order Ticket Dock */}
          <div
            className={`lg:col-span-5 xl:col-span-5 ${
              mobileTab === "menu" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="sticky top-20 rounded-3xl border border-white/[0.12] bg-obsidian-900/95 shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl shadow-card-dark">
              {/* Receipt Header Banner */}
              <div className="border-b border-white/[0.08] bg-obsidian-850/90 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-xs">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block">
                        LIVE KITCHEN TICKET
                      </span>
                      <h2 className="text-lg font-black tracking-tight text-white leading-none mt-0.5">
                        {order.table?.name || `Table #${order.tableId}`}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-semibold text-zinc-400 block">
                      Order #{order.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 inline-block">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Items List */}
              <div className="p-4 sm:p-5 space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto">
                {order.items.length === 0 ? (
                  <div className="py-12 text-center space-y-2.5">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-zinc-500">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      No items on ticket yet
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      Select dishes from the menu catalog on the left to add to the dining party&apos;s ticket.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* SECTION 1: New / Unsent Draft Items */}
                    {draft.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                              PENDING KITCHEN FIRE
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                            <Clock className="h-3 w-3" />
                            {draftItemsCount} to fire
                          </span>
                        </div>

                        <div className="divide-y divide-white/[0.06]">
                          {draft.map((item) => (
                            <div
                              key={item.id}
                              className="py-3 flex flex-col gap-2 rounded-xl px-1.5 hover:bg-white/[0.02] transition"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-bold text-white leading-tight">
                                    {item.menuItem?.name}
                                  </h4>
                                  <span className="text-xs font-mono text-zinc-400">
                                    {money(item.price)} each
                                  </span>
                                </div>
                                <span className="text-sm font-black text-amber-400 tabular-nums font-mono">
                                  {money(item.qty * item.price)}
                                </span>
                              </div>

                              {/* Stepper Controls */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1 rounded-xl border border-white/[0.1] bg-obsidian-950 p-0.5">
                                  <button
                                    type="button"
                                    disabled={!isOpen || busy}
                                    onClick={() => decrementItem(item.id, item.qty)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-200 hover:bg-white/15 active:scale-95 transition disabled:opacity-50"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>

                                  <span className="w-8 text-center text-xs font-mono font-black text-white tabular-nums">
                                    {item.qty}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={!isOpen || busy}
                                    onClick={() => incrementItem(item.id, item.qty)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-200 hover:bg-white/15 active:scale-95 transition disabled:opacity-50"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  disabled={!isOpen || busy}
                                  onClick={() => removeItem(item.id)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95 transition disabled:opacity-50"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: Already Fired Items */}
                    {sent.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                              FIRED TO KITCHEN
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {sent.length} items
                          </span>
                        </div>

                        <div className="divide-y divide-white/[0.06]">
                          {sent.map((item) => (
                            <div
                              key={item.id}
                              className="py-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-400">
                                  {item.qty}×
                                </span>
                                <span className="font-medium text-zinc-200">
                                  {item.menuItem?.name}
                                </span>
                              </div>
                              <span className="font-mono font-semibold text-zinc-300 tabular-nums">
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

              {/* Bill Totals Dock & Actions */}
              <div className="border-t border-white/[0.08] bg-obsidian-850/95 p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal ({totalItemsCount} items)</span>
                    <span className="tabular-nums">{money(total)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Tax & Service</span>
                    <span className="text-emerald-400">Included in Price</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-white/[0.08]">
                    <span className="text-sm font-bold text-white font-sans">Total Due</span>
                    <span className="text-2xl font-black text-white font-mono tabular-nums">
                      {money(total)}
                    </span>
                  </div>
                </div>

                {/* Primary Action Controls */}
                <div className="space-y-2.5">
                  {/* Fire Button */}
                  {isOpen && (
                    <button
                      type="button"
                      disabled={draft.length === 0 || busy}
                      onClick={() => setShowFireModal(true)}
                      className={`w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                        draft.length > 0
                          ? "bg-gradient-to-r from-amber-500 to-copper-600 text-obsidian-950 font-black shadow-glow-copper hover:brightness-110"
                          : "bg-white/[0.05] text-zinc-500 border border-white/[0.08] cursor-not-allowed"
                      }`}
                    >
                      <Flame className="h-4 w-4" />
                      <span>
                        {draft.length > 0
                          ? `Fire ${draftItemsCount} New Items to Kitchen`
                          : "No New Items to Fire"}
                      </span>
                    </button>
                  )}

                  {/* Checkout Request Button */}
                  {isOpen && (
                    <button
                      type="button"
                      disabled={order.items.length === 0 || busy}
                      onClick={() => setShowCheckoutModal(true)}
                      className={`w-full min-h-[42px] flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                        order.items.length > 0
                          ? "border border-white/[0.14] bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white"
                          : "border border-white/[0.04] text-zinc-600 cursor-not-allowed"
                      }`}
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Request Checkout (Send to Cashier)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Confirm Fire to Kitchen */}
        <Modal
          isOpen={showFireModal}
          onClose={() => setShowFireModal(false)}
          title="Fire Order to Kitchen"
          subtitle={`Table ${order.table?.name || order.tableId} • ${draftItemsCount} items ready to cook`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-300">
              The following {draftItemsCount} items will be sent immediately to the Kitchen Display System (KDS):
            </p>

            <div className="rounded-2xl border border-white/[0.08] bg-obsidian-950/80 p-3.5 space-y-2 max-h-48 overflow-y-auto">
              {draft.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <span className="text-zinc-200">
                    <span className="font-mono font-bold text-amber-400">{item.qty}×</span>{" "}
                    {item.menuItem?.name}
                  </span>
                  <span className="font-mono font-semibold text-zinc-400 tabular-nums">
                    {money(item.qty * item.price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowFireModal(false)}
                className="min-h-[40px] rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFireModal(false);
                  fireKitchen();
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110 transition"
              >
                <Flame className="h-4 w-4" />
                <span>Confirm & Fire to Kitchen</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Confirm Request Checkout */}
        <Modal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          title="Send to Cashier Register"
          subtitle={`Final bill total: ${money(total)}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              This will lock the order for editing and alert the cashier register that Table {order.table?.name || order.tableId} is ready to pay.
            </p>

            <div className="rounded-2xl border border-white/[0.08] bg-obsidian-950/80 p-4 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Total Items:</span>
                <span className="text-white font-bold">{totalItemsCount}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Bill:</span>
                <span className="text-base text-amber-400 font-bold tabular-nums">
                  {money(total)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="min-h-[40px] rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition"
              >
                Keep Open
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  requestCheckout();
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 text-xs font-bold text-white shadow-xs hover:bg-indigo-600 transition"
              >
                <Receipt className="h-4 w-4" />
                <span>Send to Cashier</span>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
