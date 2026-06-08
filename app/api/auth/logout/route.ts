import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// POST /api/auth/logout — end the current session.
export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
