// Idempotent team provisioning — runs on every Railway deploy (after `prisma db push`).
// Creates the crew accounts if missing; NEVER resets an existing password (so changes
// made on the live Team page stick) and NEVER touches jobs/clients/knocks.
// Plain ESM so it runs with `node` using only runtime deps (@prisma/client, bcryptjs).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CREW = [
  { name: "Kasra", email: "kasra@crystalclear.com", role: "OWNER", rate: null, password: "booboo" },
  { name: "Casey", email: "casey@crystalclear.com", role: "EMPLOYEE", rate: 30, password: "casey123" },
  { name: "Josh", email: "josh@crystalclear.com", role: "EMPLOYEE", rate: 28, password: "josh650" },
];

async function main() {
  // Rename the original owner if present — updateMany never creates a duplicate.
  await prisma.user.updateMany({
    where: { email: "jackjjpreston@gmail.com" },
    data: { name: "Jack" },
  });

  for (const u of CREW) {
    await prisma.user.upsert({
      where: { email: u.email },
      // Keep role/name/rate in sync but leave the password alone on existing accounts.
      update: { name: u.name, role: u.role, defaultHourlyRate: u.rate },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        defaultHourlyRate: u.rate,
        passwordHash: await bcrypt.hash(u.password, 11),
      },
    });
  }
  console.log("ensure-team: team accounts ensured.");
}

main()
  .catch((e) => {
    console.error("ensure-team failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
