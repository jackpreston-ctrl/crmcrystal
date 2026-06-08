import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

// POST /api/auth/setup — create the FIRST owner account. Only works while there
// are zero users (first-run bootstrap after a fresh deploy). Once an account
// exists, this is locked.
export async function POST(req: Request) {
  const existing = await prisma.user.count();
  if (existing > 0) {
    return NextResponse.json(
      { error: "Setup has already been completed. Please sign in." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: "OWNER",
      passwordHash: await hashPassword(password),
    },
  });

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: "OWNER",
  });

  return NextResponse.json({ ok: true });
}
