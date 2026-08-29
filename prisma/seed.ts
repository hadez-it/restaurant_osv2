import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

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

  const MOCK_DISHES = [
    // Mains
    { name: "Margherita Pizza", price: 12.5, category: "Mains" },
    { name: "Wagyu Truffle Burger", price: 16.0, category: "Mains" },
    { name: "Spaghetti Carbonara", price: 14.5, category: "Mains" },
    { name: "Japanese Tonkotsu Ramen", price: 13.5, category: "Mains" },
    { name: "Grilled Salmon Fillet", price: 18.5, category: "Mains" },
    { name: "Pad Thai", price: 11.0, category: "Mains" },
    { name: "Chicken Burger", price: 9.5, category: "Mains" },
    { name: "Ribeye Steak", price: 24.0, category: "Mains" },

    // Starters
    { name: "Caesar Salad", price: 8.5, category: "Starters" },
    { name: "Crispy Calamari", price: 9.5, category: "Starters" },
    { name: "Tomato Basil Bruschetta", price: 7.0, category: "Starters" },
    { name: "Buffalo Wings", price: 10.0, category: "Starters" },
    { name: "Tom Yum Soup", price: 8.0, category: "Starters" },
    { name: "Spring Rolls", price: 6.0, category: "Starters" },

    // Sides
    { name: "French Fries", price: 4.5, category: "Sides" },
    { name: "Truffle Parmesan Fries", price: 6.5, category: "Sides" },
    { name: "Garlic Bread", price: 4.0, category: "Sides" },
    { name: "Crispy Onion Rings", price: 5.5, category: "Sides" },

    // Drinks
    { name: "Iced Caramel Latte", price: 5.0, category: "Drinks" },
    { name: "Passionfruit Mojito Mocktail", price: 6.0, category: "Drinks" },
    { name: "Berry Lemonade", price: 4.5, category: "Drinks" },
    { name: "Fresh Orange Juice", price: 4.0, category: "Drinks" },
    { name: "Iced Tea", price: 3.0, category: "Drinks" },
    { name: "Coffee", price: 3.5, category: "Drinks" },

    // Desserts
    { name: "Classic Tiramisu", price: 7.5, category: "Desserts" },
    { name: "Chocolate Lava Cake", price: 8.0, category: "Desserts" },
    { name: "Mango Sticky Rice", price: 6.5, category: "Desserts" },
    { name: "New York Cheesecake", price: 7.0, category: "Desserts" },
    { name: "Ice Cream", price: 4.5, category: "Desserts" },
  ];

  for (const dish of MOCK_DISHES) {
    const exists = await prisma.menuItem.findFirst({ where: { name: dish.name } });
    if (!exists) {
      await prisma.menuItem.create({ data: dish });
    }
  }
  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
