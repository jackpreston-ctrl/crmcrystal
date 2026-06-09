"use client";

import { useState } from "react";
import {
  JOB_STATUSES,
  STATUS_LABELS,
  SERVICE_TYPES,
  SERVICE_LABELS,
  ServiceType,
  toLocalDateTimeInput,
} from "@/lib/utils";

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

export function JobForm({
  clients,
  onSuccess,
  defaults,
}: {
  clients: { id: number; name: string }[];
  onSuccess: () => void;
  defaults?: {
    clientId?: number;
    serviceType?: ServiceType;
    scheduledAt?: string;
  };
}) {
  const [form, setForm] = useState({
    clientId: defaults?.clientId
      ? String(defaults.clientId)
      : clients[0]
        ? String(clients[0].id)
        : "",
    title: "",
    // Smart defaults: most-common service, today's date. Overridden by `defaults`.
    serviceType: String(defaults?.serviceType ?? "WINDOW"),
    status: "QUOTE" as (typeof JOB_STATUSES)[number],
    scheduledAt: defaults?.scheduledAt ?? toLocalDateTimeInput(),
    price: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          {saving ? "Saving…" : "Save to schedule"}
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
