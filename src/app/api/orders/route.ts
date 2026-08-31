import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

// List orders with status and date range filtering
export async function GET(req: NextRequest) {
  try {
    requireRole("ADMIN", "CASHIER", "WAITER");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: {
      status?: string | { in: string[] };
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (status && status !== "ALL") {
      if (status.includes(",")) {
        where.status = { in: status.split(",").map((s) => s.trim()) };
      } else {
        where.status = status;
      }
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        if (to.length <= 10) {
          toDate.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = toDate;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        waiter: { select: { id: true, name: true, username: true } },
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (e) {
    return handleError(e);
  }
}

// Open a new order for a table or takeaway
export async function POST(req: NextRequest) {
  try {
    const user = requireRole("WAITER", "ADMIN", "CASHIER");
    const body = await req.json();
    const { tableId, orderType = "DINE_IN", customerName } = body;

    if (orderType === "TAKEAWAY") {
      const order = await prisma.order.create({
        data: {
          tableId: tableId ? Number(tableId) : null,
          waiterId: user.id,
          orderType: "TAKEAWAY",
          customerName: customerName ? String(customerName).trim() : null,
        },
      });
      return NextResponse.json(order);
    }

    if (!tableId) {
      return NextResponse.json({ error: "tableId is required for dine-in orders" }, { status: 400 });
    }

    const existing = await prisma.order.findFirst({
      where: { tableId: Number(tableId), status: "OPEN" },
    });
    if (existing) {
      return NextResponse.json({ error: "Table already has an active order" }, { status: 400 });
    }
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          tableId: Number(tableId),
          waiterId: user.id,
          orderType: "DINE_IN",
          customerName: customerName ? String(customerName).trim() : null,
        },
      });
      await tx.table.update({ where: { id: Number(tableId) }, data: { status: "OCCUPIED" } });
      return o;
    });
    return NextResponse.json(order);
  } catch (e) {
    return handleError(e);
  }
}
