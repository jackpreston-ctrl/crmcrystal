import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isKnockStatus } from "@/lib/utils";

// GET /api/knocks — list all knocks (newest first) with linked client.
export async function GET() {
  const knocks = await prisma.knock.findMany({
    orderBy: { knockedAt: "desc" },
    include: { client: true },
  });
  return NextResponse.json(knocks);
}

// POST /api/knocks — log a knock at a map location.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const status = String(body.status ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "A valid map location is required." },
      { status: 400 }
    );
  }
  if (!isKnockStatus(status)) {
    return NextResponse.json({ error: "Invalid outcome." }, { status: 400 });
  }

  const knockedAt = body.knockedAt ? new Date(body.knockedAt) : new Date();
  if (Number.isNaN(knockedAt.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const address = String(body.address ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const rawClient = body.clientId;
  const clientId =
    rawClient === null || rawClient === undefined || rawClient === ""
      ? null
      : Number(rawClient);
  if (clientId !== null && !Number.isInteger(clientId)) {
    return NextResponse.json({ error: "Invalid client." }, { status: 400 });
  }

  const knock = await prisma.knock.create({
    data: {
      lat,
      lng,
      status,
      knockedAt,
      address: address || null,
      notes: notes || null,
      clientId,
    },
    include: { client: true },
  });

  return NextResponse.json(knock, { status: 201 });
}
