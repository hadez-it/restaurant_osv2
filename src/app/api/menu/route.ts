import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireRole("ADMIN", "WAITER", "CASHIER", "KITCHEN");
    const items = await prisma.menuItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
    return NextResponse.json(items);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole("ADMIN");
    const { name, price, category } = await req.json();
    const item = await prisma.menuItem.create({
      data: { name, price: Number(price), category: category || "General" },
    });
    return NextResponse.json(item);
  } catch (e) {
    return handleError(e);
  }
}
