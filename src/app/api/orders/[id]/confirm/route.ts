import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

// Confirm draft items -> create a kitchen ticket (slip)
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("WAITER", "ADMIN", "CASHIER");
    const orderId = Number(params.id);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "OPEN") {
      return NextResponse.json({ error: "Order is not open" }, { status: 400 });
    }
    const draftItems = await prisma.orderItem.findMany({
      where: { orderId, ticketId: null },
    });
    if (draftItems.length === 0) {
      return NextResponse.json({ error: "No new items to send to kitchen" }, { status: 400 });
    }
    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.create({ data: { orderId } });
      await tx.orderItem.updateMany({
        where: { id: { in: draftItems.map((i) => i.id) } },
        data: { ticketId: t.id },
      });
      return t;
    });
    return NextResponse.json(ticket);
  } catch (e) {
    return handleError(e);
  }
}
