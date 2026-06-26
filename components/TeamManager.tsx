"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

export type TeamUser = {
  id: number;
  name: string;
  email: string;
  role: "OWNER" | "EMPLOYEE";
  defaultHourlyRate: number | null;
  createdAt: string;
};

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

const ROLE_BADGE: Record<TeamUser["role"], string> = {
  OWNER: "bg-violet-50 text-violet-700 ring-violet-600/20",
  EMPLOYEE: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function TeamManager({
  users,
  currentUserId,
}: {
  users: TeamUser[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TeamUser | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(user: TeamUser) {
    if (
      !confirm(`Remove ${user.name}? They'll no longer be able to log in.`)
    )
      return;
    setDeleting(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not remove this account.");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not remove account.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add team member
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {initials(u.name)}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="flex items-center gap-2 font-medium text-slate-900">
                  <span className="truncate">{u.name}</span>
                  {u.id === currentUserId && (
                    <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
                      You
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-slate-500">{u.email}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE[u.role]}`}
              >
                {u.role === "OWNER" ? "Owner" : "Employee"}
              </span>
              <span className="w-14 text-right text-sm font-medium text-slate-500">
                {u.defaultHourlyRate != null ? `$${u.defaultHourlyRate}/hr` : "—"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing(u)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Edit member"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={deleting === u.id}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    aria-label="Remove member"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add team member">
        <UserForm
          onSuccess={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit team member"
      >
        {editing && (
          <UserForm
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

function UserForm({
  existing,
  onSuccess,
}: {
  existing?: TeamUser;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [role, setRole] = useState<TeamUser["role"]>(existing?.role ?? "EMPLOYEE");
  const [password, setPassword] = useState("");
  const [rate, setRate] = useState(
    existing?.defaultHourlyRate != null ? String(existing.defaultHourlyRate) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: Record<string, string> = {
      name,
      email,
      role,
      defaultHourlyRate: rate,
    };
    if (password) payload.password = password;
    try {
      const res = await fetch(
        existing ? `/api/users/${existing.id}` : "/api/users",
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
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Name
        </span>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </span>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Role
          </span>
          <select
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value as TeamUser["role"])}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="OWNER">Owner</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            {existing ? "New password" : "Password"}
          </span>
          <input
            type="text"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={existing ? "Leave blank to keep" : "At least 6 characters"}
            required={!existing}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Default hourly rate (USD)
        </span>
        <input
          type="number"
          min="0"
          step="1"
          className={inputClass}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="e.g. 30"
        />
        <span className="mt-1 block text-xs text-slate-400">
          Pre-fills this person&rsquo;s pay when they&rsquo;re added as a worker
          on a job. Leave blank if unsure.
        </span>
      </label>

      <p className="text-xs text-slate-400">
        {role === "OWNER"
          ? "Owners can manage the team and see everything."
          : "Employees use the CRM and see only their own earnings."}
      </p>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : existing ? "Save changes" : "Add member"}
        </button>
      </div>
    </form>
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
