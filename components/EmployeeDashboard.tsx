import { prisma } from "@/lib/db";
import { AreaChart } from "@/components/Charts";
import { StatCard, ChartCard } from "@/components/DashboardCards";
import {
  COMMISSION_RATE,
  commissionFor,
  formatCurrency,
  formatDate,
  SERVICE_LABELS,
  parseServiceTypes,
  ServiceType,
} from "@/lib/utils";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function greeting(h: number) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

type Entry = {
  id: string;
  clientName: string;
  serviceTypes: ServiceType[];
  when: Date;
  status: string;
  amount: number;
  kind: "commission" | "hourly";
  detail: string;
};

// Employee dashboard: scoped strictly to this person's own pay. No business
// revenue, no other people's numbers, no job prices.
export async function EmployeeDashboard({
  userId,
  name,
}: {
  userId: number;
  name: string;
}) {
  const now = new Date();

  const [soldJobs, workRows] = await Promise.all([
    prisma.job.findMany({ where: { soldById: userId }, include: { client: true } }),
    prisma.jobWorker.findMany({
      where: { userId },
      include: { job: { include: { client: true } } },
    }),
  ]);

  const entries: Entry[] = [];
  for (const j of soldJobs) {
    entries.push({
      id: `c${j.id}`,
      clientName: `${j.client.firstName} ${j.client.lastName}`,
      serviceTypes: parseServiceTypes(j.serviceTypes, j.serviceType),
      when: j.completedAt ?? j.scheduledAt,
      status: j.status,
      amount: commissionFor(j.price),
      kind: "commission",
      detail: `Sold · ${Math.round(COMMISSION_RATE * 100)}%`,
    });
  }
  for (const w of workRows) {
    entries.push({
      id: `h${w.id}`,
      clientName: `${w.job.client.firstName} ${w.job.client.lastName}`,
      serviceTypes: parseServiceTypes(w.job.serviceTypes, w.job.serviceType),
      when: w.job.completedAt ?? w.job.scheduledAt,
      status: w.job.status,
      amount: w.hours * w.hourlyRate,
      kind: "hourly",
      detail: `${w.hours} h × ${formatCurrency(w.hourlyRate)}`,
    });
  }

  const completed = entries.filter((e) => e.status === "COMPLETED");
  const pending = entries.filter(
    (e) => e.status === "QUOTE" || e.status === "SCHEDULED"
  );

  const commissionEarned = completed
    .filter((e) => e.kind === "commission")
    .reduce((s, e) => s + e.amount, 0);
  const hourlyEarned = completed
    .filter((e) => e.kind === "hourly")
    .reduce((s, e) => s + e.amount, 0);
  const totalEarned = commissionEarned + hourlyEarned;

  const thisMonth = monthKey(now);
  const earnedThisMonth = completed
    .filter((e) => monthKey(e.when) === thisMonth)
    .reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pending.reduce((s, e) => s + e.amount, 0);
  const hoursWorked = workRows
    .filter((w) => w.job.status === "COMPLETED")
    .reduce((s, w) => s + w.hours, 0);
  const jobsSold = completed.filter((e) => e.kind === "commission").length;

  // Earnings trend — last 6 months of completed pay.
  const months: { label: string; key: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      key: monthKey(d),
      value: 0,
    });
  }
  for (const e of completed) {
    const m = months.find((x) => x.key === monthKey(e.when));
    if (m) m.value += e.amount;
  }

  const recent = [...completed]
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, 6);

  const firstName = name.split(" ")[0];
  const splitTotal = Math.max(1, commissionEarned + hourlyEarned);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-7">
        <p className="text-sm text-gold-600">{greeting(now.getHours())},</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
          {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&rsquo;s your pay so far.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          i={0}
          label="Earned · this month"
          value={formatCurrency(earnedThisMonth)}
          accent="gold"
          icon={<MoneyIcon />}
        />
        <StatCard
          i={1}
          label="Pending"
          value={formatCurrency(pendingTotal)}
          accent="sky"
          icon={<ClockIcon />}
        />
        <StatCard
          i={2}
          label="Jobs sold"
          value={String(jobsSold)}
          accent="emerald"
          icon={<TagIcon />}
        />
        <StatCard
          i={3}
          label="Hours worked"
          value={hoursWorked % 1 === 0 ? String(hoursWorked) : hoursWorked.toFixed(1)}
          accent="violet"
          icon={<ClockIcon />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          i={4}
          className="lg:col-span-2"
          title="Your earnings"
          subtitle="Completed pay, last 6 months"
        >
          <AreaChart
            data={months.map((m) => ({ label: m.label, value: m.value }))}
            stroke="#059669"
            fillFrom="rgba(16,185,129,0.22)"
            fillTo="rgba(16,185,129,0.01)"
          />
        </ChartCard>

        <ChartCard i={5} title="Pay breakdown" subtitle="All-time, completed">
          <p className="nums mb-4 font-display text-3xl font-semibold text-slate-900">
            {formatCurrency(totalEarned)}
          </p>
          <PayRow
            label="Commission"
            amount={commissionEarned}
            pct={(commissionEarned / splitTotal) * 100}
            color="#CA8A04"
          />
          <PayRow
            label="Hourly work"
            amount={hourlyEarned}
            pct={(hourlyEarned / splitTotal) * 100}
            color="#10b981"
          />
        </ChartCard>
      </div>

      <ChartCard i={6} className="mt-4" title="Recent earnings">
        {recent.length === 0 ? (
          <div className="flex h-28 items-center justify-center text-center text-sm text-slate-400">
            No earnings yet — once you&rsquo;re assigned to jobs, your pay shows up
            here.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    e.kind === "commission"
                      ? "bg-gold-100 text-gold-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {e.kind === "commission" ? <TagIcon /> : <ClockIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {e.clientName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[
                      e.serviceTypes.map((s) => SERVICE_LABELS[s]).join(" + "),
                      e.detail,
                      formatDate(e.when),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="nums shrink-0 text-sm font-semibold text-slate-900">
                  {formatCurrency(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}

function PayRow({
  label,
  amount,
  pct,
  color,
}: {
  label: string;
  amount: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="nums font-semibold text-slate-900">
          {formatCurrency(amount)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(amount > 0 ? 6 : 0, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <circle cx="7" cy="7" r="1.2" />
    </svg>
  );
}
