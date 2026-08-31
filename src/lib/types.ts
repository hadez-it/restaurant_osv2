export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string | null;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  qty: number;
  price: number;
  note: string | null;
  ticketId: number | null;
  menuItem: MenuItem;
}

export interface Order {
  id: number;
  tableId?: number | null;
  status: string;
  orderType?: string;
  customerName?: string | null;
  createdAt: string;
  items: OrderItem[];
  waiter?: { id: number; name: string };
  table?: TableInfo | null;
  tickets?: { id: number; status: string }[];
}

export interface TableInfo {
  id: number;
  name: string;
  seats: number;
  status: string;
  orders?: Order[];
}

export interface Ticket {
  id: number;
  status: string;
  createdAt: string;
  order: Order & { table?: TableInfo | null; waiter: { name: string } };
  items: OrderItem[];
}

export function orderTotal(items: { qty: number; price: number }[]): number {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}
