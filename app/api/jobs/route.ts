import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isJobStatus, isServiceType, parseWorkerRows } from "@/lib/utils";

// GET /api/jobs — list all jobs (soonest first) with their client.
// Employees never receive prices or attribution through the API.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.job.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { client: true },
  });

  if (me.role === "OWNER") return NextResponse.json(jobs);

  const safe = jobs.map(({ price, soldById, ...rest }) => rest);
  return NextResponse.json(safe);
}

// POST /api/jobs — create a job or quote linked to a client.
// Pricing & attribution (price, soldBy, workers) are owner-only.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isOwner = me.role === "OWNER";

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const clientId = Number(body.clientId);
  const status = String(body.status ?? "");
  let scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : new Date();
  const title = String(body.title ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const price = Number(body.price);
  const serviceTypeRaw = String(body.serviceType ?? "").trim();

  if (!Number.isInteger(clientId)) {
    return NextResponse.json({ error: "A client is required." }, { status: 400 });
  }
  if (!isJobStatus(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (serviceTypeRaw && !isServiceType(serviceTypeRaw)) {
    return NextResponse.json({ error: "Invalid service type." }, { status: 400 });
  }
  if (Number.isNaN(scheduledAt.getTime())) scheduledAt = new Date();

  // Owner-only money fields; employees can't set price or attribution.
  const soldByIdRaw = Number(body.soldById);
  const soldById = isOwner && Number.isInteger(soldByIdRaw) ? soldByIdRaw : null;
  const workers = isOwner ? parseWorkerRows(body.workers) : [];

  const job = await prisma.job.create({
    data: {
      clientId,
      status,
      scheduledAt,
      serviceType: serviceTypeRaw || null,
      // Stamp completion the moment a job is created already done.
      completedAt: status === "COMPLETED" ? new Date() : null,
      title: title || null,
      notes: notes || null,
      price: isOwner && Number.isFinite(price) ? price : 0,
      soldById,
      workers: workers.length ? { create: workers } : undefined,
    },
    include: { client: true },
  });

  if (isOwner) return NextResponse.json(job, { status: 201 });
  const { price: _price, soldById: _soldById, ...safe } = job;
  return NextResponse.json(safe, { status: 201 });
}
