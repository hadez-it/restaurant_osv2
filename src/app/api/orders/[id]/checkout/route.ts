import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

// Waiter sends order to cashier for checkout
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("WAITER", "ADMIN");
    const orderId = Number(params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "OPEN") {
      return NextResponse.json({ error: "Order is not open" }, { status: 400 });
    }
    const unsent = order.items.some((i) => !i.ticketId);
    if (unsent) {
      return NextResponse.json(
        { error: "Send all items to kitchen before checkout" },
        { status: 400 }
      );
    }
    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({ where: { id: orderId }, data: { status: "CHECKOUT" } });
      await tx.table.update({ where: { id: order.tableId }, data: { status: "CHECKOUT" } });
      return o;
    });
    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}
