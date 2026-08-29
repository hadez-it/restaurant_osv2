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
}
