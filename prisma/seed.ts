import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  datasourceUrl:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING,
});

async function main() {
  const users = [
    { username: "admin", name: "Owner", role: "ADMIN" },
    { username: "waiter", name: "Waiter One", role: "WAITER" },
    { username: "kitchen", name: "Kitchen One", role: "KITCHEN" },
    { username: "cashier", name: "Cashier One", role: "CASHIER" },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, password: await bcrypt.hash("password123", 10) },
    });
  }

  const tableCount = await prisma.table.count();
  if (tableCount === 0) {
    for (let i = 1; i <= 8; i++) {
      await prisma.table.create({ data: { name: `Table ${i}`, seats: 4 } });
    }
  }

  const menuCount = await prisma.menuItem.count();
  if (menuCount === 0) {
    await prisma.menuItem.createMany({
      data: [
        { name: "Margherita Pizza", price: 9.5, category: "Mains" },
        { name: "Chicken Burger", price: 8.0, category: "Mains" },
        { name: "Pad Thai", price: 10.0, category: "Mains" },
        { name: "Caesar Salad", price: 6.5, category: "Starters" },
        { name: "Spring Rolls", price: 4.5, category: "Starters" },
        { name: "Tom Yum Soup", price: 5.5, category: "Starters" },
        { name: "French Fries", price: 3.5, category: "Sides" },
        { name: "Garlic Bread", price: 3.0, category: "Sides" },
        { name: "Iced Tea", price: 2.0, category: "Drinks" },
        { name: "Fresh Orange Juice", price: 3.0, category: "Drinks" },
        { name: "Coffee", price: 2.5, category: "Drinks" },
        { name: "Mango Sticky Rice", price: 4.0, category: "Desserts" },
        { name: "Ice Cream", price: 3.0, category: "Desserts" },
      ],
    });
  }
  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
