import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/clients — list all clients (newest first) with job counts.
export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { jobs: true } } },
  });
  return NextResponse.json(clients);
}

// POST /api/clients — create a client.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();
  const email = String(body.email ?? "").trim();
  const notes = String(body.notes ?? "").trim();

  if (!firstName || !lastName || !phone || !address) {
    return NextResponse.json(
      { error: "First name, last name, phone, and address are required." },
      { status: 400 }
    );
  }

  const client = await prisma.client.create({
    data: {
      firstName,
      lastName,
      phone,
      address,
      email: email || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
