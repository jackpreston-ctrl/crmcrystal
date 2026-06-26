import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import type { Role } from "@/lib/session";

// POST /api/auth/login — verify credentials and start a session.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const userId = Number(body?.userId);
  const hasUserId = Number.isInteger(userId);
  const password = String(body?.password ?? "");

  if ((!email && !hasUserId) || !password) {
    return NextResponse.json(
      { error: "A profile (or email) and password are required." },
      { status: 400 }
    );
  }

  // Profile picker posts a userId; the classic form posts an email.
  const user = hasUserId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email } });
  // Run a compare even when the user is missing to avoid leaking which emails exist.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2a$11$invalidinvalidinvalidinvalidinv");

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role },
  });
}
