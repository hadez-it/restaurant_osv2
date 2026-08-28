import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

// Cashier marks order paid -> table becomes free
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("CASHIER", "ADMIN");
    const orderId = Number(params.id);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !["OPEN", "CHECKOUT"].includes(order.status)) {
      return NextResponse.json({ error: "Order is not payable" }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paidAt: new Date() },
      });
      await tx.table.update({ where: { id: order.tableId }, data: { status: "FREE" } });
      return o;
    });
    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}
