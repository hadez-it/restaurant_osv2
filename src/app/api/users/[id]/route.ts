import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireRole("ADMIN");
    const { name, role, password, active } = await req.json();
    const user = await prisma.user.update({
      where: { id: Number(params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(active !== undefined && { active: Boolean(active) }),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
      select: { id: true, username: true, name: true, role: true, active: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    return handleError(e);
  }
}
