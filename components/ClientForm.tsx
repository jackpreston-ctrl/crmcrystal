"use client";

import { useState } from "react";

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

export function ClientForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    cityState: "Atherton, CA 94027", // pre-filled so only the street is typed
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
      const address = [form.street.trim(), form.cityState.trim()]
        .filter(Boolean)
        .join(", ");
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          address,
          notes: form.notes,
        }),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required>
          <input
            className={inputClass}
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            autoFocus
            required
          />
        </Field>
        <Field label="Last name" required>
          <input
            className={inputClass}
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Phone" required>
        <input
          type="tel"
          className={inputClass}
          placeholder="(650) 555-0123"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          className={inputClass}
          placeholder="name@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>

      <Field label="Street address" required>
        <input
          className={inputClass}
          placeholder="123 Example Ln"
          value={form.street}
          onChange={(e) => update("street", e.target.value)}
          required
        />
      </Field>

      <Field label="City / state / ZIP">
        <input
          className={inputClass}
          value={form.cityState}
          onChange={(e) => update("cityState", e.target.value)}
        />
      </Field>

      <Field label="Notes">
        <textarea
          className={inputClass}
          rows={2}
          placeholder="Gate codes, pets, access notes…"
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
          {saving ? "Saving…" : "Add client"}
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
