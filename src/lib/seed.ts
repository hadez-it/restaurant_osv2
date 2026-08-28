import bcrypt from "bcryptjs";
import { prisma } from "./db";

export async function ensureSeeded() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const password = await bcrypt.hash("password123", 10);
  await prisma.user.createMany({
    data: [
      { username: "admin", name: "Owner", role: "ADMIN", password },
      { username: "waiter", name: "Waiter One", role: "WAITER", password },
      { username: "kitchen", name: "Kitchen One", role: "KITCHEN", password },
      { username: "cashier", name: "Cashier One", role: "CASHIER", password },
    ],
    skipDuplicates: true,
  });

  const tableCount = await prisma.table.count();
  if (tableCount === 0) {
    await prisma.table.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({ name: `Table ${i + 1}`, seats: 4 })),
      skipDuplicates: true,
    });
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
      skipDuplicates: true,
    });
  }
}
