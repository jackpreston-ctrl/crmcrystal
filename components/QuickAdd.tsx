"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { ClientForm } from "@/components/ClientForm";
import { JobForm } from "@/components/JobForm";

type Mode = "choose" | "client" | "job";

export function QuickAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("choose");
  const [clients, setClients] = useState<{ id: number; name: string }[] | null>(
    null
  );
  const [loadingClients, setLoadingClients] = useState(false);

  function close() {
    setOpen(false);
    setMode("choose");
  }

  function done() {
    close();
    router.refresh();
  }

  // Lazy-load the client list the first time the job form is opened.
  async function openJob() {
    setMode("job");
    if (clients !== null) return;
    setLoadingClients(true);
    try {
      const res = await fetch("/api/clients");
      const rows = res.ok ? await res.json() : [];
      setClients(
        rows.map((c: { id: number; firstName: string; lastName: string }) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        }))
      );
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }

  const title =
    mode === "client"
      ? "New client"
      : mode === "job"
        ? "New job or quote"
        : "Quick add";

  return (
    <>
      <button
        onClick={() => {
          setMode("choose");
          setOpen(true);
        }}
        aria-label="Quick add"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 lg:bottom-6 lg:right-6"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      <Modal open={open} onClose={close} title={title}>
        {mode === "choose" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ChooserButton
              onClick={() => setMode("client")}
              label="New client"
              sub="Homeowner or estate manager"
              icon={<ClientsIcon className="h-5 w-5" />}
            />
            <ChooserButton
              onClick={openJob}
              label="New job / quote"
              sub="Window, gutter, solar, pressure"
              icon={<ScheduleIcon className="h-5 w-5" />}
            />
          </div>
        )}

        {mode === "client" && <ClientForm onSuccess={done} />}

        {mode === "job" &&
          (loadingClients || clients === null ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : clients.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
              Add a client first, then you can book a job or quote.
            </p>
          ) : (
            <JobForm clients={clients} onSuccess={done} />
          ))}
      </Modal>
    </>
  );
}

function ChooserButton({
  onClick,
  label,
  sub,
  icon,
}: {
  onClick: () => void;
  label: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>
        <span className="block text-xs text-slate-500">{sub}</span>
      </span>
    </button>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ClientsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ScheduleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
