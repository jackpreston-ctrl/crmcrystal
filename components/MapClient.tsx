"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Modal } from "@/components/Modal";
import { KnockForm } from "@/components/KnockForm";
import {
  KnockDTO,
  KnockStatus,
  KNOCK_STATUSES,
  KNOCK_LABELS,
  KNOCK_COLORS,
  KNOCK_BADGE_STYLES,
  formatDateTime,
} from "@/lib/utils";

// Leaflet touches `window`, so load the map client-side only.
const KnockMap = dynamic(
  () => import("@/components/KnockMap").then((m) => m.KnockMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
        Loading map…
      </div>
    ),
  }
);

type Focus = { lat: number; lng: number; nonce: number } | null;

export function MapClient({
  knocks,
  clients,
  center,
}: {
  knocks: KnockDTO[];
  clients: { id: number; name: string }[];
  center: [number, number];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [editing, setEditing] = useState<KnockDTO | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [focus, setFocus] = useState<Focus>(null);
  const [hidden, setHidden] = useState<Set<KnockStatus>>(new Set());
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of KNOCK_STATUSES) c[s] = 0;
    for (const k of knocks) c[k.status] = (c[k.status] ?? 0) + 1;
    return c;
  }, [knocks]);

  const todayCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return knocks.filter((k) => new Date(k.knockedAt) >= start).length;
  }, [knocks]);

  const visible = useMemo(
    () => knocks.filter((k) => !hidden.has(k.status)),
    [knocks, hidden]
  );

  function openForLocation(lat: number, lng: number) {
    setEditing(null);
    setPending({ lat, lng });
    setFormOpen(true);
  }

  function openForEdit(knock: KnockDTO) {
    setEditing(knock);
    setPending({ lat: knock.lat, lng: knock.lng });
    setFormOpen(true);
  }

  function toggleStatus(s: KnockStatus) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation isn't available on this device.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setFocus({ lat: latitude, lng: longitude, nonce: Date.now() });
        openForLocation(latitude, longitude);
      },
      () => {
        setLocating(false);
        setGeoError("Couldn't get your location — check location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleDelete(knock: KnockDTO) {
    if (!confirm("Delete this knock?")) return;
    try {
      const res = await fetch(`/api/knocks/${knock.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Could not delete knock.");
    }
  }

  const recent = knocks.slice(0, 8); // already newest-first from the server

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
          >
            <LocationIcon className="h-4 w-4" />
            {locating ? "Locating…" : "Use my location"}
          </button>
          <p className="hidden text-sm text-slate-500 sm:block">
            or tap the map to log a door.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">
            <b className="text-slate-900">{knocks.length}</b> doors
          </span>
          <span className="text-slate-500">
            <b className="text-slate-900">{todayCount}</b> today
          </span>
        </div>
      </div>

      {geoError && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
          {geoError}
        </p>
      )}

      {/* Legend / filters — tap to show/hide an outcome */}
      <div className="flex flex-wrap gap-1.5">
        {KNOCK_STATUSES.map((s) => {
          const off = hidden.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-slate-200 transition ${
                off ? "text-slate-400 opacity-60" : "text-slate-700"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: KNOCK_COLORS[s] }}
              />
              {KNOCK_LABELS[s]}
              <span className="text-slate-400">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      {/* Map (isolate keeps Leaflet's z-index inside this box, under the modal) */}
      <div className="relative isolate h-[68vh] min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <KnockMap
          knocks={visible}
          center={center}
          focus={focus}
          onPick={openForLocation}
          onEdit={openForEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Recent knocks */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Recent knocks</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No knocks yet — tap the map or use your location to log the first one.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((k) => (
                <li
                  key={k.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 hover:bg-slate-50"
                >
                  <button
                    onClick={() => setFocus({ lat: k.lat, lng: k.lng, nonce: Date.now() })}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: KNOCK_COLORS[k.status] }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {k.address || `${k.lat.toFixed(4)}, ${k.lng.toFixed(4)}`}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {formatDateTime(k.knockedAt)}
                        {k.clientName ? ` · ${k.clientName}` : ""}
                      </span>
                    </span>
                  </button>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${KNOCK_BADGE_STYLES[k.status]}`}
                  >
                    {KNOCK_LABELS[k.status]}
                  </span>
                  <button
                    onClick={() => openForEdit(k)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Edit knock"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(k)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete knock"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit knock" : "Log a knock"}
      >
        {pending && (
          <KnockForm
            location={pending}
            existing={editing}
            clients={clients}
            onSuccess={() => {
              setFormOpen(false);
              router.refresh();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function LocationIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
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
