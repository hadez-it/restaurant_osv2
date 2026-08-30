/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { TableInfo, MenuItem, Order, orderTotal, money } from "@/lib/types";
import { getMenuItemImage } from "@/lib/menu-images";
import {
  LayoutGrid,
  Utensils,
  Users,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  ChefHat,
  Eye,
  EyeOff,
  Armchair,
  Pencil,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface UserRow {
  id: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

const TABS = [
  { id: "Tables", label: "Tables & Floorplan", icon: LayoutGrid },
  { id: "Menu", label: "Menu Catalog", icon: Utensils },
  { id: "Users", label: "Staff & Accounts", icon: Users },
  { id: "Sales", label: "Sales & Revenue", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("Tables");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Executive Admin Console
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-purple-300">
                OPERATIONS CONTROL
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Floorplan arrangement, menu catalog, staff roles, and restaurant financial telemetry
            </p>
          </div>
        </div>

        {/* Tab Navigation Dock */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-1.5 shadow-2xl backdrop-blur-xl overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-copper-600 text-obsidian-950 shadow-glow-copper"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "Tables" && <TablesTab />}
          {activeTab === "Menu" && <MenuTab />}
          {activeTab === "Users" && <UsersTab />}
          {activeTab === "Sales" && <SalesTab />}
        </div>
      </div>
    </AppShell>
  );
}

/* =========================================================================
   TAB 1: TABLES & FLOORPLAN
   ========================================================================= */
function TablesTab() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tables").then((r) => (r.ok ? r.json() : []));
      setTables(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const [name, setName] = useState("");
  const [seats, setSeats] = useState("4");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit table state
  const [editingTable, setEditingTable] = useState<TableInfo | null>(null);
  const [editName, setEditName] = useState("");
  const [editSeats, setEditSeats] = useState("4");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), seats: Number(seats) || 4 }),
      });
      if (res.ok) {
        setName("");
        setSeats("4");
        setShowAddModal(false);
        loadTables();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create table");
      }
    } catch {
      setError("Network error creating table");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTable || !editName.trim()) return;
    setEditError("");
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/tables/${editingTable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          seats: Number(editSeats) || 4,
        }),
      });

      if (res.ok) {
        setEditingTable(null);
        loadTables();
      } else {
        const d = await res.json().catch(() => ({}));
        setEditError(d.error || "Failed to update table");
      }
    } catch {
      setEditError("Network error updating table");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function deleteTable(id: number) {
    if (!confirm("Are you sure you want to delete this table?")) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadTables();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to delete table");
      }
    } catch {
      alert("Network error deleting table");
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Dining Floorplan Layout
          </h2>
          <p className="text-xs text-zinc-400">
            Configure dining tables, guest seat capacities, and floor arrangement
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 py-2 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Dining Table</span>
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center text-zinc-400">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-obsidian-900/40 p-12 text-center">
          <Armchair className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-sm font-bold text-white">No dining tables configured</h3>
          <p className="mt-1 text-xs text-zinc-400">Add tables to initialize your restaurant floorplan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-4 shadow-xl hover:border-amber-500/35 hover:shadow-glow-copper transition duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-white tracking-tight">
                    {t.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      t.status === "FREE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : t.status === "OCCUPIED"
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <Armchair className="h-4 w-4 text-zinc-500" />
                  <span>{t.seats} Chairs Capacity</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTable(t);
                    setEditName(t.name);
                    setEditSeats(String(t.seats));
                  }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition"
                  title="Edit table"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteTable(t.id)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400 transition"
                  title="Delete table"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Table */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Dining Table"
        subtitle="Specify table name and guest chair capacity"
        maxWidth="max-w-md"
      >
        <form onSubmit={addTable} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Table Identifier
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Table 9, Booth A, Patio 3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Chair Seats Capacity
            </label>
            <input
              type="number"
              min="1"
              max="24"
              required
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
            >
              {submitting ? "Adding..." : "Save Table"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Table */}
      <Modal
        isOpen={!!editingTable}
        onClose={() => setEditingTable(null)}
        title="Edit Dining Table"
        subtitle={`Modifying ${editingTable?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={updateTable} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Table Identifier
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Chair Seats Capacity
            </label>
            <input
              type="number"
              min="1"
              max="24"
              required
              value={editSeats}
              onChange={(e) => setEditSeats(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {editError && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
              {editError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setEditingTable(null)}
              className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
            >
              {editSubmitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================================
   TAB 2: MENU CATALOG
   ========================================================================= */
function MenuTab() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/menu").then((r) => (r.ok ? r.json() : []));
      setItems(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Add Item State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Item State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price),
          category: category.trim() || "Mains",
          available: true,
        }),
      });

      if (res.ok) {
        setName("");
        setPrice("");
        setCategory("");
        setShowAddModal(false);
        loadMenu();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create dish");
      }
    } catch {
      setError("Network error creating dish");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem || !editName.trim() || !editPrice) return;
    setEditError("");
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/menu/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          price: parseFloat(editPrice),
          category: editCategory.trim() || "Mains",
          available: editAvailable,
        }),
      });

      if (res.ok) {
        setEditingItem(null);
        loadMenu();
      } else {
        const d = await res.json().catch(() => ({}));
        setEditError(d.error || "Failed to update dish");
      }
    } catch {
      setEditError("Network error updating dish");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function deleteItem(id: number) {
    if (!confirm("Are you sure you want to delete this menu dish?")) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadMenu();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to delete dish");
      }
    } catch {
      alert("Network error deleting dish");
    }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available }),
      });
      loadMenu();
    } catch {
      alert("Network error updating availability");
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Menu Catalog & Pricing
          </h2>
          <p className="text-xs text-zinc-400">
            Manage culinary offerings, categories, pricing, and availability
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 py-2 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedCategory === c
                  ? "bg-white/10 text-white border border-amber-500/40 shadow-glow-copper"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search dishes or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-7 rounded-xl border border-white/[0.1] bg-obsidian-950/80 text-xs text-white placeholder:text-zinc-500 font-mono focus:border-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Menu Items Grid */}
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center text-zinc-400">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-obsidian-900/40 p-12 text-center">
          <ChefHat className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-sm font-bold text-white">No dishes match your filter</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group flex flex-col justify-between rounded-2xl border bg-obsidian-900/90 overflow-hidden shadow-xl transition-all duration-200 ${
                item.available
                  ? "border-white/[0.08] hover:border-amber-500/35 hover:shadow-glow-copper"
                  : "border-white/[0.04] opacity-60 bg-obsidian-950/60"
              }`}
            >
              <div className="relative h-28 sm:h-36 w-full bg-obsidian-950 overflow-hidden">
                <img
                  src={getMenuItemImage(item)}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-black/30" />
                <span className="absolute top-2.5 left-2.5 rounded-md bg-obsidian-950/80 border border-white/[0.12] px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-200 backdrop-blur-md">
                  {item.category}
                </span>
                <span
                  className={`absolute top-2.5 right-2.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold backdrop-blur-md ${
                    item.available
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/20 border border-rose-500/30 text-rose-400"
                  }`}
                >
                  {item.available ? "Active" : "Sold Out"}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-base font-black text-white font-mono tabular-nums">
                    {money(item.price)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => toggleAvailability(item)}
                    className="text-[11px] font-mono text-zinc-400 hover:text-white"
                  >
                    {item.available ? "Mark Sold Out" : "Mark Available"}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setEditName(item.name);
                        setEditPrice(String(item.price));
                        setEditCategory(item.category);
                        setEditAvailable(item.available);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                      title="Edit dish"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/15 hover:text-rose-400"
                      title="Delete dish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Menu Item */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Menu Dish"
        subtitle="Enter dish details, category, and price"
        maxWidth="max-w-md"
      >
        <form onSubmit={addItem} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Dish Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wagyu Ribeye Steak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white placeholder:text-zinc-500 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="16.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Category
              </label>
              <input
                type="text"
                placeholder="Mains, Starters..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
            >
              {submitting ? "Adding..." : "Save Dish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Menu Item */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Menu Dish"
        subtitle={`Modifying ${editingItem?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={updateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Dish Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editAvailable"
              checked={editAvailable}
              onChange={(e) => setEditAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-obsidian-950 text-amber-500"
            />
            <label htmlFor="editAvailable" className="text-xs text-zinc-300 font-medium">
              Available for Ordering
            </label>
          </div>

          {editError && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
              {editError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
            >
              {editSubmitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================================
   TAB 3: STAFF & USER DIRECTORY
   ========================================================================= */
function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users").then((r) => (r.ok ? r.json() : []));
      setUsers(res);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "WAITER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ username: "", password: "", name: "", role: "WAITER" });
        setShowAddModal(false);
        loadUsers();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create user account");
      }
    } catch {
      setError("Network error creating user");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(u: UserRow) {
    try {
      await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      });
      loadUsers();
    } catch {
      alert("Failed to update user status");
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Staff Members & Terminal Permissions
          </h2>
          <p className="text-xs text-zinc-400">
            Account provisioning, station roles, and shift authorization
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 px-4 py-2 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Staff Member</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-obsidian-900/80 p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {["ALL", "ADMIN", "WAITER", "KITCHEN", "CASHIER"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                roleFilter === r
                  ? "bg-white/10 text-white border border-amber-500/40 shadow-glow-copper"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {r === "ALL" ? "All Roles" : r}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search staff by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-7 rounded-xl border border-white/[0.1] bg-obsidian-950/80 text-xs text-white placeholder:text-zinc-500 font-mono focus:border-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-4 space-y-3 shadow-xl hover:border-white/[0.16] transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">{u.name}</h3>
                <p className="text-xs font-mono text-zinc-400">@{u.username}</p>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                  u.role === "ADMIN"
                    ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                    : u.role === "WAITER"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : u.role === "KITCHEN"
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {u.role}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs font-mono">
              <span className={u.active ? "text-emerald-400" : "text-zinc-500"}>
                {u.active ? "● Active Shift" : "○ Inactive"}
              </span>
              <button
                type="button"
                onClick={() => toggleActive(u)}
                className="text-zinc-400 hover:text-white"
              >
                {u.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add User */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Provision Staff Account"
        subtitle="Create credentials and assign terminal station role"
        maxWidth="max-w-md"
      >
        <form onSubmit={addUser} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Full Staff Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Chen"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white placeholder:text-zinc-500 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. marian"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white placeholder:text-zinc-500 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Initial Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Passcode"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-11 px-3.5 pr-10 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white placeholder:text-zinc-500 font-mono focus:border-amber-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Station Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-white/[0.12] bg-obsidian-950 text-sm text-white font-mono focus:border-amber-500 focus:outline-hidden"
            >
              <option value="WAITER">Floor Waitstaff (Waiter)</option>
              <option value="KITCHEN">Kitchen Line (KDS)</option>
              <option value="CASHIER">Cashier Register POS</option>
              <option value="ADMIN">Executive Administrator</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-copper-600 text-xs font-bold text-obsidian-950 shadow-glow-copper hover:brightness-110"
            >
              {submitting ? "Provisioning..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================================
   TAB 4: SALES & REVENUE TELEMETRY
   ========================================================================= */
function SalesTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Search filter
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter((o) => {
      const matchId = `#${o.id}`.includes(q) || `${o.id}`.includes(q);
      const matchTable = o.table?.name.toLowerCase().includes(q) || false;
      const matchWaiter = o.waiter?.name.toLowerCase().includes(q) || false;
      return matchId || matchTable || matchWaiter;
    });
  }, [orders, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    const paid = filteredOrders.filter((o) => o.status === "PAID");
    const totalRev = paid.reduce((s, o) => s + orderTotal(o.items), 0);
    const totalItemsCount = filteredOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
      0
    );
    const aov = paid.length > 0 ? totalRev / paid.length : 0;
    return {
      totalRevenue: totalRev,
      settledCount: paid.length,
      totalOrders: filteredOrders.length,
      totalDishesSold: totalItemsCount,
      averageOrderValue: aov,
    };
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Sales & Revenue Analytics
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time fiscal ledger, settled checks, average order value, and dish sales
          </p>
        </div>

        <button
          onClick={loadSales}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-obsidian-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 shadow-xs hover:text-white active:scale-95 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-4 shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Settled Revenue
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1 block">
            {money(stats.totalRevenue)}
          </span>
          <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
            {stats.settledCount} paid checks
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-4 shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Average Check (AOV)
          </span>
          <span className="text-2xl font-black text-amber-300 font-mono tabular-nums mt-1 block">
            {money(stats.averageOrderValue)}
          </span>
          <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
            Per paying party
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-4 shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Total Orders Logged
          </span>
          <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
            {stats.totalOrders}
          </span>
          <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
            All shift statuses
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-obsidian-900/90 p-4 shadow-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Dishes Served
          </span>
          <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
            {stats.totalDishesSold}
          </span>
          <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
            Individual preparations
          </span>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="rounded-3xl border border-white/[0.08] bg-obsidian-900/90 p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-white">
            Order Audit Ledger ({filteredOrders.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by ID, table, waiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-7 rounded-xl border border-white/[0.1] bg-obsidian-950/80 text-xs text-white placeholder:text-zinc-500 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Order</th>
                <th className="pb-3">Table</th>
                <th className="pb-3">Server</th>
                <th className="pb-3">Dishes</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-zinc-300">
              {filteredOrders.map((o) => {
                const total = orderTotal(o.items);
                const itemCount = o.items.reduce((s, i) => s + i.qty, 0);

                return (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 pl-2 font-bold text-white">#{o.id}</td>
                    <td className="py-3">{o.table?.name}</td>
                    <td className="py-3">{o.waiter?.name || "Unassigned"}</td>
                    <td className="py-3">{itemCount} items</td>
                    <td className="py-3 font-bold text-white tabular-nums">{money(total)}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : o.status === "OPEN"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                        title="View order receipt"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Order Detail & Receipt */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id} Receipt`}
        subtitle={`${selectedOrder?.table?.name} • ${selectedOrder?.status}`}
        maxWidth="max-w-md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.12] bg-white text-zinc-950 p-5 font-mono text-xs shadow-2xl">
              <div className="text-center pb-3 border-b border-zinc-200">
                <h3 className="font-black text-sm uppercase">TCS RestaurantOS</h3>
                <p className="text-[10px] text-zinc-600">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
                <p className="text-xs font-bold mt-0.5">
                  Order #{selectedOrder.id} • {selectedOrder.table?.name}
                </p>
              </div>

              <div className="py-3 space-y-1.5 border-b border-zinc-200">
                {selectedOrder.items.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>
                      {i.qty}× {i.menuItem?.name}
                    </span>
                    <span className="font-bold">{money(i.qty * i.price)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-between font-black text-sm">
                <span>TOTAL:</span>
                <span>{money(orderTotal(selectedOrder.items))}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
