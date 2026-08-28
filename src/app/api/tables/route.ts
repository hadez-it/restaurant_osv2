import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireRole("ADMIN", "WAITER", "CASHIER", "KITCHEN");
    const tables = await prisma.table.findMany({
      orderBy: { id: "asc" },
      include: {
        orders: {
          where: { status: { in: ["OPEN", "CHECKOUT"] } },
          include: { items: { include: { menuItem: true } }, waiter: true },
        },
      },
    });
    return NextResponse.json(tables);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole("ADMIN");
    const { name, seats } = await req.json();
    const table = await prisma.table.create({ data: { name, seats: Number(seats) || 4 } });
    return NextResponse.json(table);
  } catch (e) {
    return handleError(e);
  }
}
