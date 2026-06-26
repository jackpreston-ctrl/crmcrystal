import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { JobsList } from "@/components/JobsList";
import { JobDTO, UserLite, isJobStatus, isServiceType } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const me = await getCurrentUser();
  const isOwner = me?.role === "OWNER";

  const [jobRows, clientRows, userRows] = await Promise.all([
    prisma.job.findMany({
      orderBy: { scheduledAt: "asc" },
      include: {
        client: true,
        soldBy: true,
        workers: { include: { user: true } },
      },
    }),
    prisma.client.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    isOwner
      ? prisma.user.findMany({
          orderBy: [{ role: "desc" }, { name: "asc" }],
          select: { id: true, name: true, role: true, defaultHourlyRate: true },
        })
      : Promise.resolve([] as UserLite[]),
  ]);

  const jobs: JobDTO[] = jobRows.map((j) => ({
    id: j.id,
    clientId: j.clientId,
    clientName: `${j.client.firstName} ${j.client.lastName}`,
    title: j.title,
    serviceType: isServiceType(j.serviceType) ? j.serviceType : null,
    status: isJobStatus(j.status) ? j.status : "QUOTE",
    scheduledAt: j.scheduledAt.toISOString(),
    completedAt: j.completedAt ? j.completedAt.toISOString() : null,
    // Employees never receive prices or attribution.
    price: isOwner ? j.price : null,
    notes: j.notes,
    soldById: isOwner ? j.soldById : null,
    soldByName: isOwner && j.soldBy ? j.soldBy.name : null,
    workers: isOwner
      ? j.workers.map((w) => ({
          userId: w.userId,
          name: w.user.name,
          hours: w.hours,
          hourlyRate: w.hourlyRate,
        }))
      : [],
  }));

  const clients = clientRows.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Quotes and jobs, grouped by day.
        </p>
      </header>
      <JobsList
        jobs={jobs}
        clients={clients}
        users={userRows}
        canManageMoney={!!isOwner}
      />
    </div>
  );
}
