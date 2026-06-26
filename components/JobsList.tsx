"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { JobForm } from "@/components/JobForm";
import {
  JOB_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  SERVICE_LABELS,
  JobDTO,
  JobStatus,
  UserLite,
  dateGroupLabel,
  formatCurrency,
  formatTime,
} from "@/lib/utils";

type Filter = "ALL" | JobStatus;

export function JobsList({
  jobs,
  clients,
  users = [],
  canManageMoney = false,
}: {
  jobs: JobDTO[];
  clients: { id: number; name: string }[];
  users?: UserLite[];
  canManageMoney?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobDTO | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [busy, setBusy] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: jobs.length };
    for (const s of JOB_STATUSES) c[s] = 0;
    for (const j of jobs) c[j.status]++;
    return c;
  }, [jobs]);

  // Group filtered jobs by local calendar day (jobs arrive sorted soonest-first).
  const groups = useMemo(() => {
    const visible = filter === "ALL" ? jobs : jobs.filter((j) => j.status === filter);
    const map = new Map<string, { label: string; sortKey: number; jobs: JobDTO[] }>();
    for (const job of visible) {
      const d = new Date(job.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) {
        map.set(key, {
          label: dateGroupLabel(job.scheduledAt),
          sortKey: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
          jobs: [],
        });
      }
      map.get(key)!.jobs.push(job);
    }
    return [...map.values()].sort((a, b) => a.sortKey - b.sortKey);
  }, [jobs, filter]);

  async function changeStatus(id: number, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Could not update status.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(job: JobDTO) {
    if (!confirm(`Delete this ${STATUS_LABELS[job.status].toLowerCase()} for ${job.clientName}?`))
      return;
    setBusy(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Could not delete job.");
    } finally {
      setBusy(null);
    }
  }

  const noClients = clients.length === 0;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
            All <Count>{counts.ALL}</Count>
          </FilterChip>
          {JOB_STATUSES.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {STATUS_LABELS[s]} <Count>{counts[s]}</Count>
            </FilterChip>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={noClients}
          title={noClients ? "Add a client first" : undefined}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          New job / quote
        </button>
      </div>

      {noClients && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          Add a client on the Clients page before scheduling a job.
        </p>
      )}

      {/* Grouped schedule */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-900">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate-500">
            {filter === "ALL"
              ? "Create your first quote or job to see it on the schedule."
              : "No jobs with this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 px-1 text-sm font-semibold text-slate-500">
                {group.label}
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {group.jobs.map((job) => (
                    <li
                      key={job.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:bg-slate-50"
                    >
                      <div className="w-16 shrink-0 text-sm font-semibold text-slate-500">
                        {formatTime(job.scheduledAt)}
                      </div>
                      <div className="min-w-0 flex-1 basis-44">
                        <p className="truncate font-medium text-slate-900">
                          {job.clientName}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {[
                            job.serviceType && SERVICE_LABELS[job.serviceType],
                            job.title,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                        {(job.soldByName || job.workers.length > 0) && (
                          <p className="truncate text-xs text-slate-400">
                            {[
                              job.soldByName && `Sold: ${job.soldByName}`,
                              job.workers.length > 0 &&
                                `Worked: ${job.workers.map((w) => w.name).join(", ")}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      {job.price !== null && (
                        <div className="text-sm font-semibold text-slate-900">
                          {formatCurrency(job.price)}
                        </div>
                      )}
                      <select
                        value={job.status}
                        disabled={busy === job.id}
                        onChange={(e) => changeStatus(job.id, e.target.value)}
                        className={`cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium ring-1 ring-inset transition focus:ring-2 disabled:opacity-50 ${STATUS_STYLES[job.status]}`}
                        aria-label="Change status"
                      >
                        {JOB_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditing(job)}
                        disabled={busy === job.id}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600 disabled:opacity-50"
                        aria-label="Edit job"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(job)}
                        disabled={busy === job.id}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label="Delete job"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New job or quote">
        <JobForm
          clients={clients}
          users={users}
          canManageMoney={canManageMoney}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit job">
        {editing && (
          <JobForm
            clients={clients}
            users={users}
            canManageMoney={canManageMoney}
            existing={editing}
            onSuccess={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-xs opacity-60">{children}</span>;
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
