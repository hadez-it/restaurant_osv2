"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { TableInfo, MenuItem, money } from "@/lib/types";

interface UserRow {
  id: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
}

const TABS = ["Tables", "Menu", "Users"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("Tables");
  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-bold text-orange-700">Admin</h1>
      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t ? "bg-orange-600 text-white" : "bg-white text-gray-700 hover:bg-orange-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Tables" && <TablesTab />}
      {tab === "Menu" && <MenuTab />}
      {tab === "Users" && <UsersTab />}
    </AppShell>
  );
}

function useList<T>(url: string): [T[], () => void] {
  const [list, setList] = useState<T[]>([]);
  const load = useCallback(() => {
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then(setList);
  }, [url]);
  useEffect(load, [load]);
  return [list, load];
}

function TablesTab() {
  const [tables, load] = useList<TableInfo>("/api/tables");
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("4");
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, seats }),
    });
    if (res.ok) {
      setName("");
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed");
    }
  }

  async function remove(id: number) {
    setError("");
    const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed");
    }
    load();
  }

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500">Table name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded border px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Seats</label>
          <input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} className="w-20 rounded border px-3 py-1.5" />
        </div>
        <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Add table</button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </form>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-orange-100 text-left text-orange-800">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Seats</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {tables.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 font-medium">{t.name}</td>
                <td className="px-4 py-2">{t.seats}</td>
                <td className="px-4 py-2">{t.status}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove(t.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MenuTab() {
  const [items, load] = useList<MenuItem>("/api/menu");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, category }),
    });
    if (res.ok) {
      setName("");
      setPrice("");
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed");
    }
  }

  async function toggle(item: MenuItem) {
    await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/menu/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded border px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Price</label>
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-24 rounded border px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Mains" className="rounded border px-3 py-1.5" />
        </div>
        <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Add item</button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </form>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-orange-100 text-left text-orange-800">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Available</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((m) => (
              <tr key={m.id} className={m.available ? "" : "text-gray-400"}>
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2">{m.category}</td>
                <td className="px-4 py-2">{money(m.price)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggle(m)}
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${m.available ? "bg-green-500" : "bg-gray-400"}`}
                  >
                    {m.available ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove(m.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, load] = useList<UserRow>("/api/users");
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "WAITER" });
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ username: "", password: "", name: "", role: "WAITER" });
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed");
    }
  }

  async function toggleActive(u: UserRow) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500">Username</label>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="rounded border px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Full name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded border px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="rounded border px-3 py-1.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded border px-3 py-2">
            <option value="WAITER">Waiter</option>
            <option value="KITCHEN">Kitchen</option>
            <option value="CASHIER">Cashier</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Add user</button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </form>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-orange-100 text-left text-orange-800">
            <tr>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className={u.active ? "" : "text-gray-400"}>
                <td className="px-4 py-2 font-medium">{u.username}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${u.active ? "bg-green-500" : "bg-gray-400"}`}
                  >
                    {u.active ? "Active" : "Disabled"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
