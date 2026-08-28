import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Kitchen: list tickets (newest NEW first, recent DONE after)
export async function GET() {
  try {
    requireRole("KITCHEN", "ADMIN");
    const tickets = await prisma.ticket.findMany({
      orderBy: { id: "desc" },
      take: 50,
      include: {
        order: { include: { table: true, waiter: { select: { name: true } } } },
        items: { include: { menuItem: true } },
      },
    });
    return NextResponse.json(tickets);
  } catch (e) {
    return handleError(e);
  }
}
