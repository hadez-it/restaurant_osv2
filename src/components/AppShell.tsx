"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  Flame,
  Receipt,
  ShieldCheck,
  LogOut,
  Clock,
  Sparkles,
  User,
} from "lucide-react";

interface Me {
  id: number;
  username: string;
  name: string;
  role: string;
}

const NAV_CONFIG: Record<
  string,
  { href: string; label: string; stationCode: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  ADMIN: [
    { href: "/waiter", label: "Floor & Tables", stationCode: "FLR", icon: LayoutGrid },
    { href: "/kitchen", label: "Kitchen KDS", stationCode: "KDS", icon: Flame },
    { href: "/cashier", label: "Cashier Register", stationCode: "POS", icon: Receipt },
    { href: "/admin", label: "Admin Console", stationCode: "OPS", icon: ShieldCheck },
  ],
  WAITER: [{ href: "/waiter", label: "Floor & Tables", stationCode: "FLR", icon: LayoutGrid }],
  KITCHEN: [{ href: "/kitchen", label: "Kitchen KDS", stationCode: "KDS", icon: Flame }],
  CASHIER: [{ href: "/cashier", label: "Cashier Register", stationCode: "POS", icon: Receipt }],
};

const ROLE_STYLES: Record<string, { badge: string; label: string; dot: string }> = {
  ADMIN: {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    label: "Executive Admin",
    dot: "bg-purple-400",
  },
  WAITER: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    label: "Floor Captain",
    dot: "bg-amber-400",
  },
  KITCHEN: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    label: "Chef Station",
    dot: "bg-rose-400",
  },
  CASHIER: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    label: "Cashier POS",
    dot: "bg-emerald-400",
  },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) router.push("/login");
        else setMe(data);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center text-zinc-400">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute h-16 w-16 rounded-full bg-amber-500/10 animate-ping" />
          <div className="h-12 w-12 rounded-2xl bg-obsidian-850 border border-white/10 flex items-center justify-center text-amber-400 shadow-glow-copper">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium tracking-wide text-zinc-400">Initializing Terminal...</p>
      </div>
    );
  }

  const roleMeta = ROLE_STYLES[me.role] || {
    badge: "border-zinc-700 bg-zinc-800 text-zinc-300",
    label: me.role,
    dot: "bg-zinc-400",
  };

  const navItems = NAV_CONFIG[me.role] ?? [];

  return (
    <div className="min-h-screen bg-obsidian-950 text-zinc-100 flex flex-col relative selection:bg-amber-500/25 selection:text-amber-200">
      {/* Top subtle ambient warmth overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.08),transparent)]" />

      {/* Top Command Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-obsidian-950/85 backdrop-blur-2xl shadow-2xl print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
          {/* Left: Brand Crest & Primary Stations */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1">
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-transform active:scale-95 shrink-0"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-copper-700 text-obsidian-950 font-black shadow-glow-copper transition-transform group-hover:scale-105">
                <Sparkles className="h-5 w-5 text-obsidian-950" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    TCS
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest text-amber-500/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">
                    OS v2
                  </span>
                </div>
                <span className="text-[10px] font-medium text-zinc-400 tracking-tight mt-0.5">
                  Restaurant System
                </span>
              </div>
            </Link>

            {/* Station Nav Pill Matrix */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`group relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 shrink-0 ${
                      isActive
                        ? "bg-white/[0.08] text-white border border-amber-500/35 shadow-glow-copper shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-amber-400" : "text-zinc-400 group-hover:text-zinc-300"
                      }`}
                    />
                    <span className="hidden md:inline">{item.label}</span>
                    <span className="md:hidden text-[11px] font-mono text-zinc-400">
                      {item.stationCode}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-gradient-to-r from-amber-400 to-copper-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Telemetry, User Badge & Shift Sign-Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Clock & Pulse Indicator */}
            {currentTime && (
              <div className="hidden lg:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-obsidian-900/90 px-3 py-1.5 text-xs font-mono font-medium text-zinc-300 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span className="tabular-nums font-semibold tracking-tight text-zinc-200">
                  {currentTime}
                </span>
              </div>
            )}

            {/* Operator Card */}
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-obsidian-900/90 p-1 pl-2.5 shadow-2xs">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-zinc-100 leading-tight">
                  {me.name}
                </span>
                <span
                  className={`inline-flex items-center justify-end gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${roleMeta.badge} mt-0.5`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${roleMeta.dot}`} />
                  {roleMeta.label}
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] text-amber-400">
                <User className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Shift Sign-Out */}
            <button
              onClick={logout}
              title="Sign out of current shift"
              className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-obsidian-900/80 px-2.5 sm:px-3 text-xs font-medium text-zinc-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all duration-200 active:scale-95 shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Layout Container */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-5 sm:py-6">
        {children}
      </main>
    </div>
  );
}
