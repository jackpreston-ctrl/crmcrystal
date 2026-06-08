import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isJobStatus } from "@/lib/utils";

// GET /api/jobs — list all jobs (soonest first) with their client.
export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { client: true },
  });
  return NextResponse.json(jobs);
}

// POST /api/jobs — create a job or quote linked to a client.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const clientId = Number(body.clientId);
  const status = String(body.status ?? "");
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  const title = String(body.title ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const price = Number(body.price);

  if (!Number.isInteger(clientId)) {
    return NextResponse.json({ error: "A client is required." }, { status: 400 });
  }
  if (!isJobStatus(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json(
      { error: "A valid date & time is required." },
      { status: 400 }
    );
  }

  const job = await prisma.job.create({
    data: {
      clientId,
      status,
      scheduledAt,
      title: title || null,
      notes: notes || null,
      price: Number.isFinite(price) ? price : 0,
    },
    include: { client: true },
  });

  return NextResponse.json(job, { status: 201 });
}
