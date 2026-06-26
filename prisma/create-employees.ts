import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Create (or reset) the EMPLOYEE logins for the team.
// Run locally:        npm run create-employees
// Run on production:  railway run npm run create-employees   (or use the Team page)
//
// Re-running is safe: it upserts by email and refreshes name/role/password,
// so the passwords below are always the live credentials.
const EMPLOYEES = [
  { name: "Casey", email: "casey@crystalclear.com", password: "casey123", rate: 30 },
  { name: "Josh", email: "josh@crystalclear.com", password: "josh650", rate: 28 },
];

async function main() {
  for (const e of EMPLOYEES) {
    const email = e.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(e.password, 11);
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: e.name, role: "EMPLOYEE", passwordHash, defaultHourlyRate: e.rate },
      create: {
        name: e.name,
        email,
        role: "EMPLOYEE",
        passwordHash,
        defaultHourlyRate: e.rate,
      },
    });
    console.log(
      `✅  ${user.name} <${user.email}> — EMPLOYEE — $${e.rate}/hr — password: ${e.password}`
    );
  }
  console.log("\nRemind staff to keep these private; you can change them on the Team page.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
