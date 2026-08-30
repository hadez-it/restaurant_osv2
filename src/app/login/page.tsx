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
  ChefHat,
  Radio,
  Cpu,
} from "lucide-react";

interface DemoStation {
  id: string;
  label: string;
  roleSubtitle: string;
  username: string;
  stationCode: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
}

const DEMO_STATIONS: DemoStation[] = [
  {
    id: "admin",
    label: "Admin",
    roleSubtitle: "Executive & Shift Ops",
    username: "admin",
    stationCode: "OPS-01",
    icon: ShieldCheck,
    badgeColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  },
  {
    id: "waiter",
    label: "Waiter",
    roleSubtitle: "Floor & Dining Tables",
    username: "waiter",
    stationCode: "FLR-02",
    icon: LayoutGrid,
    badgeColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    roleSubtitle: "KDS Bump Bar",
    username: "kitchen",
    stationCode: "KDS-03",
    icon: Flame,
    badgeColor: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  {
    id: "cashier",
    label: "Cashier",
    roleSubtitle: "Register & Settlement",
    username: "cashier",
    stationCode: "POS-04",
    icon: Receipt,
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
];

const FEATURES = [
  {
    title: "Kitchen Display System",
    description: "Sub-second order routing, course pacing, and audio chime alerts.",
    icon: ChefHat,
    tag: "KDS ENGINE",
  },
  {
    title: "Floorplan & Seating",
    description: "Real-time table state sync, party occupancy, and turnover timing.",
    icon: LayoutGrid,
    tag: "FLOOR SYNC",
  },
  {
    title: "High-Speed Settlement",
    description: "Lightning cashier register, tender calculations, and printable receipts.",
    icon: Receipt,
    tag: "TENDER POS",
  },
  {
    title: "Role-Based Shift Security",
    description: "Strict isolation for managers, floor staff, and culinary stations.",
    icon: ShieldCheck,
    tag: "AUTH VAULT",
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
      setError("Please enter both terminal username and password");
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
      setError("Unable to connect to authentication gateway");
    }
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-obsidian-950 text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,119,6,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.06),transparent_50%)]" />

      {/* LEFT / HOSPITALITY SHOWCASE (Desktop) */}
      <div className="relative z-10 hidden lg:flex lg:w-7/12 flex-col justify-between p-12 xl:p-16 border-r border-white/[0.08]">
        {/* Brand Lockup & Telemetry Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-copper-700 text-obsidian-950 shadow-glow-copper border border-amber-400/30">
              <Sparkles className="w-6 h-6 text-obsidian-950" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-obsidian-950 shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  TCS RestaurantOS
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  v2 Enterprise
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Hospitality Execution & Point of Sale Platform
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>SERVICES NOMINAL</span>
          </div>
        </div>

        {/* Hero Narrative Block */}
        <div className="my-auto py-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 mb-6">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>MICHELIN-GRADE SPEED & PRECISION</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.1] mb-5">
            Crafted for seamless dining floor coordination.
          </h1>

          <p className="text-base text-zinc-400 leading-relaxed mb-10 max-w-[54ch]">
            Unifying floor waitstaff, high-heat kitchen lines, and rapid cashier settlement into one synchronised operating terminal.
          </p>

          {/* 2x2 Feature Bento */}
          <div className="grid grid-cols-2 gap-3.5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-white/[0.07] bg-obsidian-900/60 p-4 backdrop-blur-xl hover:border-white/[0.14] transition duration-200 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-amber-400 group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-mono font-semibold tracking-wider text-zinc-400 uppercase bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-200 mb-1">{feat.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-snug">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.08] text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              Low Latency
            </span>
            <span>•</span>
            <span>WebSocket Live Pacing</span>
            <span>•</span>
            <span>Offline Resilient</span>
          </div>
          <span className="text-[11px] text-zinc-400">Terminal Node 01</span>
        </div>
      </div>

      {/* RIGHT / AUTHENTICATION CARD */}
      <div className="relative z-10 flex flex-1 flex-col justify-center items-center p-4 sm:p-8 lg:p-12 xl:p-16">
        {/* Mobile Brand Header */}
        <div className="w-full max-w-md mb-6 lg:hidden flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-copper-700 text-obsidian-950 shadow-glow-copper">
              <Sparkles className="w-5 h-5 text-obsidian-950" />
            </div>
            <div className="text-left">
              <span className="text-lg font-black tracking-tight text-white">
                TCS RestaurantOS
              </span>
              <p className="text-[11px] text-zinc-400 font-mono">Terminal Gateway</p>
            </div>
          </div>
        </div>

        {/* Main Terminal Glass Container */}
        <div className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-obsidian-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl shadow-card-dark">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Shift Terminal Sign-In
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Secure Pin
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Select your working station to auto-fill or enter your staff credentials.
            </p>
          </div>

          {/* Quick-Fill Station Grid (2x2) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Station Presets (1-Tap)</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-400">Pass: password123</span>
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
                    className={`group relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/15 shadow-glow-copper ring-1 ring-amber-500/30"
                        : "border-white/[0.08] bg-obsidian-850/80 hover:border-white/[0.16] hover:bg-obsidian-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border ${station.badgeColor}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-white" : "text-zinc-200"
                          }`}
                        >
                          {station.label}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {station.stationCode}
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-400 font-medium">
                      {station.roleSubtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 shadow-xs animate-toast"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Staff Username or Station ID
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
                  className="block h-11 w-full rounded-xl border border-white/[0.12] bg-obsidian-950/80 pl-10 pr-3 text-sm font-medium text-white placeholder:text-zinc-400 focus:border-amber-500 focus:bg-obsidian-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Passcode
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter shift passcode"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="block h-11 w-full rounded-xl border border-white/[0.12] bg-obsidian-950/80 pl-10 pr-10 text-sm font-medium text-white placeholder:text-zinc-400 focus:border-amber-500 focus:bg-obsidian-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-copper-600 text-obsidian-950 font-bold text-sm shadow-glow-copper hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-obsidian-950" />
                  <span>Authorizing Station...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
