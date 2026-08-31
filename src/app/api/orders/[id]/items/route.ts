import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

// Add draft items (not yet sent to kitchen)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("WAITER", "ADMIN", "CASHIER");
    const orderId = Number(params.id);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "OPEN") {
      return NextResponse.json({ error: "Order is not open" }, { status: 400 });
    }
    const { items } = (await req.json()) as {
      items: { menuItemId: number; qty: number; note?: string }[];
    };
    if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) } },
    });
    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
    await prisma.orderItem.createMany({
      data: items.map((i) => ({
        orderId,
        menuItemId: i.menuItemId,
        qty: Math.max(1, Number(i.qty) || 1),
        price: priceMap.get(i.menuItemId) ?? 0,
        note: i.note || null,
      })),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
