import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ACCOUNTS } from "../src/lib/accounts";

const prisma = new PrismaClient();

async function main() {
  // Chart of accounts — created once, never renamed/removed after real data exists.
  for (const acc of Object.values(ACCOUNTS)) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name, type: acc.type },
      create: { code: acc.code, name: acc.name, type: acc.type },
    });
  }
  console.log(`Seeded ${Object.values(ACCOUNTS).length} accounts.`);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const bartenderPassword = process.env.SEED_BARTENDER_PASSWORD || "Barkeep@12345";

  const admin = await prisma.user.upsert({
    where: { email: "admin@bar.local" },
    update: {},
    create: {
      name: "Bar Owner",
      email: "admin@bar.local",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  const bartender = await prisma.user.upsert({
    where: { email: "bartender@bar.local" },
    update: {},
    create: {
      name: "Bartender One",
      email: "bartender@bar.local",
      passwordHash: await bcrypt.hash(bartenderPassword, 10),
      role: "BARTENDER",
    },
  });

  console.log("Seeded users:");
  console.log(`  ADMIN     -> ${admin.email} / ${adminPassword}`);
  console.log(`  BARTENDER -> ${bartender.email} / ${bartenderPassword}`);
  console.log("Change these passwords immediately after first login.");

  // A few starter products so the sales/stock forms aren't empty.
  const products = [
    { name: "Carlsberg Green 500ml", category: "Beer", costPrice: 1200, sellingPrice: 2000 },
    { name: "Kuche Kuche 500ml", category: "Beer", costPrice: 1000, sellingPrice: 1800 },
    { name: "Coca-Cola 500ml", category: "Soft Drink", costPrice: 400, sellingPrice: 1000 },
    { name: "Malawi Gin 250ml", category: "Spirit", costPrice: 2500, sellingPrice: 4500 },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { name: p.name },
      update: {},
      create: { ...p, unit: "bottle", reorderLevel: 12 },
    });
  }
  console.log(`Seeded ${products.length} starter products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
