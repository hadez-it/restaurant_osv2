"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { TableInfo, MenuItem, orderTotal, money } from "@/lib/types";
import {
  LayoutGrid,
  Utensils,
  Users,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  ChefHat,
  Receipt,
  Eye,
  EyeOff,
  Armchair,
  AlertCircle,
  Pencil,
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
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Admin Console
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Floorplan arrangement, menu catalog, staff roles, and restaurant operations
            </p>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-1 overflow-x-auto w-full min-w-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shrink-0 whitespace-nowrap ${
                  isActive
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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

  async function removeTable(id: number, tableName: string) {
    if (!confirm(`Are you sure you want to delete ${tableName}?`)) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Cannot delete table (may have active orders or history)");
      }
      loadTables();
    } catch {
      alert("Network error removing table");
    }
  }

  return (
    <div className="space-y-6">
      {/* Floor Plan Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-zinc-900">
            Floorplan Overview ({loading ? "..." : tables.length} Total Tables)
          </h3>
          <div className="flex items-center gap-3 text-xs mt-1">
            <span className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Free (
              {tables.filter((t) => t.status === "FREE").length})
            </span>
            <span className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Occupied (
              {tables.filter((t) => t.status === "OCCUPIED").length})
            </span>
            <span className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Checkout (
              {tables.filter((t) => t.status === "CHECKOUT").length})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setName("");
            setSeats("4");
            setError("");
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Table
        </button>
      </div>

      {/* Visual Card Grid of Tables */}
      <div>
        {tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
            <Armchair className="mx-auto h-10 w-10 text-zinc-400" />
            <h4 className="mt-2 text-sm font-semibold text-zinc-800">No tables configured</h4>
            <p className="mt-1 text-xs text-zinc-500">
              Click &quot;Add Table&quot; above to configure your first restaurant table.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => {
              const hasOrder = table.orders && table.orders.length > 0;
              const order = hasOrder ? table.orders![0] : null;
              const isCheckout = table.status === "CHECKOUT";
              const isOccupied = table.status === "OCCUPIED" || hasOrder;

              return (
                <div
                  key={table.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    isCheckout
                      ? "border-orange-500/80 bg-orange-50/20"
                      : isOccupied
                      ? "border-amber-400/80 bg-amber-50/20"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-black text-zinc-900">{table.name}</h4>
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                          <Users className="h-3.5 w-3.5" />
                          {table.seats} seats
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isCheckout
                            ? "bg-orange-100 text-orange-800"
                            : isOccupied
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isCheckout ? "CHECKOUT" : isOccupied ? "OCCUPIED" : "FREE"}
                      </span>
                    </div>

                    {/* Order Details / Empty State */}
                    <div className="mt-4 rounded-xl bg-zinc-50/80 p-3 border border-zinc-100 text-xs">
                      {order ? (
                        <div className="space-y-1">
                          <div className="flex justify-between font-semibold text-zinc-800">
                            <span>Order #{order.id}</span>
                            <span className="text-orange-600">
                              {money(orderTotal(order.items))}
                            </span>
                          </div>
                          <p className="text-zinc-500">
                            Server: {order.waiter?.name || "Assigned Waiter"}
                          </p>
                          <p className="text-zinc-500">
                            {order.items.reduce((s, i) => s + i.qty, 0)} items active
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-zinc-400">
                          <span className="block font-medium">Ready for guests</span>
                          <span className="text-[10px]">No active order</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">ID #{table.id}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTable(table);
                          setEditName(table.name);
                          setEditSeats(table.seats.toString());
                          setEditError("");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
                        title="Edit table"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTable(table.id, table.name)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                        title="Delete table"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Floor Table"
        subtitle="Configure table code and seating capacity"
      >
        <form onSubmit={addTable} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Table Name / Code
            </label>
            <input
              type="text"
              placeholder="e.g. Table 7, Booth 3, Patio 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Guest Capacity (Seats)
            </label>
            <div className="flex items-center gap-2">
              {[2, 4, 6, 8].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeats(s.toString())}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${
                    seats === s.toString()
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {s}P
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="24"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-20 rounded-xl border border-zinc-300 px-3 py-2 text-center text-xs font-bold text-zinc-900"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 transition"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add Table"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Table Modal */}
      <Modal
        isOpen={!!editingTable}
        onClose={() => setEditingTable(null)}
        title={`Edit ${editingTable?.name || "Table"}`}
        subtitle="Update table name or seating capacity"
      >
        <form onSubmit={updateTable} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Table Name / Code
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Guest Capacity (Seats)
            </label>
            <div className="flex items-center gap-2">
              {[2, 4, 6, 8].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditSeats(s.toString())}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${
                    editSeats === s.toString()
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {s}P
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="24"
                value={editSeats}
                onChange={(e) => setEditSeats(e.target.value)}
                className="w-20 rounded-xl border border-zinc-300 px-3 py-2 text-center text-xs font-bold text-zinc-900"
              />
            </div>
          </div>

          {editError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingTable(null)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 transition"
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
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
          price: Number(price),
          category: category.trim() || "General",
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
        setError(d.error || "Failed to add menu item");
      }
    } catch {
      setError("Network error adding menu item");
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
          price: Number(editPrice),
          category: editCategory.trim() || "General",
          available: editAvailable,
        }),
      });
      if (res.ok) {
        setEditingItem(null);
        loadMenu();
      } else {
        const d = await res.json().catch(() => ({}));
        setEditError(d.error || "Failed to update item");
      }
    } catch {
      setEditError("Network error updating item");
    } finally {
      setEditSubmitting(false);
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
      alert("Failed to toggle availability");
    }
  }

  async function removeItem(id: number, itemName: string) {
    if (!confirm(`Are you sure you want to remove "${itemName}"?`)) return;
    try {
      await fetch(`/api/menu/${id}`, { method: "DELETE" });
      loadMenu();
    } catch {
      alert("Failed to delete menu item");
    }
  }
  return (
    <div className="space-y-6">
      {/* Filter, Search & Actions Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                selectedCategory === "All"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              All Items ({loading ? "..." : items.length})
            </button>
            {categories.map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    isSelected
                      ? "bg-orange-600 text-white shadow-xs"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box & Add Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setName("");
                setPrice("");
                setCategory("");
                setError("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] shrink-0 transition"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
            <Utensils className="mx-auto h-10 w-10 text-zinc-400" />
            <h4 className="mt-2 text-sm font-semibold text-zinc-800">No menu items match</h4>
            <p className="mt-1 text-xs text-zinc-500">
              Try adjusting your category filter or click &quot;Add Item&quot; to add new dishes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  item.available ? "border-zinc-200" : "border-zinc-200/60 opacity-70 bg-zinc-50/50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700">
                      {item.category || "General"}
                    </span>
                    <span className="text-base font-black text-zinc-900">
                      {money(item.price)}
                    </span>
                  </div>
                  <h4 className="mt-2 text-base font-bold text-zinc-900 leading-snug">
                    {item.name}
                  </h4>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  {/* Availability Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleAvailability(item)}
                    className="flex items-center gap-2 text-xs font-semibold"
                    title="Toggle item availability"
                  >
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        item.available ? "bg-emerald-500" : "bg-zinc-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          item.available ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className={item.available ? "text-emerald-700" : "text-zinc-500"}>
                      {item.available ? "In Stock" : "Sold Out"}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setEditName(item.name);
                        setEditPrice(item.price.toString());
                        setEditCategory(item.category || "");
                        setEditAvailable(item.available);
                        setEditError("");
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition"
                      title="Edit item"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id, item.name)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Menu Item"
        subtitle="Add a new dish or drink to the live POS catalog"
      >
        <form onSubmit={addItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Item Name
            </label>
            <input
              type="text"
              placeholder="e.g. Wagyu Truffle Burger, Espresso, Tiramisu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white pl-7 pr-3 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="Mains, Starters, Drinks"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="category-suggestions"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Category Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            <span>Suggestions:</span>
            {["Starters", "Mains", "Desserts", "Beverages", "Sides"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className="rounded-md bg-zinc-100 px-2 py-0.5 hover:bg-zinc-200 text-zinc-700 transition"
              >
                {c}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 transition"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Edit ${editingItem?.name || "Item"}`}
        subtitle="Update dish details, price, and category"
      >
        <form onSubmit={updateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white pl-7 pr-3 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                list="category-suggestions"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={editAvailable}
                onChange={(e) => setEditAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
              />
              <span>Available for ordering (In Stock)</span>
            </label>
          </div>

          {editError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 transition"
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
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

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const ROLE_BADGE: Record<
    string,
    { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    ADMIN: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", icon: ShieldCheck },
    WAITER: { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200", icon: LayoutGrid },
    KITCHEN: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", icon: ChefHat },
    CASHIER: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", icon: Receipt },
  };

  return (
    <div className="space-y-6">
      {/* Filter and User Directory Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "WAITER", "KITCHEN", "CASHIER", "ADMIN"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  roleFilter === r
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {r === "ALL" ? "All Roles" : r}
              </button>
            ))}
          </div>

          {/* Search & Add Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({ username: "", password: "", name: "", role: "WAITER" });
                setError("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] shrink-0 transition"
            >
              <Plus className="h-4 w-4" />
              Add Staff
            </button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredUsers.map((u) => {
            const roleInfo = ROLE_BADGE[u.role] || ROLE_BADGE.WAITER;
            const RoleIcon = roleInfo.icon;
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={u.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  u.active ? "border-zinc-200" : "border-zinc-200/60 opacity-60 bg-zinc-50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 font-black text-zinc-700 text-sm border border-zinc-200">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 leading-tight">{u.name}</h4>
                        <span className="text-xs text-zinc-500">@{u.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold border ${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}
                    >
                      <RoleIcon className="h-3.5 w-3.5" />
                      {u.role}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">ID #{u.id}</span>

                  {/* Active / Inactive Switch */}
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    className="flex items-center gap-2 text-xs font-semibold"
                    title="Toggle active status"
                  >
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        u.active ? "bg-emerald-500" : "bg-zinc-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          u.active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className={u.active ? "text-emerald-700" : "text-zinc-500"}>
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Add Staff Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Staff Account"
        subtitle="Security & role provisioning for team members"
      >
        <form onSubmit={addUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. jdoe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-2xs focus:border-orange-500 focus:outline-hidden"
            >
              <option value="WAITER">Waiter (Floor & Order)</option>
              <option value="KITCHEN">Kitchen (Chef / KDS)</option>
              <option value="CASHIER">Cashier (POS & Billing)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 transition"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Creating..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
