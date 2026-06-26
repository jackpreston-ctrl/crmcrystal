import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AreaChart, DonutChart, FunnelChart, ForecastBars } from "@/components/Charts";
import { StatCard, ChartCard } from "@/components/DashboardCards";
import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import {
  SERVICE_TYPES,
  SERVICE_LABELS,
  SERVICE_COLORS,
  REBOOK_MONTHS,
  formatCurrency,
  isServiceType,
  ServiceType,
  KNOCK_STATUSES,
  KNOCK_LABELS,
  KNOCK_COLORS,
  KnockStatus,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function compactMoney(n: number) {
  if (n >= 1000) return "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return "$" + Math.round(n);
}

function greeting(h: number) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Employees get their own earnings view — never the business-wide numbers.
  if (user && user.role !== "OWNER") {
    return <EmployeeDashboard userId={user.id} name={user.name} />;
  }

  const [clientCount, jobs, knocks] = await Promise.all([
    prisma.client.count(),
    prisma.job.findMany({ include: { client: true } }),
    prisma.knock.findMany({ select: { status: true, knockedAt: true } }),
  ]);

  const now = new Date();
  const completed = jobs.filter((j) => j.status === "COMPLETED");
  const open = jobs.filter(
    (j) => j.status === "QUOTE" || j.status === "SCHEDULED"
  );

  // --- Stats ---
  const thisMonth = monthKey(now);
  const revenueThisMonth = completed
    .filter((j) => monthKey(j.completedAt ?? j.scheduledAt) === thisMonth)
    .reduce((s, j) => s + j.price, 0);
  const openPipeline = open.reduce((s, j) => s + j.price, 0);

  // --- Revenue trend (last 6 months of completed work) ---
  const months: { label: string; key: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      key: monthKey(d),
      value: 0,
    });
  }
  for (const j of completed) {
    const m = months.find(
      (x) => x.key === monthKey(j.completedAt ?? j.scheduledAt)
    );
    if (m) m.value += j.price;
  }

  // --- Service revenue mix (completed) ---
  const mix = SERVICE_TYPES.map((st) => ({
    label: SERVICE_LABELS[st],
    color: SERVICE_COLORS[st],
    value: completed
      .filter((j) => j.serviceType === st)
      .reduce((s, j) => s + j.price, 0),
  })).filter((s) => s.value > 0);
  const completedRevenue = completed.reduce((s, j) => s + j.price, 0);

  // --- Pipeline snapshot ---
  const funnel = [
    {
      label: "Quotes",
      value: jobs.filter((j) => j.status === "QUOTE").length,
      color: "#f59e0b",
    },
    {
      label: "Scheduled",
      value: jobs.filter((j) => j.status === "SCHEDULED").length,
      color: "#0ea5e9",
    },
    { label: "Completed", value: completed.length, color: "#10b981" },
  ];

  // --- Rebooking forecast (latest completed per property + service → due date) ---
  const latest = new Map<string, { date: Date; service: ServiceType }>();
  for (const j of completed) {
    if (!isServiceType(j.serviceType)) continue;
    const when = j.completedAt ?? j.scheduledAt;
    const key = `${j.clientId}:${j.serviceType}`;
    const prev = latest.get(key);
    if (!prev || when > prev.date) latest.set(key, { date: when, service: j.serviceType });
  }
  const buckets = [
    { label: "Overdue", value: 0, highlight: true },
    { label: "0–30 days", value: 0 },
    { label: "31–60 days", value: 0 },
    { label: "61–90 days", value: 0 },
  ];
  for (const { date, service } of latest.values()) {
    const due = new Date(date);
    due.setMonth(due.getMonth() + REBOOK_MONTHS[service]);
    const days = Math.round((due.getTime() - now.getTime()) / 86_400_000);
    if (days < 0) buckets[0].value++;
    else if (days <= 30) buckets[1].value++;
    else if (days <= 60) buckets[2].value++;
    else if (days <= 90) buckets[3].value++;
  }
  const dueNow = buckets[0].value;

  // --- Canvassing ---
  const sameDay = (d: Date) =>
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const totalDoors = knocks.length;
  const doorsToday = knocks.filter((k) => sameDay(k.knockedAt)).length;
  const knockCounts = {} as Record<KnockStatus, number>;
  for (const s of KNOCK_STATUSES) knockCounts[s] = 0;
  for (const k of knocks) {
    if ((KNOCK_STATUSES as readonly string[]).includes(k.status))
      knockCounts[k.status as KnockStatus]++;
  }
  const leads = knockCounts.INTERESTED;
  const knockBreakdown = KNOCK_STATUSES.map((s) => ({
    status: s,
    count: knockCounts[s],
  })).filter((x) => x.count > 0);

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-7">
        <p className="text-sm text-gold-600">{greeting(now.getHours())},</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
          {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&rsquo;s how Crystal Clear is doing today.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          i={0}
          label="Revenue · this month"
          value={formatCurrency(revenueThisMonth)}
          accent="gold"
          icon={<MoneyIcon />}
        />
        <StatCard
          i={1}
          label="Open pipeline"
          value={formatCurrency(openPipeline)}
          accent="sky"
          icon={<PipelineIcon />}
        />
        <StatCard
          i={2}
          label="Properties due"
          value={String(dueNow)}
          accent="rose"
          icon={<DueIcon />}
          href="/due"
        />
        <StatCard
          i={3}
          label="Clients"
          value={String(clientCount)}
          accent="slate"
          icon={<ClientsIcon />}
          href="/clients"
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          i={4}
          className="lg:col-span-2"
          title="Revenue"
          subtitle="Completed work, last 6 months"
        >
          <AreaChart data={months.map((m) => ({ label: m.label, value: m.value }))} />
        </ChartCard>

        <ChartCard i={5} title="Service mix" subtitle="Share of completed revenue">
          {mix.length === 0 ? (
            <EmptyChart />
          ) : (
            <DonutChart
              slices={mix}
              centerTop={compactMoney(completedRevenue)}
              centerBottom="completed"
            />
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard i={6} title="Pipeline" subtitle="Jobs by stage">
          <FunnelChart stages={funnel} />
        </ChartCard>

        <ChartCard
          i={7}
          title="Rebooking forecast"
          subtitle="When properties come due"
          action={
            dueNow > 0 ? (
              <Link
                href="/due"
                className="text-sm font-medium text-gold-600 hover:text-gold-700"
              >
                {dueNow} due now &rarr;
              </Link>
            ) : undefined
          }
        >
          <ForecastBars bars={buckets} />
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard
          i={8}
          title="Canvassing"
          subtitle="Door-to-door sales"
          action={
            <Link
              href="/map"
              className="text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              Open map &rarr;
            </Link>
          }
        >
          {totalDoors === 0 ? (
            <div className="flex h-24 items-center justify-center text-center text-sm text-slate-400">
              No doors logged yet — open the map to start canvassing.
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-8">
                <CanvassStat value={totalDoors} label="Doors knocked" />
                <CanvassStat value={doorsToday} label="Today" />
                <CanvassStat value={leads} label="Interested" accent />
              </div>
              <div className="flex flex-wrap gap-2">
                {knockBreakdown.map((s) => (
                  <span
                    key={s.status}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: KNOCK_COLORS[s.status] }}
                    />
                    {KNOCK_LABELS[s.status]}
                    <span className="font-semibold text-slate-900">{s.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function CanvassStat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`nums font-display text-3xl font-semibold ${
          accent ? "text-gold-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

/* ---------- Cards (StatCard / ChartCard live in DashboardCards) ---------- */

function EmptyChart() {
  return (
    <div className="flex h-32 items-center justify-center text-center text-sm text-slate-400">
      Complete a few service-tagged jobs to see this.
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
function PipelineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3 7 4-14 3 7h4" />
    </svg>
  );
}
function DueIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function ClientsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
