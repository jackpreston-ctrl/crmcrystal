"use client";

import { useEffect, useState } from "react";
import {
  KNOCK_STATUSES,
  KNOCK_LABELS,
  KNOCK_BADGE_STYLES,
  KnockDTO,
  KnockStatus,
} from "@/lib/utils";

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

// Format a Date as a value for <input type="datetime-local"> in local time.
function toLocalInput(d: Date) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function KnockForm({
  location,
  existing,
  clients,
  onSuccess,
}: {
  location: { lat: number; lng: number };
  existing?: KnockDTO | null;
  clients: { id: number; name: string }[];
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<KnockStatus>(existing?.status ?? "NOT_HOME");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [clientId, setClientId] = useState(
    existing?.clientId ? String(existing.clientId) : ""
  );
  const [knockedAt, setKnockedAt] = useState(
    toLocalInput(existing ? new Date(existing.knockedAt) : new Date())
  );
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Best-effort: fill the address for a brand-new knock from reverse geocoding.
  useEffect(() => {
    if (existing) return;
    let cancelled = false;
    setLookingUp(true);
    fetch(`/api/geocode?lat=${location.lat}&lng=${location.lng}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.address) setAddress((cur) => cur || d.address);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLookingUp(false);
      });
    return () => {
      cancelled = true;
    };
  }, [existing, location.lat, location.lng]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      lat: location.lat,
      lng: location.lng,
      status,
      address,
      notes,
      knockedAt: new Date(knockedAt).toISOString(),
      clientId: clientId || null,
    };
    try {
      const res = await fetch(
        existing ? `/api/knocks/${existing.id}` : "/api/knocks",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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
      {/* Outcome picker */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Outcome
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KNOCK_STATUSES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition ${
                status === s
                  ? `${KNOCK_BADGE_STYLES[s]} outline outline-2 outline-offset-1 outline-slate-900/70`
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {KNOCK_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Address
        </span>
        <input
          className={inputClass}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={lookingUp ? "Looking up address…" : "Street address (optional)"}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Knocked at
          </span>
          <input
            type="datetime-local"
            className={inputClass}
            value={knockedAt}
            onChange={(e) => setKnockedAt(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Link client (optional)
          </span>
          <select
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">— none —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Notes
        </span>
        <textarea
          className={inputClass}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened at the door…"
        />
      </label>

      <p className="text-xs text-slate-400">
        Pin: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </p>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
        >
          {saving ? "Saving…" : existing ? "Save changes" : "Log knock"}
        </button>
      </div>
    </form>
  );
}
