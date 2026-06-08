import { prisma } from "@/lib/db";
import { ClientsTable } from "@/components/ClientsTable";
import { ClientDTO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const rows = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { jobs: true } } },
  });

  const clients: ClientDTO[] = rows.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    email: c.email,
    address: c.address,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    jobCount: c._count.jobs,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Clients
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Everyone on the Crystal Clear books.
        </p>
      </header>
      <ClientsTable clients={clients} />
    </div>
  );
}
