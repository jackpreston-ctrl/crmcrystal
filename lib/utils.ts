// Shared constants, types, and formatters.
// Safe to import from both server and client components (no side effects).

export const JOB_STATUSES = [
  "QUOTE",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const STATUS_LABELS: Record<JobStatus, string> = {
  QUOTE: "Quote",
  SCHEDULED: "Scheduled Job",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Tailwind classes for each status (used by badges and the inline status picker).
export const STATUS_STYLES: Record<JobStatus, string> = {
  QUOTE: "bg-amber-50 text-amber-700 ring-amber-600/20",
  SCHEDULED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

/* --- Service types (window / solar / gutter / pressure washing) --- */

export const SERVICE_TYPES = [
  "WINDOW",
  "SOLAR",
  "GUTTER",
  "PRESSURE_WASHING",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  WINDOW: "Window cleaning",
  SOLAR: "Solar panel cleaning",
  GUTTER: "Gutter cleaning",
  PRESSURE_WASHING: "Pressure washing",
};

export const SERVICE_STYLES: Record<ServiceType, string> = {
  WINDOW: "bg-sky-50 text-sky-700 ring-sky-600/20",
  SOLAR: "bg-amber-50 text-amber-700 ring-amber-600/20",
  GUTTER: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PRESSURE_WASHING: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

// Hex colors for charts (mirrors SERVICE_STYLES).
export const SERVICE_COLORS: Record<ServiceType, string> = {
  WINDOW: "#0ea5e9",
  SOLAR: "#f59e0b",
  GUTTER: "#10b981",
  PRESSURE_WASHING: "#8b5cf6",
};

// Rebooking cadence in months per service — drives the "who's due" view.
export const REBOOK_MONTHS: Record<ServiceType, number> = {
  WINDOW: 4,
  SOLAR: 6,
  GUTTER: 6,
  PRESSURE_WASHING: 12,
};

export function isServiceType(value: unknown): value is ServiceType {
  return (
    typeof value === "string" &&
    (SERVICE_TYPES as readonly string[]).includes(value)
  );
}

// Serializable shapes passed from server components to client components.
export type ClientDTO = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string;
  notes: string | null;
  createdAt: string;
  jobCount: number;
};

export type JobWorkerDTO = {
  userId: number;
  name: string;
  hours: number;
  hourlyRate: number;
};

export type JobDTO = {
  id: number;
  clientId: number;
  clientName: string;
  title: string | null;
  serviceType: ServiceType | null;
  status: JobStatus;
  scheduledAt: string; // ISO string
  completedAt: string | null; // ISO string
  price: number | null; // null = hidden (employees don't see prices)
  notes: string | null;
  // Attribution (owner-only; null/empty for employees).
  soldById: number | null;
  soldByName: string | null;
  workers: JobWorkerDTO[];
};

/* --- Pay & attribution --- */

// Commission an employee earns on a job they sold (share of the job price).
export const COMMISSION_RATE = 0.15;

export function commissionFor(price: number): number {
  return price * COMMISSION_RATE;
}

// Clean a raw workers payload into deduped {userId,hours,hourlyRate} rows.
export function parseWorkerRows(
  raw: unknown
): { userId: number; hours: number; hourlyRate: number }[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const rows: { userId: number; hours: number; hourlyRate: number }[] = [];
  for (const w of raw) {
    const userId = Number((w as { userId?: unknown })?.userId);
    if (!Number.isInteger(userId) || seen.has(userId)) continue;
    seen.add(userId);
    const hours = Number((w as { hours?: unknown })?.hours);
    const hourlyRate = Number((w as { hourlyRate?: unknown })?.hourlyRate);
    rows.push({
      userId,
      hours: Number.isFinite(hours) && hours > 0 ? hours : 0,
      hourlyRate: Number.isFinite(hourlyRate) && hourlyRate > 0 ? hourlyRate : 0,
    });
  }
  return rows;
}

// A teammate, slimmed for selects and the profile picker.
export type UserLite = {
  id: number;
  name: string;
  role: string;
  defaultHourlyRate: number | null;
};

// One person's pay summary, scoped to their own jobs.
export type EmployeeEarnings = {
  commission: number; // 15% of price on jobs they sold
  hourly: number; // hours * rate on jobs they worked
  total: number;
  soldCount: number;
  workedCount: number;
  hours: number;
};

// Deterministic tile color + initials for profile avatars (no schema needed).
export const PROFILE_GRADIENTS = [
  "from-sky-400 to-cyan-500",
  "from-violet-400 to-indigo-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
  "from-blue-400 to-indigo-500",
];

export function profileGradient(id: number): string {
  return PROFILE_GRADIENTS[Math.abs(id) % PROFILE_GRADIENTS.length];
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// One "this property is due for re-service" row.
export type DueDTO = {
  clientId: number;
  clientName: string;
  address: string;
  serviceType: ServiceType;
  lastCompletedAt: string; // ISO string
  monthsSince: number;
  intervalMonths: number;
  overdueByMonths: number;
};

export function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    (JOB_STATUSES as readonly string[]).includes(value)
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "YYYY-MM-DDTHH:mm" in local time — for <input type="datetime-local"> defaults.
export function toLocalDateTimeInput(value: string | Date = new Date()): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// Whole months elapsed between a past date and now (used by the "who's due" view).
export function monthsSince(value: string | Date): number {
  const d = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  let months =
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  return Math.max(0, months);
}

// Heading like "Today · Monday, Jun 9" for grouping the schedule by day.
export function dateGroupLabel(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / 86_400_000
  );
  const weekday = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  if (diffDays === 0) return `Today · ${weekday}`;
  if (diffDays === 1) return `Tomorrow · ${weekday}`;
  if (diffDays === -1) return `Yesterday · ${weekday}`;
  return weekday;
}

/* --- Door-to-door canvassing --- */

export const KNOCK_STATUSES = [
  "NOT_HOME",
  "CALLBACK",
  "NOT_INTERESTED",
  "INTERESTED",
  "APPOINTMENT",
  "SOLD",
  "DO_NOT_KNOCK",
] as const;

export type KnockStatus = (typeof KNOCK_STATUSES)[number];

export const KNOCK_LABELS: Record<KnockStatus, string> = {
  NOT_HOME: "Not home",
  CALLBACK: "Come back",
  NOT_INTERESTED: "Not interested",
  INTERESTED: "Interested",
  APPOINTMENT: "Quote booked",
  SOLD: "Sold",
  DO_NOT_KNOCK: "Do not knock",
};

// Hex colors for the map markers.
export const KNOCK_COLORS: Record<KnockStatus, string> = {
  NOT_HOME: "#94a3b8",
  CALLBACK: "#f59e0b",
  NOT_INTERESTED: "#f43f5e",
  INTERESTED: "#0ea5e9",
  APPOINTMENT: "#8b5cf6",
  SOLD: "#10b981",
  DO_NOT_KNOCK: "#334155",
};

// Tailwind badge styles (kept in a lib file scanned by Tailwind's content globs).
export const KNOCK_BADGE_STYLES: Record<KnockStatus, string> = {
  NOT_HOME: "bg-slate-100 text-slate-700 ring-slate-600/20",
  CALLBACK: "bg-amber-50 text-amber-700 ring-amber-600/20",
  NOT_INTERESTED: "bg-rose-50 text-rose-700 ring-rose-600/20",
  INTERESTED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  APPOINTMENT: "bg-violet-50 text-violet-700 ring-violet-600/20",
  SOLD: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  DO_NOT_KNOCK: "bg-slate-200 text-slate-800 ring-slate-700/30",
};

export type KnockDTO = {
  id: number;
  lat: number;
  lng: number;
  address: string | null;
  status: KnockStatus;
  notes: string | null;
  knockedAt: string; // ISO string
  clientId: number | null;
  clientName: string | null;
};

export function isKnockStatus(value: unknown): value is KnockStatus {
  return (
    typeof value === "string" &&
    (KNOCK_STATUSES as readonly string[]).includes(value)
  );
}

// Atherton, CA — default map center.
export const DEFAULT_CENTER: [number, number] = [37.4613, -122.1977];
