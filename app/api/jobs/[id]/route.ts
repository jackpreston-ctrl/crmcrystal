import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isJobStatus, isServiceType, parseWorkerRows } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

// PATCH /api/jobs/:id — update a job (status change or full edit).
// Pricing & attribution (price, soldBy, workers) are owner-only.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isOwner = me.role === "OWNER";

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Unchecked lets us assign scalar FKs (clientId, soldById) directly.
  const data: Prisma.JobUncheckedUpdateInput = {};

  if (body.status !== undefined) {
    if (!isJobStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status;
    // Stamp the completion date when entering COMPLETED, clear it when leaving.
    data.completedAt = body.status === "COMPLETED" ? new Date() : null;
  }
  if (body.clientId !== undefined) {
    const clientId = Number(body.clientId);
    if (!Number.isInteger(clientId)) {
      return NextResponse.json({ error: "Invalid client." }, { status: 400 });
    }
    data.clientId = clientId;
  }
  if (body.serviceType !== undefined) {
    const raw = String(body.serviceType ?? "").trim();
    if (raw && !isServiceType(raw)) {
      return NextResponse.json({ error: "Invalid service type." }, { status: 400 });
    }
    data.serviceType = raw || null;
  }
  if (body.scheduledAt !== undefined) {
    const date = new Date(body.scheduledAt);
    data.scheduledAt = Number.isNaN(date.getTime()) ? new Date() : date;
  }
  if (body.title !== undefined) {
    data.title = String(body.title).trim() || null;
  }
  if (body.notes !== undefined) {
    data.notes = String(body.notes).trim() || null;
  }

  // --- Owner-only: price & attribution ---
  if (isOwner && body.price !== undefined) {
    const price = Number(body.price);
    data.price = Number.isFinite(price) ? price : 0;
  }
  if (isOwner && body.soldById !== undefined) {
    // Number(null) === 0; guard with > 0 so "no salesperson" stays null.
    const soldById = Number(body.soldById);
    data.soldById = Number.isInteger(soldById) && soldById > 0 ? soldById : null;
  }
  if (isOwner && body.workers !== undefined) {
    // Replace the whole worker set in one atomic update.
    data.workers = { deleteMany: {}, create: parseWorkerRows(body.workers) };
  }

  try {
    const job = await prisma.job.update({
      where: { id },
      data,
      include: { client: true },
    });
    // Employees never receive price/attribution, even in the echo of their own edit.
    if (isOwner) return NextResponse.json(job);
    const { price, soldById, ...safe } = job;
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
}

// DELETE /api/jobs/:id — remove a job.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
}
