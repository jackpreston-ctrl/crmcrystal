"use client";

import { useState } from "react";
import {
  JOB_STATUSES,
  STATUS_LABELS,
  SERVICE_TYPES,
  SERVICE_LABELS,
  ServiceType,
  JobDTO,
  UserLite,
  toLocalDateTimeInput,
} from "@/lib/utils";

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

type WorkerRow = { userId: number; hours: string; rate: string };

export function JobForm({
  clients,
  onSuccess,
  defaults,
  existing,
  users = [],
  canManageMoney = false,
}: {
  clients: { id: number; name: string }[];
  onSuccess: () => void;
  defaults?: {
    clientId?: number;
    serviceType?: ServiceType;
    scheduledAt?: string;
  };
  existing?: JobDTO;
  users?: UserLite[];
  canManageMoney?: boolean;
}) {
  const [form, setForm] = useState({
    clientId: existing
      ? String(existing.clientId)
      : defaults?.clientId
        ? String(defaults.clientId)
        : clients[0]
          ? String(clients[0].id)
          : "",
    title: existing?.title ?? "",
    serviceType: String(existing?.serviceType ?? defaults?.serviceType ?? "WINDOW"),
    status: (existing?.status ?? "QUOTE") as (typeof JOB_STATUSES)[number],
    scheduledAt: existing
      ? toLocalDateTimeInput(existing.scheduledAt)
      : defaults?.scheduledAt ?? toLocalDateTimeInput(),
    price: existing?.price != null ? String(existing.price) : "",
    notes: existing?.notes ?? "",
    soldById: existing?.soldById != null ? String(existing.soldById) : "",
  });
  const [workers, setWorkers] = useState<WorkerRow[]>(
    existing?.workers?.map((w) => ({
      userId: w.userId,
      hours: String(w.hours),
      rate: String(w.hourlyRate),
    })) ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showAttribution = canManageMoney && users.length > 0;

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function rateFor(userId: number): string {
    const r = users.find((u) => u.id === userId)?.defaultHourlyRate;
    return r != null ? String(r) : "";
  }

  function addWorker() {
    const used = new Set(workers.map((w) => w.userId));
    const next = users.find((u) => !used.has(u.id));
    if (!next) return;
    setWorkers((ws) => [
      ...ws,
      { userId: next.id, hours: "", rate: rateFor(next.id) },
    ]);
  }

  function updateWorker(i: number, patch: Partial<WorkerRow>) {
    setWorkers((ws) => ws.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      clientId: form.clientId,
      title: form.title,
      serviceType: form.serviceType,
      status: form.status,
      scheduledAt: form.scheduledAt,
      notes: form.notes,
    };
    if (canManageMoney) {
      payload.price = form.price;
      payload.soldById = form.soldById === "" ? null : Number(form.soldById);
      payload.workers = workers.map((w) => ({
        userId: w.userId,
        hours: Number(w.hours) || 0,
        hourlyRate: Number(w.rate) || 0,
      }));
    }

    try {
      const res = await fetch(existing ? `/api/jobs/${existing.id}` : "/api/jobs", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Client" required>
        <select
          className={inputClass}
          value={form.clientId}
          onChange={(e) => update("clientId", e.target.value)}
          required
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Service" required>
        <select
          className={inputClass}
          value={form.serviceType}
          onChange={(e) => update("serviceType", e.target.value)}
          required
        >
          <option value="" disabled>
            Select a service…
          </option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description">
        <input
          className={inputClass}
          placeholder="e.g. Full exterior, 2 stories"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" required>
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        {canManageMoney && (
          <Field label="Price (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              placeholder="0.00"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
            />
          </Field>
        )}
      </div>

      <Field label="Date & time" required>
        <input
          type="datetime-local"
          className={inputClass}
          value={form.scheduledAt}
          onChange={(e) => update("scheduledAt", e.target.value)}
          required
        />
      </Field>

      {showAttribution && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <Field label="Sold by (15% commission)">
            <select
              className={inputClass}
              value={form.soldById}
              onChange={(e) => update("soldById", e.target.value)}
            >
              <option value="">— No one / house lead</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Worked by (paid hourly)
            </span>
            <div className="space-y-2">
              {workers.length === 0 && (
                <p className="text-xs text-slate-400">No one assigned yet.</p>
              )}
              {workers.map((w, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_3.5rem_5rem_auto] items-center gap-2"
                >
                  <select
                    className={inputClass}
                    value={w.userId}
                    onChange={(e) =>
                      updateWorker(i, {
                        userId: Number(e.target.value),
                        rate: rateFor(Number(e.target.value)),
                      })
                    }
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    className={`${inputClass} px-2`}
                    placeholder="hrs"
                    value={w.hours}
                    onChange={(e) => updateWorker(i, { hours: e.target.value })}
                    aria-label="Hours"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`${inputClass} px-2`}
                      placeholder="rate"
                      value={w.rate}
                      onChange={(e) => updateWorker(i, { rate: e.target.value })}
                      aria-label="Hourly rate"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkers((ws) => ws.filter((_, idx) => idx !== i))}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove worker"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {workers.length < users.length && (
              <button
                type="button"
                onClick={addWorker}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-600 transition hover:text-sky-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add worker
              </button>
            )}
          </div>
        </div>
      )}

      <Field label="Notes">
        <textarea
          className={inputClass}
          rows={2}
          placeholder="Anything to remember for this visit…"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
        >
          {saving ? "Saving…" : existing ? "Save changes" : "Save to schedule"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
