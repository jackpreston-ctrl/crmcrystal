import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isJobStatus, isServiceType } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

// PATCH /api/jobs/:id — update a job (status change or full edit).
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

  const data: Prisma.JobUpdateInput = {};

  if (body.status !== undefined) {
    if (!isJobStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status;
    // Stamp the completion date when entering COMPLETED, clear it when leaving.
    data.completedAt = body.status === "COMPLETED" ? new Date() : null;
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
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    data.scheduledAt = date;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    data.price = Number.isFinite(price) ? price : 0;
  }
  if (body.title !== undefined) {
    data.title = String(body.title).trim() || null;
  }
  if (body.notes !== undefined) {
    data.notes = String(body.notes).trim() || null;
  }

  try {
    const job = await prisma.job.update({
      where: { id },
      data,
      include: { client: true },
    });
    return NextResponse.json(job);
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
