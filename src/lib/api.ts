import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function handleError(e: unknown) {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const message = e instanceof Error ? e.message : "Internal error";
  return NextResponse.json({ error: message }, { status: 500 });
}
