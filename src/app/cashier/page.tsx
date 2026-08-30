"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { TableInfo, Order, orderTotal, money } from "@/lib/types";
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Armchair,
} from "lucide-react";

type PaymentMethod = "CASH" | "CARD" | "QR";

export default function CashierPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Selected table/order for checkout modal
  const [activePayment, setActivePayment] = useState<{
    table: TableInfo;
    order: Order;
  } | null>(null);

  // Payment method & cash calculation state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [tenderedAmount, setTenderedAmount] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Today's collections tracking (persisted in localStorage + state)
  const [todayCollections, setTodayCollections] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);

  // Completed receipt for printing & record
  const [printedReceipt, setPrintedReceipt] = useState<{
    table: TableInfo;
    order: Order;
    method: PaymentMethod;
    tendered: number;
    change: number;
    timestamp: string;
  } | null>(null);

  // Initialize today's collections from localStorage
  useEffect(() => {
    try {
      const savedCollections = localStorage.getItem("orange_pos_cashier_collections");
      const savedCount = localStorage.getItem("orange_pos_cashier_count");
      if (savedCollections) setTodayCollections(parseFloat(savedCollections) || 0);
      if (savedCount) setTodayCount(parseInt(savedCount, 10) || 0);
    } catch {
      // ignore storage errors
    }
  }, []);

  const load = useCallback(() => {
    fetch("/api/tables")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TableInfo[]) => {
        setTables(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 3500);
    return () => clearInterval(timer);
  }, [load]);

  // Derived queues
  const withOrders = tables.filter((t) => (t.orders?.length ?? 0) > 0);
  const checkoutQueue = withOrders.filter((t) => t.status === "CHECKOUT");
  const diningQueue = withOrders.filter((t) => t.status !== "CHECKOUT");

  // Aggregate metrics
  const pendingBillsCount = checkoutQueue.length;
  const totalDiners = withOrders.reduce((sum, t) => sum + (t.seats || 2), 0);

  // Open payment modal
  const openPaymentModal = (table: TableInfo) => {
    if (!table.orders || table.orders.length === 0) return;
    const order = table.orders[0];
    const total = orderTotal(order.items);
    setActivePayment({ table, order });
    setPaymentMethod("CASH");
    setTenderedAmount(total.toFixed(2));
    setPaymentSuccess(false);
  };

  // Close payment modal
  const closePaymentModal = () => {
    if (busy) return;
    setActivePayment(null);
    setPaymentSuccess(false);
    setTenderedAmount("");
  };

  // Execute payment & release table
  const confirmPayment = async () => {
    if (!activePayment || busy) return;
    const { table, order } = activePayment;
    const total = orderTotal(order.items);
    const tendered = parseFloat(tenderedAmount) || total;
    const change = Math.max(0, tendered - total);

    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Payment processing failed");
        setBusy(false);
        return;
      }

      // Update collections tally
      const newTotal = todayCollections + total;
      const newCount = todayCount + 1;
      setTodayCollections(newTotal);
      setTodayCount(newCount);
      try {
        localStorage.setItem("orange_pos_cashier_collections", newTotal.toFixed(2));
        localStorage.setItem("orange_pos_cashier_count", newCount.toString());
      } catch {
        // ignore
      }

      // Save receipt for potential printing
      const receiptData = {
        table,
        order,
        method: paymentMethod,
        tendered,
        change,
        timestamp: new Date().toLocaleString(),
      };
      setPrintedReceipt(receiptData);
      setPaymentSuccess(true);
      load();
    } catch {
      alert("Network error processing payment");
    } finally {
      setBusy(false);
    }
  };

  // Quick tender helpers
  const currentTotal = activePayment ? orderTotal(activePayment.order.items) : 0;
  const currentTendered = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, currentTendered - currentTotal);
  const remainingDue = Math.max(0, currentTotal - currentTendered);
  const isSufficient = currentTendered >= currentTotal - 0.001;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Control Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Receipt className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Cashier Settlement Terminal
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                REGISTER READY
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Live settlement queue, tender calculations, itemized receipts, and table turnover
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-obsidian-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 shadow-xs hover:border-white/[0.2] hover:text-white active:scale-95 disabled:opacity-60 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${loading ? "animate-spin text-amber-400" : ""}`} />
              <span>Sync Floor</span>
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1: Pending Bills */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-5 shadow-2xl backdrop-blur-xl transition hover:border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Pending Settlement
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                  pendingBillsCount > 0
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                    : "bg-white/[0.04] text-zinc-500 border-white/[0.06]"
                }`}
              >
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono">
                {pendingBillsCount}
              </span>
              <span className="text-xs font-mono text-zinc-400">parties awaiting bill</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {pendingBillsCount === 0
                ? "All active tables currently dining"
                : "Requires immediate cashier processing"}
            </p>
            {pendingBillsCount > 0 && (
              <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-amber-500 to-copper-500" />
            )}
          </div>

          {/* Card 2: Total Diners */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-5 shadow-2xl backdrop-blur-xl transition hover:border-white/[0.14]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Seated Guests
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono">
                {totalDiners}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                guests across {withOrders.length} tables
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 font-mono">
              {tables.length > 0
                ? `${tables.length - withOrders.length} tables clean & available`
                : "Floor capacity ready"}
            </p>
          </div>

          {/* Card 3: Today's Collections */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-5 shadow-2xl backdrop-blur-xl transition hover:border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Today&apos;s Gross Revenue
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-emerald-400 font-mono tabular-nums">
                {money(todayCollections)}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                ({todayCount} settled)
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Total sales settled through this register shift
            </p>
            <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          </div>
        </div>

        {/* Dual Queues Section */}
        <div className="space-y-8">
          {/* QUEUE 1: Ready for Payment */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-obsidian-950 shadow-glow-copper font-black">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    Awaiting Settlement
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Tables that requested checkout and are ready for bill settlement and release
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-bold ${
                  checkoutQueue.length > 0
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "bg-white/[0.04] text-zinc-500 border border-white/[0.06]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    checkoutQueue.length > 0 ? "bg-amber-400 animate-ping" : "bg-zinc-500"
                  }`}
                />
                {checkoutQueue.length} Ready
              </span>
            </div>

            {checkoutQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.12] bg-obsidian-900/40 p-10 text-center shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-zinc-400" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  No tables waiting to settle
                </h3>
                <p className="mt-1 max-w-sm text-xs text-zinc-400">
                  When a server initiates checkout on the floor, the table will appear here for instant settlement.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {checkoutQueue.map((table) => {
                  const order = table.orders![0];
                  const total = orderTotal(order.items);
                  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

                  return (
                    <div
                      key={table.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-amber-500/40 bg-obsidian-900 p-5 shadow-glow-copper transition hover:border-amber-500"
                    >
                      {/* Top status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white">
                              {table.name}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-xs font-mono text-zinc-300">
                              <Armchair className="h-3 w-3 text-zinc-400" />
                              {table.seats} seats
                            </span>
                          </div>
                          <div className="mt-1 text-xs font-mono text-zinc-400">
                            <span>Order #{order.id}</span>
                            {order.waiter && <span> • {order.waiter.name}</span>}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          BILL READY
                        </span>
                      </div>

                      {/* Middle Items Summary */}
                      <div className="my-4 rounded-2xl border border-white/[0.08] bg-obsidian-950/80 p-3.5 text-xs font-mono space-y-1.5">
                        <div className="flex justify-between text-zinc-400">
                          <span>Items Ordered:</span>
                          <span className="text-white font-bold">{itemCount} items</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Elapsed:</span>
                          <span className="text-zinc-300">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-white/[0.08]">
                          <span className="text-zinc-300 font-sans font-semibold">Total Amount:</span>
                          <span className="text-xl font-black text-amber-400 tabular-nums">
                            {money(total)}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => openPaymentModal(table)}
                        className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-obsidian-950 font-black text-xs shadow-glow-copper hover:brightness-110 active:scale-[0.98] transition"
                      >
                        <Receipt className="h-4 w-4" />
                        <span>Settle Bill & Release Table</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUEUE 2: Active Dining Tables */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-zinc-300">
                  <Armchair className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    Currently Dining ({diningQueue.length})
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Tables with active parties who haven&apos;t requested checkout yet
                  </p>
                </div>
              </div>
            </div>

            {diningQueue.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-obsidian-900/40 p-8 text-center text-xs text-zinc-400">
                No active dining parties right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {diningQueue.map((table) => {
                  const order = table.orders![0];
                  const total = orderTotal(order.items);
                  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

                  return (
                    <div
                      key={table.id}
                      className="rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-4 space-y-3 shadow-sm hover:border-white/[0.14] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{table.name}</span>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                          DINING
                        </span>
                      </div>

                      <div className="text-xs font-mono space-y-1 text-zinc-400">
                        <div className="flex justify-between">
                          <span>Order:</span>
                          <span className="text-zinc-200">#{order.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Items:</span>
                          <span className="text-zinc-200">{itemCount}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-white/[0.06] font-bold text-white">
                          <span>Running Tab:</span>
                          <span className="text-amber-400 tabular-nums">{money(total)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openPaymentModal(table)}
                        className="w-full py-2 text-xs font-semibold rounded-xl border border-white/[0.12] bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white transition"
                      >
                        Open Settlement
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Payment Settlement Drawer */}
        <Modal
          isOpen={!!activePayment && !paymentSuccess}
          onClose={closePaymentModal}
          title={
            activePayment
              ? `Checkout: ${activePayment.table.name} (Order #${activePayment.order.id})`
              : "Checkout"
          }
          subtitle="Select tender method and enter payment amount"
          maxWidth="max-w-lg"
        >
          {activePayment && (
            <div className="space-y-5">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CASH", label: "Cash Tender", icon: Banknote },
                    { id: "CARD", label: "Credit Card", icon: CreditCard },
                    { id: "QR", label: "Digital QR", icon: QrCode },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id as PaymentMethod);
                          if (m.id !== "CASH") {
                            setTenderedAmount(currentTotal.toFixed(2));
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-glow-copper"
                            : "bg-obsidian-950/80 border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Quick Tender Shortcuts */}
              {paymentMethod === "CASH" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Quick Cash Presets
                    </label>
                    <span className="text-[10px] font-mono text-amber-400">1-Tap Tender</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Exact", val: currentTotal },
                      { label: "$20", val: 20 },
                      { label: "$50", val: 50 },
                      { label: "$100", val: 100 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setTenderedAmount(btn.val.toFixed(2))}
                        className="py-2 px-2 text-xs font-mono font-bold rounded-xl border border-white/[0.12] bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] active:scale-95 transition"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Due vs Tendered Calculation */}
              <div className="rounded-2xl border border-white/[0.08] bg-obsidian-950/90 p-4 space-y-3 font-mono">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Total Bill:</span>
                  <span className="text-base font-black text-white">{money(currentTotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.08]">
                  <label htmlFor="tendered" className="text-xs text-zinc-400">
                    Amount Tendered:
                  </label>
                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                      $
                    </span>
                    <input
                      id="tendered"
                      type="number"
                      step="0.01"
                      min="0"
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(e.target.value)}
                      className="w-full text-right h-10 pl-7 pr-3 rounded-xl border border-white/[0.14] bg-obsidian-900 text-base font-bold text-white font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Change Due / Balance Due */}
                <div className="pt-3 border-t border-white/[0.08] flex justify-between items-baseline">
                  <span className="text-xs font-sans font-bold text-zinc-300">
                    {isSufficient ? "Change Due to Customer:" : "Remaining Balance Due:"}
                  </span>
                  <span
                    className={`text-xl font-black tabular-nums ${
                      isSufficient ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {money(isSufficient ? changeDue : remainingDue)}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={busy}
                  className="min-h-[44px] rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isSufficient || busy}
                  onClick={confirmPayment}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-xs font-black text-obsidian-950 shadow-glow-emerald hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <span>Processing Settlement...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                      <span>Complete Settlement & Release Table</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Payment Success & Receipt Print */}
        <Modal
          isOpen={paymentSuccess && !!printedReceipt}
          onClose={() => {
            setPaymentSuccess(false);
            setActivePayment(null);
          }}
          title="Payment Settled Successfully"
          subtitle="Table released and ready for new guests"
          maxWidth="max-w-md"
        >
          {printedReceipt && (
            <div className="space-y-4">
              {/* Thermal Receipt Paper Visual */}
              <div className="rounded-2xl border border-white/[0.12] bg-white text-zinc-950 p-6 font-mono text-xs shadow-2xl">
                <div className="text-center pb-3 border-b-2 border-dashed border-zinc-300">
                  <h3 className="font-black text-base uppercase">TCS RestaurantOS</h3>
                  <p className="text-[10px] text-zinc-600">OFFICIAL FISCAL RECEIPT</p>
                  <p className="text-[11px] text-zinc-600 mt-1">{printedReceipt.timestamp}</p>
                  <p className="text-xs font-bold mt-0.5">
                    {printedReceipt.table.name} • Order #{printedReceipt.order.id}
                  </p>
                </div>

                <div className="py-3 space-y-1.5 border-b border-zinc-200">
                  {printedReceipt.order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.qty}× {item.menuItem?.name}
                      </span>
                      <span className="font-bold">{money(item.qty * item.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="py-2.5 space-y-1 border-b border-zinc-200">
                  <div className="flex justify-between font-black text-sm">
                    <span>TOTAL AMOUNT:</span>
                    <span>{money(orderTotal(printedReceipt.order.items))}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 text-[11px]">
                    <span>Method:</span>
                    <span className="font-bold">{printedReceipt.method}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 text-[11px]">
                    <span>Tendered:</span>
                    <span>{money(printedReceipt.tendered)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 text-[11px]">
                    <span>Change Returned:</span>
                    <span className="font-bold text-zinc-950">{money(printedReceipt.change)}</span>
                  </div>
                </div>

                <div className="pt-3 text-center text-[10px] text-zinc-500">
                  THANK YOU FOR DINING WITH US
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSuccess(false);
                    setActivePayment(null);
                  }}
                  className="min-h-[40px] rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
