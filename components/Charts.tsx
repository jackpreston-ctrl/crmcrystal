// Hand-rolled, dependency-free charts (SVG + HTML). Server-safe presentational
// components for the dashboard. All data/colors are passed in by the caller.

/* ---------- Area chart (revenue trend) ---------- */

export function AreaChart({
  data,
  stroke = "#0284c7",
  fillFrom = "rgba(2,132,199,0.22)",
  fillTo = "rgba(2,132,199,0.01)",
}: {
  data: { label: string; value: number }[];
  stroke?: string;
  fillFrom?: string;
  fillTo?: string;
}) {
  const W = 540;
  const H = 150;
  const padX = 6;
  const padTop = 14;
  const padBottom = 8;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const x = (i: number) =>
    padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" L ");
  const area = `M ${x(0)},${padTop + innerH} L ${line} L ${x(n - 1)},${
    padTop + innerH
  } Z`;
  const gradId = "areaGrad";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue trend">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillFrom} />
            <stop offset="100%" stopColor={fillTo} />
          </linearGradient>
        </defs>
        {/* baseline */}
        <line
          x1={padX}
          y1={padTop + innerH}
          x2={W - padX}
          y2={padTop + innerH}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={`M ${line}`}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.value)}
            r={i === n - 1 ? 4 : 2.5}
            fill="#fff"
            stroke={stroke}
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[11px] text-slate-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Donut (service mix) ---------- */

export function DonutChart({
  slices,
  centerTop,
  centerBottom,
}: {
  slices: { label: string; value: number; color: string }[];
  centerTop: string;
  centerBottom: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const cx = 60;
  const cy = 60;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f6" strokeWidth={15} />
          {slices.map((s, i) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={15}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="nums font-display text-xl font-semibold text-slate-900">
            {centerTop}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            {centerBottom}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate text-slate-600">
              {s.label}
            </span>
            <span className="nums font-medium text-slate-900">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Funnel (pipeline) ---------- */

export function FunnelChart({
  stages,
}: {
  stages: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const pct = Math.min(100, (s.value / max) * 100);
        return (
          <div key={i}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-600">{s.label}</span>
              <span className="nums font-semibold text-slate-900">{s.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(s.value > 0 ? 6 : 0, pct)}%`,
                  backgroundColor: s.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Forecast bars (rebooking) ---------- */

export function ForecastBars({
  bars,
}: {
  bars: { label: string; value: number; highlight?: boolean }[];
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div>
      <div className="flex h-40 items-end gap-3">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="nums text-sm font-semibold text-slate-900">
              {b.value}
            </span>
            <div
              className={`w-full rounded-t-md transition-all ${
                b.highlight ? "bg-gold-400" : "bg-sky-500/80"
              }`}
              style={{
                height: `${Math.max(b.value > 0 ? 8 : 2, (b.value / max) * 100)}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {bars.map((b, i) => (
          <span
            key={i}
            className="flex-1 text-center text-[11px] leading-tight text-slate-400"
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
