"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { Ticket } from "@/lib/types";
import {
  ChefHat,
  CheckCircle,
  Printer,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Check,
} from "lucide-react";

type FilterStatus = "ACTIVE" | "ALL" | "COMPLETED";

// Web Audio API chime synthesizer for incoming orders
function playKitchenChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Pitch 1: 587.33 Hz (D5) - bright bell strike
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Pitch 2: 880.00 Hz (A5) - harmonic chime overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.32, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Graceful fallback if browser restricts autoplay before user interaction
  }
}

// Elapsed time calculations
function getElapsedMinutes(createdAt: string, now: number): number {
  const created = new Date(createdAt).getTime();
  const diffMs = Math.max(0, now - created);
  return Math.floor(diffMs / 60000);
}

function formatElapsedTime(createdAt: string, now: number): string {
  const created = new Date(createdAt).getTime();
  const diffMs = Math.max(0, now - created);
  const totalSecs = Math.floor(diffMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins < 60) {
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export default function KitchenPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null);
  const [autoPrint, setAutoPrint] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterStatus>("ACTIVE");
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [markingDoneId, setMarkingDoneId] = useState<number | null>(null);
  const [recallingId, setRecallingId] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  // Interactive dish item checklist state: ticketId_itemId -> boolean
  const [checkedItemMap, setCheckedItemMap] = useState<Record<number, boolean>>({});

  // Real-time ticking clock for elapsed timers
  const [now, setNow] = useState<number>(() => Date.now());

  const seenIds = useRef<Set<number> | null>(null);
  const autoPrintRef = useRef(autoPrint);
  autoPrintRef.current = autoPrint;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(() => {
    return fetch("/api/tickets")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Ticket[]) => {
        setTickets(list);
        setLastSyncTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );

        if (seenIds.current === null) {
          seenIds.current = new Set(list.map((t) => t.id));
          return;
        }

        const fresh = list.filter((t) => !seenIds.current!.has(t.id));
        for (const t of list) seenIds.current.add(t.id);

        if (fresh.length > 0) {
          if (soundEnabledRef.current) {
            playKitchenChime();
          }
          if (autoPrintRef.current) {
            setPrintTicket(fresh[0]);
          }
        }
      });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 3500);
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

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  async function markDone(id: number) {
    setMarkingDoneId(id);
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      await load();
    } finally {
      setMarkingDoneId(null);
    }
  }

  async function recallTicket(id: number) {
    setRecallingId(id);
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NEW" }),
      });
      await load();
    } finally {
      setRecallingId(null);
    }
  }

  const toggleItemCheck = (itemId: number) => {
    setCheckedItemMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const activeTickets = tickets.filter((t) => t.status === "NEW");
  const doneTickets = tickets.filter((t) => t.status === "DONE");

  const totalItemsCooking = activeTickets.reduce(
    (acc, t) => acc + t.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="rounded-3xl border border-white/[0.1] bg-obsidian-900/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Live Badge */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-copper-600 text-obsidian-950 shadow-glow-copper font-black">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Kitchen Display System
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-500/30">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    {activeTickets.length} {activeTickets.length === 1 ? "ACTIVE SLIP" : "ACTIVE SLIPS"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Sub-second bump bar, course pacing, and automated order chime notifications
                </p>
              </div>
            </div>

            {/* Quick KPI Chips */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-obsidian-950/80 px-3.5 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Total In Prep
                  </span>
                  <span className="text-base font-black text-white font-mono tabular-nums">
                    {totalItemsCooking} items
                  </span>
                </div>
              </div>

              {/* Chime Audio Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-mono font-semibold transition active:scale-95 border ${
                  soundEnabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow-emerald"
                    : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                }`}
                title={soundEnabled ? "Audio chimes active" : "Audio muted"}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span>AUDIO ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span>MUTED</span>
                  </>
                )}
              </button>

              {/* Auto-Print Toggle */}
              <button
                type="button"
                onClick={() => setAutoPrint(!autoPrint)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-mono font-semibold transition active:scale-95 border ${
                  autoPrint
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                }`}
                title="Automatically trigger thermal printer on new slip"
              >
                <Printer className="h-4 w-4" />
                <span>{autoPrint ? "AUTO-PRINT ON" : "PRINT MANUAL"}</span>
              </button>

              {/* Sync Button */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition active:scale-95"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-zinc-400 ${refreshing ? "animate-spin text-amber-400" : ""}`}
                />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {[
                { id: "ACTIVE", label: "Active Queue", count: activeTickets.length },
                { id: "COMPLETED", label: "Completed Slips", count: doneTickets.length },
                { id: "ALL", label: "All Tickets", count: tickets.length },
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as FilterStatus)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white/10 text-white border border-amber-500/40 shadow-glow-copper"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-bold ${
                        isActive
                          ? "bg-amber-400 text-obsidian-950"
                          : "bg-white/[0.08] text-zinc-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
              Last Poll: {lastSyncTime}
            </span>
          </div>
        </div>

        {/* ACTIVE TICKETS QUEUE */}
        {(filter === "ACTIVE" || filter === "ALL") && (
          <div>
            {activeTickets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/[0.12] bg-obsidian-900/40 p-12 sm:p-16 text-center max-w-2xl mx-auto my-6">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-white/[0.04] text-amber-400 mb-4">
                  <ChefHat className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Kitchen Prep Line Clear
                </h2>
                <p className="mt-2 text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  No active orders in the prep queue. New slips fired from floor waitstaff will appear here instantly with live audio chimes.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {activeTickets.map((t) => {
                  const elapsedMins = getElapsedMinutes(t.createdAt, now);
                  const isUrgent = elapsedMins >= 20;
                  const isWarning = elapsedMins >= 10 && elapsedMins < 20;

                  const cardBorder = isUrgent
                    ? "border-2 border-rose-500 shadow-glow-rose urgent-ticket-glow"
                    : isWarning
                    ? "border border-amber-500/60 shadow-glow-copper"
                    : "border border-white/[0.12] shadow-xl";

                  const topBarColor = isUrgent
                    ? "bg-rose-500"
                    : isWarning
                    ? "bg-amber-500"
                    : "bg-emerald-500";

                  const timerBadge = isUrgent
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : isWarning
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

                  const preparedCount = t.items.filter(
                    (item) => checkedItemMap[item.id]
                  ).length;
                  const allPrepared =
                    t.items.length > 0 && preparedCount === t.items.length;

                  return (
                    <div
                      key={t.id}
                      className={`relative flex flex-col justify-between rounded-3xl bg-obsidian-900 overflow-hidden transition-all backdrop-blur-xl ${cardBorder}`}
                    >
                      {/* Top Physical Perforation Accent Bar */}
                      <div className={`h-2.5 w-full ${topBarColor}`} />

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Slip Header */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-lg bg-white/[0.08] border border-white/[0.12] px-2.5 py-1 text-xs font-mono font-black text-white tracking-wide">
                                SLIP #{t.id}
                              </span>
                              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs font-mono text-zinc-400">
                                Ord #{t.order.id}
                              </span>
                            </div>

                            {/* Elapsed Timer Counter */}
                            <div
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${timerBadge}`}
                              title={`Created at ${new Date(t.createdAt).toLocaleTimeString()}`}
                            >
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-bold tabular-nums">
                                {formatElapsedTime(t.createdAt, now)}
                              </span>
                            </div>
                          </div>

                          {/* Large Table Name & Server Info */}
                          <div className="pb-3 border-b border-dashed border-white/[0.1] flex items-start justify-between gap-2">
                            <div>
                              <div className="text-2xl font-black text-white tracking-tight leading-none">
                                {t.order.table.name}
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-zinc-400">
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5 text-zinc-500" />
                                  {t.order.waiter?.name || "Server"}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(t.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPreviewTicket(t)}
                              className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
                              title="Print ticket slip"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Prep Progress Bar */}
                          <div className="my-3">
                            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                              <span>Prep Progress</span>
                              <span className="text-amber-400 font-bold">
                                {preparedCount}/{t.items.length} dishes
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-copper-500 transition-all duration-300"
                                style={{
                                  width: `${t.items.length > 0 ? (preparedCount / t.items.length) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Itemized Dish Checklist */}
                          <div className="space-y-2 py-2">
                            {t.items.map((item) => {
                              const isChecked = !!checkedItemMap[item.id];
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleItemCheck(item.id)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
                                    isChecked
                                      ? "bg-white/[0.02] border-white/[0.04] text-zinc-500 line-through"
                                      : "bg-obsidian-950/80 border-white/[0.08] text-white hover:border-amber-500/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition ${
                                        isChecked
                                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                          : "border-white/[0.14] text-transparent"
                                      }`}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-bold text-sm">
                                      <span className="font-mono text-amber-400 mr-1.5">
                                        {item.qty}×
                                      </span>
                                      {item.menuItem?.name}
                                    </span>
                                  </div>

                                  <span className="text-[10px] font-mono uppercase text-zinc-500">
                                    {item.menuItem?.category}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bump Action Button */}
                        <div className="pt-4 border-t border-white/[0.08] mt-3">
                          <button
                            type="button"
                            disabled={markingDoneId === t.id}
                            onClick={() => markDone(t.id)}
                            className={`w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-black transition-all active:scale-[0.98] cursor-pointer ${
                              allPrepared
                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-obsidian-950 shadow-glow-emerald hover:brightness-110"
                                : "bg-gradient-to-r from-amber-500 to-copper-600 text-obsidian-950 shadow-glow-copper hover:brightness-110"
                            }`}
                          >
                            {markingDoneId === t.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-obsidian-950" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                                <span>
                                  {allPrepared ? "Complete & Bump Slip" : "Bump Slip (Mark Ready)"}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMPLETED TICKETS HISTORY */}
        {(filter === "COMPLETED" || filter === "ALL") && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Recently Expedited Slips ({doneTickets.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <span>{isHistoryExpanded ? "Collapse History" : "Expand History"}</span>
                {isHistoryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {isHistoryExpanded && (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {doneTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-white/[0.06] bg-obsidian-900/60 p-4 space-y-3 opacity-75 hover:opacity-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-zinc-400">
                          SLIP #{t.id} • {t.order.table.name}
                        </span>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {new Date(t.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-bold">
                        COMPLETED
                      </span>
                    </div>

                    <div className="text-xs text-zinc-300 font-mono space-y-1">
                      {t.items.map((i) => (
                        <div key={i.id} className="flex justify-between">
                          <span>
                            {i.qty}× {i.menuItem?.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex justify-end">
                      <button
                        type="button"
                        disabled={recallingId === t.id}
                        onClick={() => recallTicket(t.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-amber-400 transition"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Recall to Line</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Ticket Slip Printable Preview */}
        <Modal
          isOpen={!!previewTicket}
          onClose={() => setPreviewTicket(null)}
          title={`Thermal Print Slip #${previewTicket?.id}`}
          subtitle={`Table ${previewTicket?.order.table.name} • Print Preview`}
          maxWidth="max-w-sm"
        >
          {previewTicket && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.12] bg-white text-zinc-950 p-5 font-mono text-xs shadow-2xl">
                <div className="text-center pb-3 border-b-2 border-dashed border-zinc-300">
                  <h3 className="font-black text-base uppercase">TCS RestaurantOS</h3>
                  <p className="text-[10px] text-zinc-600">KITCHEN EXPEDITE ORDER</p>
                  <p className="text-xs font-bold mt-1">
                    SLIP #{previewTicket.id} • ORD #{previewTicket.order.id}
                  </p>
                </div>

                <div className="py-3 border-b border-zinc-200">
                  <div className="text-lg font-black">{previewTicket.order.table.name}</div>
                  <div className="text-[11px] text-zinc-600">
                    Server: {previewTicket.order.waiter?.name || "Unassigned"}
                  </div>
                  <div className="text-[11px] text-zinc-600">
                    Time: {new Date(previewTicket.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="py-3 space-y-2 border-b border-zinc-200">
                  {previewTicket.items.map((i) => (
                    <div key={i.id} className="flex justify-between font-bold">
                      <span>
                        {i.qty}× {i.menuItem?.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 text-center text-[10px] text-zinc-500">
                  END OF KITCHEN SLIP
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setPreviewTicket(null)}
                  className="min-h-[40px] rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = previewTicket;
                    setPreviewTicket(null);
                    setPrintTicket(t);
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
                >
                  <Printer className="h-4 w-4" />
                  <span>Send to Printer</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
