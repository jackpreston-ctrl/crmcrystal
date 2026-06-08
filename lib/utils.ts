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

export type JobDTO = {
  id: number;
  clientId: number;
  clientName: string;
  title: string | null;
  status: JobStatus;
  scheduledAt: string; // ISO string
  price: number;
  notes: string | null;
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
