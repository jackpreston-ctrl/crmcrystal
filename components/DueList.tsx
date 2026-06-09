"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { JobForm } from "@/components/JobForm";
import {
  DueDTO,
  ServiceType,
  SERVICE_TYPES,
  SERVICE_LABELS,
  SERVICE_STYLES,
  formatDate,
  toLocalDateTimeInput,
} from "@/lib/utils";

type Filter = "ALL" | ServiceType;

export function DueList({
  due,
  clients,
}: {
  due: DueDTO[];
  clients: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [booking, setBooking] = useState<DueDTO | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: due.length };
    for (const s of SERVICE_TYPES) c[s] = 0;
    for (const d of due) c[d.serviceType]++;
    return c;
  }, [due]);

  const visible = useMemo(
    () => (filter === "ALL" ? due : due.filter((d) => d.serviceType === filter)),
    [due, filter]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          All <Count>{counts.ALL}</Count>
        </FilterChip>
        {SERVICE_TYPES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {SERVICE_LABELS[s]} <Count>{counts[s]}</Count>
          </FilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-900">Nobody's due 🎉</p>
          <p className="mt-1 text-sm text-slate-500">
            {due.length === 0
              ? "Completed jobs tagged with a service show up here once they pass their rebooking window."
              : "No properties due for this service."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {visible.map((d) => (
              <li
                key={`${d.clientId}:${d.serviceType}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate font-medium text-slate-900">
                    {d.clientName}
                  </p>
                  <p className="truncate text-sm text-slate-500">{d.address}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${SERVICE_STYLES[d.serviceType]}`}
                >
                  {SERVICE_LABELS[d.serviceType]}
                </span>
                <div className="text-right text-sm">
                  <p className="font-semibold text-rose-600">
                    {d.overdueByMonths === 0
                      ? "Due now"
                      : `${d.overdueByMonths} mo overdue`}
                  </p>
                  <p className="text-xs text-slate-400">
                    last {formatDate(d.lastCompletedAt)} · every{" "}
                    {d.intervalMonths} mo
                  </p>
                </div>
                <button
                  onClick={() => setBooking(d)}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >
                  Book quote
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={booking !== null}
        onClose={() => setBooking(null)}
        title="Book a quote"
      >
        {booking && (
          <JobForm
            clients={clients}
            defaults={{
              clientId: booking.clientId,
              serviceType: booking.serviceType,
              scheduledAt: toLocalDateTimeInput(),
            }}
            onSuccess={() => {
              setBooking(null);
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
