"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { Ticket } from "@/lib/types";
import {
  ChefHat,
  CheckCircle,
  Printer,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Check,
  Layers,
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
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export default function KitchenPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
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
    const t = setInterval(load, 4000);
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

  // Summary statistics for chef situational awareness
  const totalItemsCooking = activeTickets.reduce(
    (acc, t) => acc + t.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  const oldestActiveMinutes = activeTickets.reduce((max, t) => {
    const mins = getElapsedMinutes(t.createdAt, now);
    return mins > max ? mins : max;
  }, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ================================================================= */}
        {/* TOP ACTION BAR                                                    */}
        {/* ================================================================= */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Live Active Ticket Counter Badge */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm ring-4 ring-orange-50">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                    Kitchen Display System (KDS)
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-0.5 text-xs font-black text-orange-800 border border-orange-200">
                    <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
                    {activeTickets.length} {activeTickets.length === 1 ? "ACTIVE SLIP" : "ACTIVE SLIPS"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-700 font-semibold mt-0.5">
                  <span>Chef Expedite Line</span>
                  {activeTickets.length > 0 && (
                    <>
                      <span className="text-zinc-400">•</span>
                      <span>
                        <strong className="text-zinc-900">{totalItemsCooking}</strong> items in queue
                      </span>
                      {oldestActiveMinutes > 0 && (
                        <>
                          <span className="text-zinc-400">•</span>
                          <span className={oldestActiveMinutes >= 20 ? "text-red-700 font-bold" : oldestActiveMinutes >= 10 ? "text-amber-700 font-bold" : ""}>
                            Oldest: {oldestActiveMinutes}m
                          </span>
                        </>
                      )}
                    </>
                  )}
                  {lastSyncTime && (
                    <span className="hidden sm:inline text-zinc-400 font-normal">
                      (Synced {lastSyncTime})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Controls: Auto-print, Audio Chime, Sync */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Auto-print Toggle Switch */}
              <button
                type="button"
                onClick={() => setAutoPrint((prev) => !prev)}
                className={`group flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all shadow-2xs ${
                  autoPrint
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
                title={
                  autoPrint
                    ? "Auto-print is ON: New slips print immediately to thermal printer"
                    : "Auto-print is OFF: Slips display on screen only"
                }
              >
                <Printer
                  className={`h-4 w-4 ${autoPrint ? "text-emerald-600" : "text-zinc-400"}`}
                />
                <span>Auto-Print</span>
                <span
                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoPrint ? "bg-emerald-600" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      autoPrint ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>

              {/* Audio Chime Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playKitchenChime();
                }}
                className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all shadow-2xs ${
                  soundEnabled
                    ? "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
                title={
                  soundEnabled
                    ? "Audio chime is ON: Plays chime sound on new orders (tap to test/mute)"
                    : "Audio chime is OFF (tap to unmute)"
                }
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-amber-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-zinc-400" />
                )}
                <span>Audio Chime</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-black uppercase ${
                    soundEnabled
                      ? "bg-amber-200 text-amber-900"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {soundEnabled ? "ON" : "OFF"}
                </span>
              </button>

              {/* Manual Refresh Sync */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs disabled:opacity-50"
                title="Force refresh queue"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-orange-600" : "text-zinc-500"}`}
                />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-4 pt-3.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100/90 rounded-xl border border-zinc-200/80 min-w-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilter("ACTIVE")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  filter === "ACTIVE"
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
                }`}
              >
                <Flame
                  className={`h-3.5 w-3.5 ${filter === "ACTIVE" ? "text-orange-600" : "text-zinc-400"}`}
                />
                <span>Active / Cooking</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    filter === "ACTIVE"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {activeTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  filter === "ALL"
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
                }`}
              >
                <Layers
                  className={`h-3.5 w-3.5 ${filter === "ALL" ? "text-zinc-900" : "text-zinc-400"}`}
                />
                <span>All Tickets</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    filter === "ALL"
                      ? "bg-zinc-800 text-white"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {tickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("COMPLETED")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  filter === "COMPLETED"
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
                }`}
              >
                <CheckCircle
                  className={`h-3.5 w-3.5 ${filter === "COMPLETED" ? "text-emerald-600" : "text-zinc-400"}`}
                />
                <span>Completed / History</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    filter === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {doneTickets.length}
                </span>
              </button>
            </div>

            {/* Expedite Legend */}
            <div className="hidden md:flex items-center gap-3 text-[11px] font-bold text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-200 border border-zinc-400" />
                &lt; 10m Normal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 border border-amber-500" />
                10-20m Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 border border-red-600 animate-pulse" />
                &gt; 20m Urgent Alert
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ACTIVE EXPEDITE TICKETS GRID                                      */}
        {/* ================================================================= */}
        {(filter === "ACTIVE" || filter === "ALL") && (
          <div>
            {activeTickets.length === 0 ? (
              /* EMPTY STATE: "Kitchen is clear! All orders fulfilled" */
              <div className="rounded-3xl border-2 border-dashed border-zinc-300 bg-white/90 p-8 sm:p-14 text-center shadow-xs max-w-2xl mx-auto my-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-4 ring-8 ring-orange-50/70 shadow-inner">
                  <ChefHat className="h-10 w-10" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-3 border border-emerald-200">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Line All Clear</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  Kitchen is clear! All orders fulfilled
                </h2>
                <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed font-medium">
                  No active orders in the prep queue. New slips sent from the floor will appear here automatically with real-time audio chime alerts.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-zinc-600">
                  <span className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Auto-polling (4s)
                  </span>
                  <span className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                    {soundEnabled ? (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                        Chime Active
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-zinc-400" />
                        Chime Muted
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                    <Printer className="h-3.5 w-3.5 text-zinc-500" />
                    {autoPrint ? "Auto-print Active" : "Auto-print Off"}
                  </span>
                </div>

                {doneTickets.length > 0 && filter === "ACTIVE" && (
                  <div className="mt-7">
                    <button
                      type="button"
                      onClick={() => setFilter("COMPLETED")}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-black text-white hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Review Completed Orders ({doneTickets.length})</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {activeTickets.map((t) => {
                  const elapsedMins = getElapsedMinutes(t.createdAt, now);
                  const isUrgent = elapsedMins >= 20;
                  const isWarning = elapsedMins >= 10 && elapsedMins < 20;

                  // Escalation styles
                  const cardBorder = isUrgent
                    ? "border-2 border-red-500 shadow-md shadow-red-100/50 ring-2 ring-red-200/80"
                    : isWarning
                    ? "border-2 border-amber-400 shadow-sm ring-1 ring-amber-200/70"
                    : "border-2 border-zinc-300 shadow-xs hover:border-zinc-400";

                  const topBarColor = isUrgent
                    ? "bg-red-600"
                    : isWarning
                    ? "bg-amber-500"
                    : "bg-zinc-900";

                  const timerBadgeStyle = isUrgent
                    ? "bg-red-100 text-red-800 border-red-300 animate-pulse-subtle font-black"
                    : isWarning
                    ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200 font-bold";

                  // Prepared items checklist calculation
                  const preparedItemsCount = t.items.filter(
                    (item) => checkedItemMap[item.id]
                  ).length;
                  const allPrepared =
                    t.items.length > 0 && preparedItemsCount === t.items.length;

                  return (
                    <div
                      key={t.id}
                      className={`relative flex flex-col justify-between rounded-2xl bg-white overflow-hidden transition-all ${cardBorder}`}
                    >
                      {/* Top Physical Perforation Accent Bar */}
                      <div className={`h-2.5 w-full ${topBarColor}`} />

                      <div className="p-4 sm:p-5 flex-1 flex flex-col">
                        {/* Slip Top Header: Slip Number, Order Number, Live Escalating Elapsed Timer */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-black text-white tracking-wide shadow-2xs">
                              SLIP #{t.id}
                            </span>
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-600 border border-zinc-200">
                              Ord #{t.order.id}
                            </span>
                          </div>

                          {/* Elapsed Timer Counter with color escalation badge */}
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border transition-all ${timerBadgeStyle}`}
                            title={`Created at ${new Date(t.createdAt).toLocaleTimeString()}`}
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatElapsedTime(t.createdAt, now)}</span>
                          </div>
                        </div>

                        {/* Large Table Name & Server Attribution */}
                        <div className="pb-3 border-b-2 border-dashed border-zinc-200 flex items-start justify-between gap-2">
                          <div>
                            <div className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-none">
                              {t.order.table.name}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-zinc-600">
                              <span className="flex items-center gap-1 text-zinc-700">
                                <User className="h-3.5 w-3.5 text-zinc-400" />
                                {t.order.waiter?.name || "Server"}
                              </span>
                              <span className="text-zinc-300">•</span>
                              <span className="text-zinc-700 font-medium">
                                {new Date(t.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Prepared item progress pill */}
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                                allPrepared
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : preparedItemsCount > 0
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
                              }`}
                            >
                              {allPrepared && <Check className="h-3 w-3 stroke-[3]" />}
                              {preparedItemsCount}/{t.items.length} Ready
                            </span>
                          </div>
                        </div>

                        {/* Interactive Item Checklist */}
                        <div className="py-3 flex-1">
                          <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                            <span>Tap dish when prepared:</span>
                            <span>{t.items.reduce((s, i) => s + i.qty, 0)} Total Qty</span>
                          </div>

                          <div className="space-y-1.5">
                            {t.items.map((item) => {
                              const isChecked = !!checkedItemMap[item.id];
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => toggleItemCheck(item.id)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      toggleItemCheck(item.id);
                                    }
                                  }}
                                  className={`group flex items-start gap-3 p-2.5 rounded-xl cursor-pointer select-none transition-all ${
                                    isChecked
                                      ? "bg-emerald-50/70 border border-emerald-300/80"
                                      : "bg-zinc-50/90 hover:bg-zinc-100/90 border border-zinc-200/80 active:scale-[0.99]"
                                  }`}
                                >
                                  {/* Checkbox button */}
                                  <div className="mt-0.5 shrink-0">
                                    {isChecked ? (
                                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs">
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      </div>
                                    ) : (
                                      <div className="h-5 w-5 rounded-md border-2 border-zinc-400 group-hover:border-zinc-700 bg-white transition-colors" />
                                    )}
                                  </div>

                                  {/* High-visibility Quantity Badge */}
                                  <div className="shrink-0">
                                    <span
                                      className={`inline-flex min-w-[28px] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-black tracking-tight ${
                                        isChecked
                                          ? "bg-zinc-200 text-zinc-500"
                                          : "bg-zinc-900 text-white shadow-2xs"
                                      }`}
                                    >
                                      {item.qty}×
                                    </span>
                                  </div>

                                  {/* Dish Name & Customer Note */}
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-sm sm:text-base font-bold leading-snug tracking-tight transition-all ${
                                        isChecked
                                          ? "line-through text-zinc-600 font-medium"
                                          : "text-zinc-900"
                                      }`}
                                    >
                                      {item.menuItem.name}
                                    </div>

                                    {/* Prominent customer note callout */}
                                    {item.note && (
                                      <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 shadow-2xs">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                                        <span className="break-words">
                                          Note: {item.note}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Card Bottom Actions: Print Slip & Big Touch Mark Order Ready */}
                        <div className="pt-3 border-t-2 border-dashed border-zinc-200 flex items-center gap-2">
                          {/* Print Thermal Slip Button */}
                          <button
                            type="button"
                            onClick={() => setPrintTicket(t)}
                            className="h-12 px-3.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 hover:border-zinc-400 active:scale-95 text-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                            title="Print thermal kitchen slip"
                          >
                            <Printer className="h-4 w-4 text-zinc-600" />
                            <span className="hidden sm:inline">Print</span>
                          </button>

                          {/* Mark Order Ready Button */}
                          <button
                            type="button"
                            onClick={() => markDone(t.id)}
                            disabled={markingDoneId === t.id}
                            className={`flex-1 h-12 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 ${
                              allPrepared
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300/80"
                                : "bg-orange-600 hover:bg-orange-700 text-white"
                            }`}
                          >
                            {markingDoneId === t.id ? (
                              <>
                                <RefreshCw className="h-5 w-5 animate-spin" />
                                <span>Expediting...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 stroke-[2.5]" />
                                <span>Mark Order Ready</span>
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

        {/* ================================================================= */}
        {/* COMPLETED / HISTORY SECTION                                       */}
        {/* ================================================================= */}
        {(filter === "COMPLETED" || (filter === "ALL" && doneTickets.length > 0)) && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 tracking-tight">
                    Completed Slips History
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Recently fulfilled kitchen tickets
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600 border border-zinc-200">
                  {doneTickets.length} fulfilled
                </span>
              </div>

              {/* Expand / Collapse toggle */}
              <button
                type="button"
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              >
                <span>{isHistoryExpanded ? "Collapse" : "Expand"}</span>
                {isHistoryExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {isHistoryExpanded && (
              <div className="mt-4">
                {doneTickets.length === 0 ? (
                  <div className="p-8 text-center text-sm font-semibold text-zinc-400">
                    No completed tickets on record yet for this shift.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {doneTickets.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 hover:bg-zinc-50 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-black text-xs text-zinc-900">
                              Slip #{t.id}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-600">
                              {new Date(t.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="text-base font-black text-zinc-800">
                            {t.order.table.name}
                          </div>

                          <div className="text-xs font-medium text-zinc-600 mb-2">
                            Waiter: {t.order.waiter?.name || "Server"}
                          </div>

                          <div className="space-y-1 text-xs text-zinc-600 border-t border-zinc-200/70 pt-2 mb-3">
                            {t.items.slice(0, 3).map((i) => (
                              <div key={i.id} className="truncate">
                                <span className="font-bold text-zinc-800">{i.qty}×</span>{" "}
                                {i.menuItem.name}
                              </div>
                            ))}
                            {t.items.length > 3 && (
                              <div className="text-[11px] text-zinc-600 italic">
                                +{t.items.length - 3} more items...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200/70">
                          {/* Re-print Slip */}
                          <button
                            type="button"
                            onClick={() => setPrintTicket(t)}
                            className="flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            title="Re-print ticket slip"
                          >
                            <Printer className="h-3.5 w-3.5 text-zinc-500" />
                            <span>Print</span>
                          </button>

                          {/* Recall Ticket back to kitchen queue */}
                          <button
                            type="button"
                            onClick={() => recallTicket(t.id)}
                            disabled={recallingId === t.id}
                            className="flex-1 rounded-lg border border-orange-200 bg-orange-50 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors flex items-center justify-center gap-1 shadow-2xs disabled:opacity-50"
                            title="Re-open ticket and return to kitchen queue"
                          >
                            <RotateCcw
                              className={`h-3.5 w-3.5 ${
                                recallingId === t.id ? "animate-spin" : ""
                              }`}
                            />
                            <span>Recall</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* PHYSICAL THERMAL PRINTER SLIP LAYOUT (HIDDEN UNTIL PRINT)         */}
        {/* ================================================================= */}
        {printTicket && (
          <div className="print-area fixed left-0 top-0 hidden w-72 bg-white p-4 font-mono text-xs text-black print:block leading-tight">
            <div className="text-center font-black text-sm uppercase tracking-wider pb-0.5">
              *** KITCHEN EXPEDITE SLIP ***
            </div>
            <div className="text-center text-[10px] text-zinc-600 pb-2 border-b border-black">
              TCS RestaurantOS
            </div>

            <div className="py-2 space-y-0.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>SLIP #{printTicket.id}</span>
                <span>ORDER #{printTicket.order.id}</span>
              </div>
              <div className="text-base font-black uppercase tracking-tight pt-1">
                TABLE: {printTicket.order.table.name}
              </div>
              <div>Server: {printTicket.order.waiter?.name || "Staff"}</div>
              <div>Time: {new Date(printTicket.createdAt).toLocaleTimeString()}</div>
              <div>Date: {new Date(printTicket.createdAt).toLocaleDateString()}</div>
            </div>

            <div className="my-1.5 border-t-2 border-dashed border-black" />

            <div className="py-1">
              <div className="text-[10px] font-bold uppercase tracking-wider pb-1">
                QTY / DISH SPECIFICATION
              </div>
              <div className="space-y-2">
                {printTicket.items.map((i) => (
                  <div key={i.id} className="text-xs">
                    <div className="font-bold flex items-start gap-1.5">
                      <span className="text-sm font-black">{i.qty}×</span>
                      <span className="flex-1">{i.menuItem.name}</span>
                    </div>
                    {i.note && (
                      <div className="pl-5 text-[11px] font-black uppercase">
                        ** NOTE: {i.note} **
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="my-2 border-t-2 border-dashed border-black" />

            <div className="text-center text-[10px] space-y-0.5">
              <div>
                Total Items:{" "}
                {printTicket.items.reduce((s, i) => s + i.qty, 0)}
              </div>
              <div>Printed: {new Date().toLocaleTimeString()}</div>
              <div className="pt-1 font-bold">================================</div>
              <div className="font-bold">--- END OF TICKET ---</div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
