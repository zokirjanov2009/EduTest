const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 EduTest seeding...");
  const hash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where:  { email: "admin@edutest.uz" },
    update: {},
    create: { name: "Super Admin", email: "admin@edutest.uz", password: hash, role: "ADMIN" },
  });
  console.log("✅ Admin:", admin.email);
  console.log("🔑 Parol: admin123");
  console.log("🌐 EduTest tizimi tayyor!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
