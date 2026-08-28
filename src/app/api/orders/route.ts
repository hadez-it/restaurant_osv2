import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Open a new order for a table
export async function POST(req: NextRequest) {
  try {
    const user = requireRole("WAITER", "ADMIN");
    const { tableId } = await req.json();
    const existing = await prisma.order.findFirst({
      where: { tableId: Number(tableId), status: { in: ["OPEN", "CHECKOUT"] } },
    });
    if (existing) {
      return NextResponse.json({ error: "Table already has an active order" }, { status: 400 });
    }
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: { tableId: Number(tableId), waiterId: user.id },
      });
      await tx.table.update({ where: { id: Number(tableId) }, data: { status: "OCCUPIED" } });
      return o;
    });
    return NextResponse.json(order);
  } catch (e) {
    return handleError(e);
  }
}
