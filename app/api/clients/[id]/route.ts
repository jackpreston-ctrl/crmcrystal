import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE /api/clients/:id — remove a client (and cascade their jobs).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }
}
