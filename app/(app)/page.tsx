import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatCurrency,
  formatDateTime,
  isJobStatus,
  JobStatus,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [clientCount, jobs] = await Promise.all([
    prisma.client.count(),
    prisma.job.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { client: true },
    }),
  ]);

  const quotes = jobs.filter((j) => j.status === "QUOTE");
  const scheduled = jobs.filter((j) => j.status === "SCHEDULED");
  const pipeline = [...quotes, ...scheduled].reduce((sum, j) => sum + j.price, 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcoming = jobs
    .filter(
      (j) =>
        j.scheduledAt >= startOfToday &&
        (j.status === "QUOTE" || j.status === "SCHEDULED")
    )
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          A quick look at the business today.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Clients" value={String(clientCount)} accent="sky" />
        <StatCard label="Open quotes" value={String(quotes.length)} accent="amber" />
        <StatCard
          label="Scheduled jobs"
          value={String(scheduled.length)}
          accent="cyan"
        />
        <StatCard
          label="Pipeline value"
          value={formatCurrency(pipeline)}
          accent="emerald"
        />
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          Manage clients
        </Link>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
        >
          Open schedule
        </Link>
      </div>

      {/* Upcoming */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Upcoming schedule
          </h2>
          <Link href="/jobs" className="text-sm font-medium text-sky-700 hover:text-sky-800">
            View all →
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {upcoming.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900">
                Nothing scheduled
              </p>
              <p className="mt-1 text-sm text-slate-500">
                New quotes and jobs will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((job) => {
                const status: JobStatus = isJobStatus(job.status)
                  ? job.status
                  : "QUOTE";
                return (
                  <li
                    key={job.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
                  >
                    <div className="min-w-0 flex-1 basis-44">
                      <p className="truncate font-medium text-slate-900">
                        {job.client.firstName} {job.client.lastName}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {job.title ?? "—"}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDateTime(job.scheduledAt)}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatCurrency(job.price)}
                    </div>
                    <StatusBadge status={status} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

const ACCENTS: Record<string, string> = {
  sky: "text-sky-600",
  amber: "text-amber-600",
  cyan: "text-cyan-600",
  emerald: "text-emerald-600",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: keyof typeof ACCENTS;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${ACCENTS[accent]}`}>{value}</p>
    </div>
  );
}
