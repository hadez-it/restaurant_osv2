"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
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
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  Armchair,
  Check,
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
    const timer = setInterval(load, 4000);
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
      {/* Top Header & Context */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                <Receipt className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Cashier Terminal
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Live settlement queue, tender calculations, and table release management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60 transition"
            >
              <RefreshCw className={`h-4 w-4 text-zinc-500 ${loading ? "animate-spin" : ""}`} />
              Sync Floor
            </button>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1: Pending Bills */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:border-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Pending Checkout
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  pendingBillsCount > 0
                    ? "bg-amber-100 text-amber-600 animate-pulse"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {pendingBillsCount}
              </span>
              <span className="text-xs font-medium text-zinc-500">tables waiting</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {pendingBillsCount === 0
                ? "All active tables currently dining"
                : "Requires immediate cashier processing"}
            </p>
            {pendingBillsCount > 0 && (
              <div className="absolute top-0 right-0 h-1 w-full bg-amber-500" />
            )}
          </div>

          {/* Card 2: Total Diners */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:border-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Total Diners Seated
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {totalDiners}
              </span>
              <span className="text-xs font-medium text-zinc-500">
                guests across {withOrders.length} tables
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {tables.length > 0
                ? `${tables.length - withOrders.length} tables currently open & clean`
                : "Floor capacity ready"}
            </p>
          </div>

          {/* Card 3: Today's Collections */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:border-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Today&apos;s Collections
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-700">
                {money(todayCollections)}
              </span>
              <span className="text-xs font-medium text-zinc-500">
                ({todayCount} settled)
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Total revenue processed through this terminal today
            </p>
            <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
          </div>
        </div>

        {/* Dual Queues Section */}
        <div className="space-y-8">
          {/* QUEUE 1: Ready for Payment (Prominent) */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                    Ready for Payment
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Tables that requested checkout and are waiting for final bill settlement
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  checkoutQueue.length > 0
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    checkoutQueue.length > 0 ? "bg-amber-500 animate-ping" : "bg-zinc-400"
                  }`}
                />
                {checkoutQueue.length} Ready
              </span>
            </div>

            {checkoutQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-10 text-center shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                  <CheckCircle2 className="h-6 w-6 text-zinc-400" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-800">
                  No tables waiting to pay
                </h3>
                <p className="mt-1 max-w-sm text-xs text-zinc-500">
                  When a server initiates checkout on the floor, the table will appear here
                  for immediate settlement.
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
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-orange-500/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-orange-600"
                    >
                      {/* Top ribbon / status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-zinc-900">
                              {table.name}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                              <Armchair className="h-3 w-3" />
                              {table.seats} seats
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            Order #{order.id} · Waiter:{" "}
                            <span className="font-semibold text-zinc-700">
                              {order.waiter?.name || "Server"}
                            </span>
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                          CHECKOUT
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="mt-4 rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                        <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
                          <span>Items Ordered ({itemCount})</span>
                          <span>Price</span>
                        </div>
                        <ul className="max-h-36 space-y-1.5 overflow-y-auto text-xs divide-y divide-zinc-100">
                          {order.items.slice(0, 4).map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between pt-1 first:pt-0"
                            >
                              <span className="truncate pr-2 text-zinc-700">
                                <span className="font-semibold text-zinc-900">{item.qty}×</span>{" "}
                                {item.menuItem.name}
                              </span>
                              <span className="shrink-0 font-medium text-zinc-900">
                                {money(item.qty * item.price)}
                              </span>
                            </li>
                          ))}
                          {order.items.length > 4 && (
                            <li className="pt-1 text-center text-xs font-medium text-orange-600">
                              +{order.items.length - 4} more items
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Total & Action */}
                      <div className="mt-4 pt-3 border-t border-zinc-100">
                        <div className="flex items-baseline justify-between mb-3">
                          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Total Due
                          </span>
                          <span className="text-2xl font-black text-orange-600">
                            {money(total)}
                          </span>
                        </div>

                        <button
                          onClick={() => openPaymentModal(table)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] transition"
                        >
                          <CreditCard className="h-4 w-4" />
                          Process Payment
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUEUE 2: Active Dining Tables (Secondary) */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700">
                  <Armchair className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-zinc-900">
                    Active Dining Tables
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Guests currently dining with active tabs open
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                {diningQueue.length} Dining
              </span>
            </div>

            {diningQueue.length === 0 ? (
              <div className="rounded-xl border border-zinc-200/80 bg-white p-6 text-center text-xs text-zinc-400">
                No active dining tables at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {diningQueue.map((table) => {
                  const order = table.orders![0];
                  const total = orderTotal(order.items);
                  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

                  return (
                    <div
                      key={table.id}
                      className="flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs hover:border-zinc-300 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">{table.name}</span>
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            DINING
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          Waiter: {order.waiter?.name || "Server"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {itemCount} items ordered
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                            Subtotal
                          </span>
                          <span className="font-bold text-zinc-800 text-sm">
                            {money(total)}
                          </span>
                        </div>
                        <button
                          onClick={() => openPaymentModal(table)}
                          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition"
                        >
                          Settle Early
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL / DRAWER */}
      {activePayment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs print:hidden animate-in fade-in duration-150">
          <div className="relative flex flex-col max-h-[92dvh] sm:max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-zinc-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 sm:px-6 py-4 bg-zinc-50/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white font-bold">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    Settle Bill — {activePayment.table.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Order #{activePayment.order.id} · Waiter:{" "}
                    {activePayment.order.waiter?.name || "Server"}
                  </p>
                </div>
              </div>
              <button
                onClick={closePaymentModal}
                disabled={busy}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {paymentSuccess ? (
                /* Payment Success View */
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>
                  <h4 className="text-2xl font-black text-zinc-900">
                    Payment Succeeded!
                  </h4>
                  <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                    {activePayment.table.name} has been settled and released as FREE.
                    Receipt recorded.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handlePrintReceipt}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 transition"
                    >
                      <Printer className="h-4 w-4 text-zinc-600" />
                      Print Thermal Receipt
                    </button>
                    <button
                      onClick={closePaymentModal}
                      className="rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-orange-700 transition"
                    >
                      Close & Return to Queue
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bill Total Highlight */}
                  <div className="flex items-center justify-between rounded-2xl bg-orange-50/60 p-4 border border-orange-200">
                    <div>
                      <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider">
                        Amount Payable
                      </span>
                      <p className="text-xs text-orange-600">
                        {activePayment.order.items.reduce((s, i) => s + i.qty, 0)} items total
                      </p>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-orange-600">
                      {money(currentTotal)}
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("CASH");
                          setTenderedAmount(currentTotal.toFixed(2));
                        }}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 border-2 transition ${
                          paymentMethod === "CASH"
                            ? "border-orange-600 bg-orange-50/50 text-orange-700 font-bold shadow-xs"
                            : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                        }`}
                      >
                        <Banknote className="h-6 w-6" />
                        <span className="text-xs font-medium">Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("CARD");
                          setTenderedAmount(currentTotal.toFixed(2));
                        }}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 border-2 transition ${
                          paymentMethod === "CARD"
                            ? "border-orange-600 bg-orange-50/50 text-orange-700 font-bold shadow-xs"
                            : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                        }`}
                      >
                        <CreditCard className="h-6 w-6" />
                        <span className="text-xs font-medium">Credit / Debit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("QR");
                          setTenderedAmount(currentTotal.toFixed(2));
                        }}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 border-2 transition ${
                          paymentMethod === "QR"
                            ? "border-orange-600 bg-orange-50/50 text-orange-700 font-bold shadow-xs"
                            : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                        }`}
                      >
                        <QrCode className="h-6 w-6" />
                        <span className="text-xs font-medium">Mobile / QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Cash Change Calculator Section */}
                  {paymentMethod === "CASH" && (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-zinc-700 uppercase">
                            Cash Tendered ($)
                          </label>
                          <span className="text-xs font-medium text-zinc-500">
                            Required: {money(currentTotal)}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-lg">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tenderedAmount}
                            onChange={(e) => setTenderedAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-8 pr-4 text-xl font-bold text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      </div>

                      {/* Quick Tender Preset Buttons */}
                      <div>
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                          Quick Presets
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setTenderedAmount(currentTotal.toFixed(2))}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition shadow-2xs"
                          >
                            Exact ({money(currentTotal)})
                          </button>
                          {[10, 20, 50, 100].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setTenderedAmount(preset.toFixed(2))}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                                currentTendered === preset
                                  ? "border-orange-500 bg-orange-50 text-orange-700"
                                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100"
                              }`}
                            >
                              ${preset}
                            </button>
                          ))}
                          {currentTotal > 10 && currentTotal % 10 !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const rounded = Math.ceil(currentTotal / 10) * 10;
                                setTenderedAmount(rounded.toFixed(2));
                              }}
                              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition shadow-2xs"
                            >
                              ${Math.ceil(currentTotal / 10) * 10} (Round Up)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Change / Due Display */}
                      <div className="pt-2">
                        {isSufficient ? (
                          <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-800">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider block">
                                  Change to Return
                                </span>
                                <span className="text-xs text-emerald-700">
                                  Return to customer
                                </span>
                              </div>
                            </div>
                            <span className="text-2xl font-black text-emerald-700">
                              {money(changeDue)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-amber-800">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider block">
                                  Shortage
                                </span>
                                <span className="text-xs text-amber-700">
                                  Additional cash needed
                                </span>
                              </div>
                            </div>
                            <span className="text-xl font-black text-amber-700">
                              {money(remainingDue)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Terminal Preview */}
                  {paymentMethod === "CARD" && (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 text-center space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">
                          External Terminal Ready
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                          Instruct customer to insert chip, tap contactless (Apple Pay / Google Pay),
                          or swipe on the countertop terminal.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Device Connected & Listening
                      </div>
                    </div>
                  )}

                  {/* QR Code Preview */}
                  {paymentMethod === "QR" && (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 text-center space-y-3">
                      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-white border-2 border-zinc-300 p-2 shadow-xs">
                        <QrCode className="h-24 w-24 text-zinc-800" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">
                          Dynamic Payment QR
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500">
                          Customer scans with mobile banking or wallet app to pay {money(currentTotal)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Itemized Receipt Preview Drawer */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 font-mono text-xs text-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[11px] text-zinc-500 uppercase tracking-widest">
                        Itemized Receipt Preview
                      </span>
                      <button
                        onClick={handlePrintReceipt}
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-sans font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <Printer className="h-3 w-3" />
                        Print Thermal Receipt
                      </button>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 space-y-1">
                      <div className="text-center font-bold">🍊 TCS RestaurantOS</div>
                      <div className="text-center text-[10px] text-zinc-500">
                        Table: {activePayment.table.name} · Order #{activePayment.order.id}
                      </div>
                      <div className="my-1 border-t border-dashed border-zinc-300" />
                      {activePayment.order.items.map((i) => (
                        <div key={i.id} className="flex justify-between">
                          <span>
                            {i.qty}× {i.menuItem.name}
                          </span>
                          <span>{money(i.qty * i.price)}</span>
                        </div>
                      ))}
                      <div className="my-1 border-t border-dashed border-zinc-300" />
                      <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1">
                        <span>TOTAL</span>
                        <span>{money(currentTotal)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer / Primary Action */}
            {!paymentSuccess && (
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 border-t border-zinc-200 px-4 sm:px-6 py-4 bg-zinc-50/80">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={busy}
                  className="w-full sm:w-auto rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={busy || (paymentMethod === "CASH" && !isSufficient)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  {busy ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Payment & Release Table
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT TEMPLATE (visible only during window.print()) */}
      <div className="hidden print:block print:w-72 print:mx-auto print:font-mono print:text-black print:text-xs print:leading-tight">
        {printedReceipt ? (
          <div>
            <div className="text-center font-bold text-sm">🍊 TCS RestaurantOS</div>
            <div className="text-center text-[10px]">RESTAURANT MANAGEMENT OS</div>
            <div className="text-center text-[10px]">123 Gourmet Ave, Suite 100</div>
            <div className="text-center text-[10px]">Tel: (555) 019-2834</div>
            <div className="my-2 border-t border-dashed border-black" />

            <div>TABLE: {printedReceipt.table.name}</div>
            <div>ORDER: #{printedReceipt.order.id}</div>
            <div>SERVER: {printedReceipt.order.waiter?.name || "Staff"}</div>
            <div>DATE: {printedReceipt.timestamp}</div>
            <div className="my-2 border-t border-dashed border-black" />

            {printedReceipt.order.items.map((i) => (
              <div key={i.id} className="flex justify-between py-0.5">
                <span>
                  {i.qty}× {i.menuItem.name}
                </span>
                <span>{money(i.qty * i.price)}</span>
              </div>
            ))}

            <div className="my-2 border-t border-dashed border-black" />
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>{money(orderTotal(printedReceipt.order.items))}</span>
            </div>

            <div className="my-1 border-t border-dashed border-black" />
            <div className="flex justify-between text-[11px]">
              <span>METHOD</span>
              <span>{printedReceipt.method}</span>
            </div>
            {printedReceipt.method === "CASH" && (
              <>
                <div className="flex justify-between text-[11px]">
                  <span>TENDERED</span>
                  <span>{money(printedReceipt.tendered)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span>CHANGE</span>
                  <span>{money(printedReceipt.change)}</span>
                </div>
              </>
            )}

            <div className="my-4 text-center text-[10px]">
              <div>*** PAID IN FULL ***</div>
              <div className="mt-1">Thank you for dining with us!</div>
              <div>Please come again</div>
            </div>
          </div>
        ) : activePayment ? (
          <div>
            <div className="text-center font-bold text-sm">🍊 TCS RestaurantOS</div>
            <div className="text-center text-[10px]">TABLE BILL ESTIMATE</div>
            <div className="my-2 border-t border-dashed border-black" />
            <div>TABLE: {activePayment.table.name}</div>
            <div>ORDER: #{activePayment.order.id}</div>
            <div className="my-2 border-t border-dashed border-black" />
            {activePayment.order.items.map((i) => (
              <div key={i.id} className="flex justify-between py-0.5">
                <span>
                  {i.qty}× {i.menuItem.name}
                </span>
                <span>{money(i.qty * i.price)}</span>
              </div>
            ))}
            <div className="my-2 border-t border-dashed border-black" />
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL DUE</span>
              <span>{money(orderTotal(activePayment.order.items))}</span>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
