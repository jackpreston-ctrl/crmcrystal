"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { profileGradient, initialsOf } from "@/lib/utils";

type Profile = { id: number; name: string; role: string };

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

function RoleTag({ role }: { role: string }) {
  const owner = role === "OWNER";
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${
        owner ? "text-gold-600" : "text-slate-400"
      }`}
    >
      {owner ? "Owner" : "Crew"}
    </span>
  );
}

function Avatar({ profile, size }: { profile: Profile; size: "md" | "lg" }) {
  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-16 w-16 text-xl";
  return (
    <span
      className={`flex ${dim} items-center justify-center rounded-full bg-gradient-to-br ${profileGradient(
        profile.id
      )} font-semibold text-white shadow-inner ring-2 ring-white`}
    >
      {initialsOf(profile.name)}
    </span>
  );
}

export function ProfilePicker({ profiles }: { profiles: Profile[] }) {
  const params = useSearchParams();
  const rawNext = params.get("next") || "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";

  const [selected, setSelected] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Sign in failed.");
      }
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setBusy(false);
    }
  }

  if (selected) {
    return (
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-xs animate-fade-up flex-col items-center rounded-2xl border border-slate-200/70 bg-white p-6 text-center shadow-premium"
      >
        <Avatar profile={selected} size="lg" />
        <p className="mt-3 font-display text-xl font-semibold text-slate-900">
          {selected.name}
        </p>
        <RoleTag role={selected.role} />

        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          className={`${inputClass} mt-5`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />

        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full cursor-pointer rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setPassword("");
            setError(null);
          }}
          className="mt-3 cursor-pointer text-xs font-medium text-slate-500 transition hover:text-slate-700"
        >
          ← Not you?
        </button>
      </form>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => setSelected(p)}
          className="group flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-premium transition hover:-translate-y-0.5 hover:shadow-premium-lg"
        >
          <Avatar profile={p} size="md" />
          <span className="font-display text-base font-semibold leading-tight text-slate-900">
            {p.name}
          </span>
          <RoleTag role={p.role} />
        </button>
      ))}
    </div>
  );
}
