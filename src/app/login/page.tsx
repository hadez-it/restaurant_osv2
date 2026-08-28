"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Sparkles,
  ShieldCheck,
  LayoutGrid,
  Receipt,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Activity,
  ChefHat,
} from "lucide-react";

interface DemoStation {
  id: string;
  label: string;
  roleSubtitle: string;
  username: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: {
    bg: string;
    text: string;
    border: string;
    activeBorder: string;
    activeRing: string;
    iconBg: string;
  };
}

const DEMO_STATIONS: DemoStation[] = [
  {
    id: "admin",
    label: "Admin",
    roleSubtitle: "Owner & Shift Ops",
    username: "admin",
    icon: ShieldCheck,
    accentColor: {
      bg: "bg-purple-50/70 hover:bg-purple-100/80",
      text: "text-purple-900",
      border: "border-purple-200/80",
      activeBorder: "border-purple-600",
      activeRing: "ring-2 ring-purple-500/25",
      iconBg: "bg-purple-100 text-purple-700",
    },
  },
  {
    id: "waiter",
    label: "Waiter",
    roleSubtitle: "Floor & Tables",
    username: "waiter",
    icon: LayoutGrid,
    accentColor: {
      bg: "bg-amber-50/70 hover:bg-amber-100/80",
      text: "text-amber-900",
      border: "border-amber-200/80",
      activeBorder: "border-amber-600",
      activeRing: "ring-2 ring-amber-500/25",
      iconBg: "bg-amber-100 text-amber-700",
    },
  },
  {
    id: "kitchen",
    label: "Kitchen",
    roleSubtitle: "KDS Bump Bar",
    username: "kitchen",
    icon: Flame,
    accentColor: {
      bg: "bg-rose-50/70 hover:bg-rose-100/80",
      text: "text-rose-900",
      border: "border-rose-200/80",
      activeBorder: "border-rose-600",
      activeRing: "ring-2 ring-rose-500/25",
      iconBg: "bg-rose-100 text-rose-700",
    },
  },
  {
    id: "cashier",
    label: "Cashier",
    roleSubtitle: "Register & POS",
    username: "cashier",
    icon: Receipt,
    accentColor: {
      bg: "bg-emerald-50/70 hover:bg-emerald-100/80",
      text: "text-emerald-900",
      border: "border-emerald-200/80",
      activeBorder: "border-emerald-600",
      activeRing: "ring-2 ring-emerald-500/25",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
  },
];

const FEATURES = [
  {
    title: "Real-time Kitchen Display (KDS)",
    description: "Sub-second ticket routing, automated course timers & bump station alerts.",
    icon: ChefHat,
    color: "from-rose-500/20 to-orange-500/10 text-rose-400 border-rose-500/30",
  },
  {
    title: "Instant Floorplan & Seating",
    description: "Dynamic table state sync, occupancy pacing & live party turnover tracking.",
    icon: LayoutGrid,
    color: "from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30",
  },
  {
    title: "Touch POS & Split Billing",
    description: "Lightning-fast cashier terminal, itemized split payments & automated fiscal reports.",
    icon: Receipt,
    color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Role-based Shift Control",
    description: "Isolated permission boundaries for managers, floor waitstaff & culinary lines.",
    icon: ShieldCheck,
    color: "from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30",
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleQuickFill = (station: DemoStation) => {
    setUsername(station.username);
    setPassword("password123");
    setSelectedStation(station.id);
    setError("");
  };
  const handleInputChange = (field: "username" | "password", val: string) => {
    if (field === "username") {
      setUsername(val);
      const match = DEMO_STATIONS.find((s) => s.username === val.trim().toLowerCase());
      setSelectedStation(match ? match.id : null);
    } else {
      setPassword(val);
    }
    if (error) setError("");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      setLoading(false);

      if (res.ok) {
        const data = await res.json();
        router.replace(data.home);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid username or password");
      }
    } catch {
      setLoading(false);
      setError("Unable to connect to authentication server");
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-white">
      {/* LEFT / BRAND SHOWCASE (visible on lg screens) */}
      <div className="relative hidden lg:flex lg:w-7/12 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-r border-zinc-800/80 overflow-hidden">
        {/* Ambient background glow & subtle radial mesh */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        {/* Top Header: Brand Lockup & System Status */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 shadow-lg shadow-orange-600/30 border border-orange-300/30">
              <Flame className="w-6 h-6 text-white fill-white/20" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-300 flex items-center justify-center border-2 border-zinc-950 shadow-xs">
                <Sparkles className="w-2.5 h-2.5 text-zinc-950" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  Orange<span className="text-orange-500">OS</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Suite 2.4
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Restaurant Operating Engine
              </p>
            </div>
          </div>

          {/* Quick summary chip: All Systems Operational */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            All Systems Operational
          </div>
        </div>

        {/* Center: Mission & Feature Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300 mb-4">
              <Activity className="w-3.5 h-3.5 text-orange-400" />
              Real-time synchronization across all stations
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Command your dining room with instant precision.
            </h1>
            <p className="mt-3 text-sm xl:text-base text-zinc-400 leading-relaxed">
              Designed for high-volume hospitality. Unifying kitchen line execution,
              dynamic floor plans, and rapid touch checkout into one zero-lag terminal.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-3.5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-850/80 backdrop-blur-xs"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${feat.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                        {feat.title}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400 leading-normal">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Status / Telemetry Footer */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>KDS Sync: <strong className="text-zinc-200 font-semibold">&lt; 30ms</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Active Tables: <strong className="text-zinc-200 font-semibold">8/8 Monitored</strong></span>
            </div>
            <div className="hidden xl:flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>Shift Security: <strong className="text-zinc-200 font-semibold">JWT Session</strong></span>
            </div>
          </div>
          <span className="text-[11px] text-zinc-400">
            OrangeOS v2.4 Enterprise
          </span>
        </div>
      </div>

      {/* RIGHT / AUTH FORM */}
      <div className="flex flex-1 flex-col justify-center items-center p-4 sm:p-8 lg:p-12 xl:p-16 bg-zinc-50 relative min-h-screen text-zinc-900">
        {/* Subtle background mesh for right panel */}
        <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />

        {/* Mobile Header: Brand & Status (hidden on lg) */}
        <div className="w-full max-w-md mb-5 lg:hidden flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 shadow-md shadow-orange-600/20 text-white">
              <Flame className="w-5 h-5 fill-white/20" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-zinc-900">
                  Orange<span className="text-orange-600">OS</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-100 text-orange-700">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">Restaurant Suite</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            All Systems Operational
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-200/90 bg-white/95 p-5 sm:p-8 shadow-2xl shadow-zinc-900/5 backdrop-blur-xl transition-all">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Station Sign In
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Select a quick demo station or authenticate with your staff credentials.
            </p>
          </div>

          {/* QUICK-FILL DEMO STATIONS (2x2 Touch Grid) */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Quick-Fill Demo Stations
              </label>
              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                1-Tap Populate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {DEMO_STATIONS.map((station) => {
                const Icon = station.icon;
                const isSelected = selectedStation === station.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    data-testid={`demo-${station.id}`}
                    onClick={() => handleQuickFill(station)}
                    className={`group relative flex flex-col items-start p-2.5 sm:p-3 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] min-h-[62px] ${
                      isSelected
                        ? `${station.accentColor.activeBorder} ${station.accentColor.activeRing} bg-white shadow-sm ring-2`
                        : `${station.accentColor.border} ${station.accentColor.bg}`
                    }`}
                    title={`Auto-populate ${station.label} credentials`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div
                          className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg ${station.accentColor.iconBg}`}
                        >
                          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-zinc-950 font-extrabold" : station.accentColor.text
                          }`}
                        >
                          {station.label}
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-white shadow-xs">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-600 transition-colors">
                          &rarr;
                        </span>
                      )}
                    </div>

                    <span className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 font-medium leading-tight">
                      {station.roleSubtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-sm text-rose-800 shadow-xs animate-in fade-in duration-200"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
                {error}
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={submit} className="space-y-4">
            {/* USERNAME INPUT */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Username or Terminal ID
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="admin, waiter, kitchen, cashier"
                  value={username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="block h-12 w-full rounded-xl border border-zinc-300 bg-zinc-50/60 pl-10 pr-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-600"
                >
                  Password
                </label>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Default: <code className="text-zinc-600 font-semibold">password123</code>
                </span>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="block h-12 w-full rounded-xl border border-zinc-300 bg-zinc-50/60 pl-10 pr-10 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
                <button
                  type="button"
                  data-testid="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                data-testid="submit-login"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition-all duration-150 hover:bg-orange-700 hover:shadow-orange-600/35 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Terminal</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* FOOTER NOTICE */}
          <div className="mt-5 pt-4 border-t border-zinc-100 text-center">
            <p className="text-[11px] text-zinc-500 leading-normal">
              Encrypted shift authentication. All station events are logged for operational security and audit compliance.
            </p>
          </div>
        </div>

        {/* Bottom subtle copyright on right side */}
        <div className="mt-5 text-center text-xs text-zinc-400">
          OrangeOS Restaurant Suite &bull; Hardware Accelerated POS
        </div>
      </div>
    </div>
  );
}
