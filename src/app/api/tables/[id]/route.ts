import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("ADMIN");
    const { name, seats } = await req.json();
    const table = await prisma.table.update({
      where: { id: Number(params.id) },
      data: { ...(name !== undefined && { name }), ...(seats !== undefined && { seats: Number(seats) }) },
    });
    return NextResponse.json(table);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("ADMIN");
    const id = Number(params.id);
    const activeOrders = await prisma.order.count({
      where: { tableId: id, status: { in: ["OPEN", "CHECKOUT"] } },
    });
    if (activeOrders > 0) {
      return NextResponse.json({ error: "Table has active orders" }, { status: 400 });
    }
    const pastOrders = await prisma.order.count({ where: { tableId: id } });
    if (pastOrders > 0) {
      return NextResponse.json({ error: "Table has order history and cannot be deleted" }, { status: 400 });
    }
    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
