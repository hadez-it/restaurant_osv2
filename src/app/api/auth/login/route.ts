import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, homeFor, Role } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export async function POST(req: NextRequest) {
  try {
    return await handleLogin(req);
  } catch (e) {
    console.error("Login error:", e);
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleLogin(req: NextRequest) {
  const { username, password } = await req.json();
  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    await ensureSeeded();
    user = await prisma.user.findUnique({ where: { username } });
  }
  if (!user || !user.active || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const session = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as Role,
  };
  const res = NextResponse.json({ user: session, home: homeFor(session.role) });
  res.cookies.set("token", signToken(session), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return res;
}
