import { prisma } from "@/lib/db";
import { JobsList } from "@/components/JobsList";
import { JobDTO, isJobStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [jobRows, clientRows] = await Promise.all([
    prisma.job.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  const jobs: JobDTO[] = jobRows.map((j) => ({
    id: j.id,
    clientId: j.clientId,
    clientName: `${j.client.firstName} ${j.client.lastName}`,
    title: j.title,
    status: isJobStatus(j.status) ? j.status : "QUOTE",
    scheduledAt: j.scheduledAt.toISOString(),
    price: j.price,
    notes: j.notes,
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
      <JobsList jobs={jobs} clients={clients} />
    </div>
  );
}
