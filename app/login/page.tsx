import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ProfilePicker } from "@/components/ProfilePicker";
import { SetupForm } from "@/components/SetupForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  // Names + roles only — never expose emails or hashes to the public login page.
  const profiles = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    select: { id: true, name: true, role: true },
  });
  const needsSetup = profiles.length === 0;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg shadow-sky-500/20 ring-1 ring-gold-400/30">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3s6 6.5 6 10.5a6 6 0 1 1-12 0C6 9.5 12 3 12 3Z" />
            </svg>
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Crystal Clear
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {needsSetup
              ? "Create your owner account to get started"
              : "Choose your profile to sign in"}
          </p>
        </div>

        {needsSetup ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium">
            <SetupForm />
          </div>
        ) : (
          <Suspense>
            <ProfilePicker profiles={profiles} />
          </Suspense>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Crystal Clear Atherton
        </p>
      </div>
    </div>
  );
}
