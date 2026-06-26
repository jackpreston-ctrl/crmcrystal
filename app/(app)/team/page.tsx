import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TeamManager, TeamUser } from "@/components/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "OWNER") redirect("/");

  const rows = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      defaultHourlyRate: true,
      createdAt: true,
    },
  });

  const users: TeamUser[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "OWNER" ? "OWNER" : "EMPLOYEE",
    defaultHourlyRate: u.defaultHourlyRate,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage who can log in. Add an account for each employee and share their
          password with them.
        </p>
      </header>
      <TeamManager users={users} currentUserId={me.id} />
    </div>
  );
}
