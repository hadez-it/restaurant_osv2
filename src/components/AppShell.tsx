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
  { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  ADMIN: [
    { href: "/waiter", label: "Floor & Tables", icon: LayoutGrid },
    { href: "/kitchen", label: "Kitchen KDS", icon: Flame },
    { href: "/cashier", label: "Cashier Register", icon: Receipt },
    { href: "/admin", label: "Admin Console", icon: ShieldCheck },
  ],
  WAITER: [{ href: "/waiter", label: "Floor & Tables", icon: LayoutGrid }],
  KITCHEN: [{ href: "/kitchen", label: "Kitchen KDS", icon: Flame }],
  CASHIER: [{ href: "/cashier", label: "Cashier Register", icon: Receipt }],
};

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  ADMIN: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    label: "Administrator",
  },
  WAITER: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Floor Staff",
  },
  KITCHEN: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Kitchen Station",
  },
  CASHIER: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Register POS",
  },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-500 border-t-transparent" />
          <span className="text-sm font-medium text-zinc-600">Initializing Restaurant OS...</span>
        </div>
      </div>
    );
  }

  const roleStyle = ROLE_STYLES[me.role] || {
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-200",
    label: me.role,
  };

  const navItems = NAV_CONFIG[me.role] ?? [];

  return (
    <div className="min-h-screen bg-zinc-50/60 flex flex-col">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md shadow-xs print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="group flex items-center gap-2.5 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-base font-extrabold tracking-tight text-zinc-900">
                    Orange<span className="text-orange-600">OS</span>
                  </span>
                  <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700">
                    v2
                  </span>
                </div>
                <span className="text-[10px] font-medium text-zinc-400 mt-0.5">
                  Restaurant Workflow Suite
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-zinc-900 text-white shadow-xs"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-orange-400" : "text-zinc-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Meta & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Clock Chip */}
            {currentTime && (
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100/60 px-3 py-1 text-xs font-semibold text-zinc-600">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span>{currentTime}</span>
              </div>
            )}

            {/* User Chip with Role Badge */}
            <div className="flex items-center gap-2.5 rounded-lg border border-zinc-200/80 bg-white p-1 pl-2.5 shadow-2xs">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-zinc-900 leading-tight">
                  {me.name}
                </span>
                <span
                  className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  {roleStyle.label}
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                <User className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign out of current shift"
              className="flex h-8.5 items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white px-3 text-xs font-semibold text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
