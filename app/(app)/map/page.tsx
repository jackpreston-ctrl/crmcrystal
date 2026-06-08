import { prisma } from "@/lib/db";
import { MapClient } from "@/components/MapClient";
import { KnockDTO, isKnockStatus, DEFAULT_CENTER } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [knockRows, clientRows] = await Promise.all([
    prisma.knock.findMany({
      orderBy: { knockedAt: "desc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  const knocks: KnockDTO[] = knockRows.map((k) => ({
    id: k.id,
    lat: k.lat,
    lng: k.lng,
    address: k.address,
    status: isKnockStatus(k.status) ? k.status : "NOT_HOME",
    notes: k.notes,
    knockedAt: k.knockedAt.toISOString(),
    clientId: k.clientId,
    clientName: k.client ? `${k.client.firstName} ${k.client.lastName}` : null,
  }));

  const clients = clientRows.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Canvassing
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track door-to-door sales — tap the map to log each door you knock, with
          the outcome and time.
        </p>
      </header>
      <MapClient knocks={knocks} clients={clients} center={DEFAULT_CENTER} />
    </div>
  );
}
