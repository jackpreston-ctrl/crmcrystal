import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

const ROLES = ["OWNER", "EMPLOYEE"];

// PATCH /api/users/:id — update a team member (owner only).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target)
    return NextResponse.json({ error: "User not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const data: Prisma.UserUncheckedUpdateInput = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name)
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    data.name = name;
  }
  if (body?.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!email)
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    data.email = email;
  }
  if (body?.password !== undefined && body.password !== "") {
    const password = String(body.password);
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    data.passwordHash = await hashPassword(password);
  }
  if (body?.role !== undefined) {
    const role = String(body.role);
    if (!ROLES.includes(role))
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    // Don't allow demoting the last owner.
    if (target.role === "OWNER" && role !== "OWNER") {
      const owners = await prisma.user.count({ where: { role: "OWNER" } });
      if (owners <= 1) {
        return NextResponse.json(
          { error: "You must keep at least one owner." },
          { status: 400 }
        );
      }
    }
    data.role = role;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 }
      );
    }
    throw e;
  }
}

// DELETE /api/users/:id — remove a team member (owner only).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  if (id === me.id) {
    return NextResponse.json(
      { error: "You can't delete your own account." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target)
    return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (target.role === "OWNER") {
    const owners = await prisma.user.count({ where: { role: "OWNER" } });
    if (owners <= 1) {
      return NextResponse.json(
        { error: "You must keep at least one owner." },
        { status: 400 }
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
