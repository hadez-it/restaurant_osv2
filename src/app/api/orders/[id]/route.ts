import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("WAITER", "ADMIN", "CASHIER", "KITCHEN");
    const order = await prisma.order.findUnique({
      where: { id: Number(params.id) },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        items: { include: { menuItem: true }, orderBy: { id: "asc" } },
        tickets: { orderBy: { id: "asc" } },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    return handleError(e);
  }
}
