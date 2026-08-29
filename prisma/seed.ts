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

  const orderCount = await prisma.order.count();
  if (orderCount === 0) {
    const waiter = await prisma.user.findFirst({ where: { role: "WAITER" } });
    const tables = await prisma.table.findMany({ take: 6 });
    const menuItems = await prisma.menuItem.findMany();

    if (waiter && tables.length > 0 && menuItems.length >= 5) {
      const now = new Date();
      const mockSales = [
        {
          tableId: tables[0].id,
          waiterId: waiter.id,
          status: "PAID",
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
          items: [
            { menuItemId: menuItems[0].id, qty: 2, price: menuItems[0].price },
            { menuItemId: menuItems[1].id, qty: 1, price: menuItems[1].price },
            { menuItemId: menuItems[4].id, qty: 2, price: menuItems[4].price },
          ],
        },
        {
          tableId: tables[1 % tables.length].id,
          waiterId: waiter.id,
          status: "PAID",
          createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 4.2 * 60 * 60 * 1000),
          items: [
            { menuItemId: menuItems[2].id, qty: 1, price: menuItems[2].price },
            { menuItemId: menuItems[3].id, qty: 1, price: menuItems[3].price },
          ],
        },
        {
          tableId: tables[2 % tables.length].id,
          waiterId: waiter.id,
          status: "PAID",
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
          items: [
            { menuItemId: menuItems[0].id, qty: 3, price: menuItems[0].price },
            { menuItemId: menuItems[5 % menuItems.length].id, qty: 2, price: menuItems[5 % menuItems.length].price },
          ],
        },
        {
          tableId: tables[3 % tables.length].id,
          waiterId: waiter.id,
          status: "PAID",
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
          items: [
            { menuItemId: menuItems[1].id, qty: 2, price: menuItems[1].price },
            { menuItemId: menuItems[2].id, qty: 2, price: menuItems[2].price },
          ],
        },
        {
          tableId: tables[4 % tables.length].id,
          waiterId: waiter.id,
          status: "PAID",
          createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          items: [
            { menuItemId: menuItems[3].id, qty: 4, price: menuItems[3].price },
            { menuItemId: menuItems[4].id, qty: 4, price: menuItems[4].price },
          ],
        },
      ];

      for (const sale of mockSales) {
        const order = await prisma.order.create({
          data: {
            tableId: sale.tableId,
            waiterId: sale.waiterId,
            status: sale.status,
            createdAt: sale.createdAt,
            paidAt: sale.paidAt,
          },
        });
        for (const it of sale.items) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              menuItemId: it.menuItemId,
              qty: it.qty,
              price: it.price,
            },
          });
        }
      }
    }
  }
  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
