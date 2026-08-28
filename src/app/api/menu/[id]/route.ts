import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("ADMIN");
    const { name, price, category, available } = await req.json();
    const item = await prisma.menuItem.update({
      where: { id: Number(params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: Number(price) }),
        ...(category !== undefined && { category }),
        ...(available !== undefined && { available: Boolean(available) }),
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("ADMIN");
    const id = Number(params.id);
    const used = await prisma.orderItem.count({ where: { menuItemId: id } });
    if (used > 0) {
      const item = await prisma.menuItem.update({ where: { id }, data: { available: false } });
      return NextResponse.json({ ...item, softDeleted: true });
    }
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
