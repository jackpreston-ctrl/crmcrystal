import { prisma } from "@/lib/db";
import { DueList } from "@/components/DueList";
import {
  DueDTO,
  ServiceType,
  REBOOK_MONTHS,
  parseServiceTypes,
  monthsSince,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DuePage() {
  const [completedJobs, clientRows] = await Promise.all([
    prisma.job.findMany({
      where: { status: "COMPLETED" },
      include: { client: true },
    }),
    prisma.client.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  // Keep only the latest completion per (client, service type). Property scope
  // is deferred, so a client stands in for the property here.
  type Latest = {
    clientId: number;
    clientName: string;
    address: string;
    serviceType: ServiceType;
    lastCompletedAt: Date;
  };
  const latest = new Map<string, Latest>();
  for (const j of completedJobs) {
    const when = j.completedAt ?? j.scheduledAt;
    for (const serviceType of parseServiceTypes(j.serviceTypes, j.serviceType)) {
      const key = `${j.clientId}:${serviceType}`;
      const prev = latest.get(key);
      if (!prev || when > prev.lastCompletedAt) {
        latest.set(key, {
          clientId: j.clientId,
          clientName: `${j.client.firstName} ${j.client.lastName}`,
          address: j.client.address,
          serviceType,
          lastCompletedAt: when,
        });
      }
    }
  }

  // Flag anything past its rebooking window; most overdue first.
  const due: DueDTO[] = [];
  for (const l of latest.values()) {
    const months = monthsSince(l.lastCompletedAt);
    const interval = REBOOK_MONTHS[l.serviceType];
    if (months >= interval) {
      due.push({
        clientId: l.clientId,
        clientName: l.clientName,
        address: l.address,
        serviceType: l.serviceType,
        lastCompletedAt: l.lastCompletedAt.toISOString(),
        monthsSince: months,
        intervalMonths: interval,
        overdueByMonths: months - interval,
      });
    }
  }
  due.sort((a, b) => b.overdueByMonths - a.overdueByMonths);

  const clients = clientRows.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Due</h1>
        <p className="mt-1 text-sm text-slate-500">
          Properties past their rebooking window — most overdue first. One tap
          turns a row into a quote.
        </p>
      </header>
      <DueList due={due} clients={clients} />
    </div>
  );
}
