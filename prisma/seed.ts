import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Build a date N days from today at a given hour/minute (local time).
function at(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("🌱  Seeding Crystal Clear CRM…");

  // Start clean so the seed is repeatable.
  await prisma.knock.deleteMany();
  await prisma.job.deleteMany();
  await prisma.client.deleteMany();

  const eleanor = await prisma.client.create({
    data: {
      firstName: "Eleanor",
      lastName: "Whitfield",
      phone: "(650) 555-0142",
      email: "eleanor.whitfield@example.com",
      address: "12 Tuscaloosa Ave, Atherton, CA 94027",
    },
  });

  const raymond = await prisma.client.create({
    data: {
      firstName: "Raymond",
      lastName: "Okafor",
      phone: "(650) 555-0188",
      email: "r.okafor@example.com",
      address: "88 Selby Ln, Atherton, CA 94027",
    },
  });

  const mei = await prisma.client.create({
    data: {
      firstName: "Mei",
      lastName: "Tanaka",
      phone: "(650) 555-0119",
      email: "mei.tanaka@example.com",
      address: "5 Isabella Ave, Atherton, CA 94027",
    },
  });

  const grace = await prisma.client.create({
    data: {
      firstName: "Grace",
      lastName: "Collins",
      phone: "(650) 555-0173",
      email: null,
      address: "240 Atherton Ave, Atherton, CA 94027",
    },
  });

  // --- Team: two owners (Jack, Kasra) + two crew (Casey, Josh) ---
  // Existing accounts keep their passwords; we only ensure role + rate.
  await prisma.user.upsert({
    where: { email: "jackjjpreston@gmail.com" },
    update: {},
    create: {
      name: "Jack",
      email: "jackjjpreston@gmail.com",
      role: "OWNER",
      passwordHash: await bcrypt.hash("changeme123", 11),
    },
  });
  await prisma.user.upsert({
    where: { email: "kasra@crystalclear.com" },
    update: { role: "OWNER" },
    create: {
      name: "Kasra",
      email: "kasra@crystalclear.com",
      role: "OWNER",
      passwordHash: await bcrypt.hash("booboo", 11),
    },
  });
  const casey = await prisma.user.upsert({
    where: { email: "casey@crystalclear.com" },
    update: { role: "EMPLOYEE", defaultHourlyRate: 30 },
    create: {
      name: "Casey",
      email: "casey@crystalclear.com",
      role: "EMPLOYEE",
      defaultHourlyRate: 30,
      passwordHash: await bcrypt.hash("casey123", 11),
    },
  });
  const josh = await prisma.user.upsert({
    where: { email: "josh@crystalclear.com" },
    update: { role: "EMPLOYEE", defaultHourlyRate: 28 },
    create: {
      name: "Josh",
      email: "josh@crystalclear.com",
      role: "EMPLOYEE",
      defaultHourlyRate: 28,
      passwordHash: await bcrypt.hash("josh650", 11),
    },
  });

  const jobs: Prisma.JobUncheckedCreateInput[] = [
    {
      clientId: eleanor.id,
      title: "Full exterior, 2 stories",
      serviceType: "WINDOW",
      status: "SCHEDULED",
      scheduledAt: at(2, 9, 0),
      price: 480,
      notes: "Gated entry — code 4417. Two dogs in the back yard.",
      soldById: casey.id,
      workers: {
        create: [
          { userId: casey.id, hours: 4, hourlyRate: 30 },
          { userId: josh.id, hours: 4, hourlyRate: 28 },
        ],
      },
    },
    {
      clientId: eleanor.id,
      title: "Gutter clearing — quote",
      serviceType: "GUTTER",
      status: "QUOTE",
      scheduledAt: at(2, 11, 30),
      price: 260,
      soldById: josh.id,
    },
    {
      clientId: raymond.id,
      title: "24 panels",
      serviceType: "SOLAR",
      status: "SCHEDULED",
      scheduledAt: at(4, 13, 0),
      price: 320,
      soldById: josh.id,
      workers: { create: [{ userId: josh.id, hours: 2, hourlyRate: 28 }] },
    },
    {
      clientId: mei.id,
      title: "Interior + exterior",
      serviceType: "WINDOW",
      status: "QUOTE",
      scheduledAt: at(6, 10, 0),
      price: 540,
      notes: "Wants a written quote before booking.",
      soldById: casey.id,
    },
    {
      clientId: grace.id,
      title: "Monthly bin cleaning",
      status: "COMPLETED",
      scheduledAt: at(-5, 8, 0),
      completedAt: at(-5, 8, 0),
      price: 75,
      workers: { create: [{ userId: casey.id, hours: 1, hourlyRate: 30 }] },
    },
    {
      clientId: raymond.id,
      title: "Skylight clean",
      serviceType: "WINDOW",
      status: "COMPLETED",
      scheduledAt: at(-2, 14, 0),
      completedAt: at(-2, 14, 0),
      price: 150,
      soldById: casey.id,
      workers: { create: [{ userId: casey.id, hours: 1.5, hourlyRate: 30 }] },
    },
    {
      clientId: mei.id,
      title: "Driveway",
      serviceType: "PRESSURE_WASHING",
      status: "CANCELLED",
      scheduledAt: at(-1, 9, 0),
      price: 200,
      notes: "Client rescheduled — will call back.",
    },

    // Historical completed work, now past its rebooking window — drives the "Due" view.
    {
      clientId: eleanor.id,
      title: "Full exterior window clean",
      serviceType: "WINDOW",
      status: "COMPLETED",
      scheduledAt: at(-185, 9, 0),
      completedAt: at(-185, 9, 0),
      price: 460,
      soldById: casey.id,
      workers: {
        create: [
          { userId: casey.id, hours: 4, hourlyRate: 30 },
          { userId: josh.id, hours: 3, hourlyRate: 28 },
        ],
      },
    },
    {
      clientId: raymond.id,
      title: "Gutter clean-out",
      serviceType: "GUTTER",
      status: "COMPLETED",
      scheduledAt: at(-275, 10, 0),
      completedAt: at(-275, 10, 0),
      price: 300,
      soldById: josh.id,
      workers: { create: [{ userId: josh.id, hours: 3, hourlyRate: 28 }] },
    },
    {
      clientId: grace.id,
      title: "Solar panel wash",
      serviceType: "SOLAR",
      status: "COMPLETED",
      scheduledAt: at(-245, 11, 0),
      completedAt: at(-245, 11, 0),
      price: 280,
      soldById: casey.id,
      workers: { create: [{ userId: josh.id, hours: 2.5, hourlyRate: 28 }] },
    },
    {
      clientId: mei.id,
      title: "Driveway & patio",
      serviceType: "PRESSURE_WASHING",
      status: "COMPLETED",
      scheduledAt: at(-426, 9, 0),
      completedAt: at(-426, 9, 0),
      price: 350,
      soldById: josh.id,
      workers: {
        create: [
          { userId: casey.id, hours: 3, hourlyRate: 30 },
          { userId: josh.id, hours: 3, hourlyRate: 28 },
        ],
      },
    },
  ];

  for (const job of jobs) {
    await prisma.job.create({ data: job });
  }

  // Sample door-to-door knocks scattered around Atherton, with varied outcomes/times.
  const min = 60 * 1000;
  const hr = 60 * min;
  const knocks: Prisma.KnockUncheckedCreateInput[] = [
    {
      lat: 37.4628,
      lng: -122.1989,
      status: "INTERESTED",
      knockedAt: new Date(Date.now() - 25 * min),
      address: "18 Tuscaloosa Ave, Atherton",
      notes: "Asked for a window + gutter quote.",
      clientId: eleanor.id,
    },
    {
      lat: 37.4612,
      lng: -122.2001,
      status: "NOT_HOME",
      knockedAt: new Date(Date.now() - 50 * min),
      address: "61 Selby Ln, Atherton",
    },
    {
      lat: 37.4639,
      lng: -122.1972,
      status: "NOT_INTERESTED",
      knockedAt: new Date(Date.now() - 70 * min),
      address: "9 Isabella Ave, Atherton",
    },
    {
      lat: 37.4601,
      lng: -122.1958,
      status: "SOLD",
      knockedAt: new Date(Date.now() - 2 * hr),
      address: "240 Walsh Rd, Atherton",
      notes: "Booked a solar panel clean.",
      clientId: raymond.id,
    },
    {
      lat: 37.4659,
      lng: -122.1995,
      status: "CALLBACK",
      knockedAt: new Date(Date.now() - 3 * hr),
      address: "77 Fairview Ave, Atherton",
      notes: "Come back after 5pm.",
    },
    {
      lat: 37.4589,
      lng: -122.1979,
      status: "DO_NOT_KNOCK",
      knockedAt: new Date(Date.now() - 26 * hr),
      address: "5 Catalpa Dr, Atherton",
    },
    {
      lat: 37.4647,
      lng: -122.2018,
      status: "APPOINTMENT",
      knockedAt: new Date(Date.now() - 1 * hr),
      address: "112 Almendral Ave, Atherton",
      notes: "Quote Sat 10am.",
    },
    {
      lat: 37.4618,
      lng: -122.1941,
      status: "NOT_HOME",
      knockedAt: new Date(Date.now() - 27 * hr),
      address: "30 Belbrook Way, Atherton",
    },
  ];

  for (const knock of knocks) {
    await prisma.knock.create({ data: knock });
  }

  console.log(
    `✅  Seeded 4 clients, ${jobs.length} jobs, ${knocks.length} knocks, and 4 logins (2 owners, 2 crew).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
