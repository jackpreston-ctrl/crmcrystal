import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isKnockStatus } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

// PATCH /api/knocks/:id — update a knock (outcome, address, notes, client, time, location).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: Prisma.KnockUncheckedUpdateInput = {};

  if (body.status !== undefined) {
    if (!isKnockStatus(body.status)) {
      return NextResponse.json({ error: "Invalid outcome." }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.address !== undefined) {
    data.address = String(body.address).trim() || null;
  }
  if (body.notes !== undefined) {
    data.notes = String(body.notes).trim() || null;
  }
  if (body.knockedAt !== undefined) {
    const date = new Date(body.knockedAt);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    data.knockedAt = date;
  }
  if (body.lat !== undefined) {
    const lat = Number(body.lat);
    if (Number.isFinite(lat)) data.lat = lat;
  }
  if (body.lng !== undefined) {
    const lng = Number(body.lng);
    if (Number.isFinite(lng)) data.lng = lng;
  }
  if (body.clientId !== undefined) {
    if (body.clientId === null || body.clientId === "") {
      data.clientId = null;
    } else {
      const clientId = Number(body.clientId);
      if (!Number.isInteger(clientId)) {
        return NextResponse.json({ error: "Invalid client." }, { status: 400 });
      }
      data.clientId = clientId;
    }
  }

  try {
    const knock = await prisma.knock.update({
      where: { id },
      data,
      include: { client: true },
    });
    return NextResponse.json(knock);
  } catch {
    return NextResponse.json({ error: "Knock not found." }, { status: 404 });
  }
}

// DELETE /api/knocks/:id — remove a knock.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    await prisma.knock.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Knock not found." }, { status: 404 });
  }
}
