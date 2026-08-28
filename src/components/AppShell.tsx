"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Me {
  id: number;
  username: string;
  name: string;
  role: string;
}

const NAV: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/waiter", label: "Tables" },
    { href: "/kitchen", label: "Kitchen" },
    { href: "/cashier", label: "Cashier" },
    { href: "/admin", label: "Admin" },
  ],
  WAITER: [{ href: "/waiter", label: "Tables" }],
  KITCHEN: [{ href: "/kitchen", label: "Kitchen" }],
  CASHIER: [{ href: "/cashier", label: "Cashier" }],
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMe)
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-orange-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-orange-600 text-white shadow print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              🍊 OrangePOS
            </Link>
            <nav className="flex gap-1">
              {(NAV[me.role] ?? []).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    pathname.startsWith(n.href)
                      ? "bg-orange-700"
                      : "hover:bg-orange-500"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>
              {me.name} <span className="opacity-75">({me.role.toLowerCase()})</span>
            </span>
            <button
              onClick={logout}
              className="rounded bg-orange-800 px-3 py-1.5 font-medium hover:bg-orange-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
