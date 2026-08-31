import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

// Remove a draft item (only if not yet sent to kitchen)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    requireRole("WAITER", "ADMIN", "CASHIER");
    const item = await prisma.orderItem.findUnique({ where: { id: Number(params.itemId) } });
    if (!item || item.orderId !== Number(params.id)) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.ticketId) {
      return NextResponse.json({ error: "Item already sent to kitchen" }, { status: 400 });
    }
    await prisma.orderItem.delete({ where: { id: item.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

// Update a draft item qty (only if not yet sent to kitchen)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    requireRole("WAITER", "ADMIN", "CASHIER");
    const item = await prisma.orderItem.findUnique({ where: { id: Number(params.itemId) } });
    if (!item || item.orderId !== Number(params.id)) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.ticketId) {
      return NextResponse.json({ error: "Item already sent to kitchen" }, { status: 400 });
    }
    const body = (await req.json()) as { qty?: number; note?: string };
    if (body.qty !== undefined && Number(body.qty) <= 0) {
      await prisma.orderItem.delete({ where: { id: item.id } });
      return NextResponse.json({ ok: true, deleted: true });
    }
    const updated = await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        ...(body.qty !== undefined ? { qty: Math.max(1, Number(body.qty)) } : {}),
        ...(body.note !== undefined ? { note: body.note || null } : {}),
      },
      include: { menuItem: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}
