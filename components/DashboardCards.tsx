import Link from "next/link";

// Shared premium cards for both the owner and employee dashboards.

export const ACCENTS: Record<string, { chip: string; value: string }> = {
  gold: { chip: "bg-gold-100 text-gold-700", value: "text-gold-600" },
  sky: { chip: "bg-sky-100 text-sky-700", value: "text-slate-900" },
  rose: { chip: "bg-rose-100 text-rose-700", value: "text-slate-900" },
  slate: { chip: "bg-slate-100 text-slate-700", value: "text-slate-900" },
  emerald: { chip: "bg-emerald-100 text-emerald-700", value: "text-slate-900" },
  violet: { chip: "bg-violet-100 text-violet-700", value: "text-slate-900" },
};

export function StatCard({
  i,
  label,
  value,
  accent,
  icon,
  href,
}: {
  i: number;
  label: string;
  value: string;
  accent: keyof typeof ACCENTS;
  icon: React.ReactNode;
  href?: string;
}) {
  const a = ACCENTS[accent];
  const inner = (
    <div
      className="h-full animate-fade-up rounded-2xl border border-slate-200/70 bg-white p-5 shadow-premium transition hover:-translate-y-0.5 hover:shadow-premium-lg"
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.chip}`}
        >
          {icon}
        </span>
      </div>
      <p className={`nums mt-3 font-display text-3xl font-semibold ${a.value}`}>
        {value}
      </p>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function ChartCard({
  i,
  title,
  subtitle,
  action,
  className = "",
  children,
}: {
  i: number;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`animate-fade-up rounded-2xl border border-slate-200/70 bg-white p-5 shadow-premium ${className}`}
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
