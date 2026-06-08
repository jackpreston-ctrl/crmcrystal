"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { ClientForm } from "@/components/ClientForm";
import { ClientDTO } from "@/lib/utils";

export function ClientsTable({ clients }: { clients: ClientDTO[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.firstName, c.lastName, c.email ?? "", c.phone, c.address]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [clients, query]);

  async function handleDelete(client: ClientDTO) {
    const name = `${client.firstName} ${client.lastName}`;
    if (
      !confirm(
        `Delete ${name}? This also removes their ${client.jobCount} job(s)/quote(s).`
      )
    )
      return;
    setDeleting(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Could not delete client.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add client
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState hasClients={clients.length > 0} onAdd={() => setOpen(true)} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="truncate text-sm text-slate-500">{c.address}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
                  <a
                    href={`tel:${c.phone}`}
                    className="hover:text-sky-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.phone}
                  </a>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="hidden truncate hover:text-sky-700 md:inline"
                    >
                      {c.email}
                    </a>
                  )}
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {c.jobCount} {c.jobCount === 1 ? "job" : "jobs"}
                  </span>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deleting === c.id}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    aria-label="Delete client"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add client">
        <ClientForm
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}

function EmptyState({
  hasClients,
  onAdd,
}: {
  hasClients: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-medium text-slate-900">
        {hasClients ? "No matching clients" : "No clients yet"}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {hasClients
          ? "Try a different search."
          : "Add your first client to get started."}
      </p>
      {!hasClients && (
        <button
          onClick={onAdd}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add client
        </button>
      )}
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
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
