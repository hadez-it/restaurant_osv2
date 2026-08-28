import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

// Kitchen marks ticket done
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("KITCHEN", "ADMIN");
    const { status } = await req.json();
    if (!["NEW", "DONE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const ticket = await prisma.ticket.update({
      where: { id: Number(params.id) },
      data: { status },
    });
    return NextResponse.json(ticket);
  } catch (e) {
    return handleError(e);
  }
}
