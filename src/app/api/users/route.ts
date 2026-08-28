import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireRole("ADMIN");
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole("ADMIN");
    const { username, password, name, role } = await req.json();
    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: { username, name, role, password: await bcrypt.hash(password, 10) },
      select: { id: true, username: true, name: true, role: true, active: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    return handleError(e);
  }
}
