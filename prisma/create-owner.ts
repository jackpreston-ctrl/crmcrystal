import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Create (or ensure) an OWNER account. Use this for production setup:
//   OWNER_EMAIL=you@biz.com OWNER_NAME="You" OWNER_PASSWORD="strong-pass" npm run create-owner
// or with positional args:
//   npm run create-owner -- you@biz.com "Your Name" "strong-pass"
async function main() {
  const email = (process.env.OWNER_EMAIL || process.argv[2] || "owner@example.com")
    .trim()
    .toLowerCase();
  const name = process.env.OWNER_NAME || process.argv[3] || "Owner";
  const password = process.env.OWNER_PASSWORD || process.argv[4] || "changeme123";

  const passwordHash = await bcrypt.hash(password, 11);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "OWNER" },
    create: { name, email, role: "OWNER", passwordHash },
  });

  console.log(`✅  Owner account ready: ${user.email}`);
  console.log("   (If the account already existed, its password was left unchanged.)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
