import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ─── Seed Admin User ──────────────────────────────────────────────
  const adminEmail = "admin@adspace.com";
  const adminPassword = "Admin@123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists. Skipping.");
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
        isActive: true,
      },
    });

    console.log("✅ Admin user created:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   ID:    ${admin.id}`);
  }

  // ─── Seed Default Categories ──────────────────────────────────────
  const defaultCategories = [
    "Digital Signage",
    "LED Display",
    "Billboard",
    "Building Wall",
    "Residential Wall",
    "Commercial Wall",
    "Outdoor Advertising",
  ];

  let created = 0;
  let skipped = 0;

  for (const name of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.category.create({ data: { name } });
    created++;
  }

  console.log(`\n✅ Categories: ${created} created, ${skipped} already existed.`);

  // List all categories
  const allCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  console.log("\n📋 All Categories:");
  allCategories.forEach((c) => console.log(`   • ${c.name}`));
}

main()
  .catch((error) => {
    console.error("❌ Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
