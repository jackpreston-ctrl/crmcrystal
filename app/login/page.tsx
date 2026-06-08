import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { SetupForm } from "@/components/SetupForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  // Fresh database (e.g. just deployed) → let the first person create the owner account.
  const needsSetup = (await prisma.user.count()) === 0;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-sm">
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
          <h1 className="text-lg font-semibold text-slate-900">
            Crystal Clear CRM
          </h1>
          <p className="text-sm text-slate-500">
            {needsSetup
              ? "Welcome — create your owner account to get started"
              : "Sign in to your account"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {needsSetup ? (
            <SetupForm />
          ) : (
            <Suspense>
              <LoginForm />
            </Suspense>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Crystal Clear Atherton
        </p>
      </div>
    </div>
  );
}
