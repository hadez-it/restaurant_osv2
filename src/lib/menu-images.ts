/**
 * Curated high-resolution food photography URLs (optimized via Unsplash CDN)
 * Used as primary mock data and intelligent fallbacks for menu items.
 */

export const FALLBACK_FOOD_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' fill='%23181d27'%3E%3Crect width='600' height='400' fill='%23181d27'/%3E%3Ccircle cx='300' cy='180' r='60' fill='%2327272a' stroke='%233f3f46' stroke-width='4'/%3E%3Cpath d='M280 180h40M300 160v40' stroke='%2371717a' stroke-width='4' stroke-linecap='round'/%3E%3Ctext x='50%25' y='72%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='16' font-weight='bold' fill='%2371717a'%3EDelicious Dish%3C/text%3E%3C/svg%3E";

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  Mains:
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", // Steak & ribs
  Starters:
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80", // Crispy starters
  Sides:
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", // French fries
  Drinks:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", // Refreshing beverage
  Beverages:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", // Beverages
  Desserts:
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80", // Cake / dessert
  General:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80", // General gourmet food
};

export const DISH_IMAGES_BY_NAME: Record<string, string> = {
  // Mains
  "Margherita Pizza":
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80",
  "Pepperoni Pizza":
    "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80",
  "Truffle Mushroom Pizza":
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  "Chicken Burger":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  "Wagyu Truffle Burger":
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
  "Classic Cheeseburger":
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
  "Pad Thai":
    "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80",
  "Japanese Tonkotsu Ramen":
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
  "Grilled Salmon Fillet":
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
  "Spaghetti Carbonara":
    "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80",
  "Sushi Moriawase":
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
  "Ribeye Steak":
    "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80",

  // Starters
  "Caesar Salad":
    "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80",
  "Spring Rolls":
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  "Tom Yum Soup":
    "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=600&q=80",
  "Crispy Calamari":
    "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=600&q=80",
  "Buffalo Wings":
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
  "Tomato Basil Bruschetta":
    "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80",

  // Sides
  "French Fries":
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
  "Garlic Bread":
    "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80",
  "Truffle Parmesan Fries":
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
  "Crispy Onion Rings":
    "https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=600&q=80",

  // Drinks
  "Iced Tea":
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
  "Fresh Orange Juice":
    "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
  Coffee:
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
  "Iced Caramel Latte":
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
  "Passionfruit Mojito Mocktail":
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
  "Berry Lemonade":
    "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80",

  // Desserts
  "Mango Sticky Rice":
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80",
  "Ice Cream":
    "https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&w=600&q=80",
  "Classic Tiramisu":
    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
  "Chocolate Lava Cake":
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
  "New York Cheesecake":
    "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
};

/**
 * Resolves a reliable, high-resolution food image for any menu item.
 * Priority:
 * 1. item.image (if explicitly provided)
 * 2. Exact match in DISH_IMAGES_BY_NAME
 * 3. Partial keyword match (e.g. "burger", "pizza", "fries", "salad", "coffee")
 * 4. Category fallback from DEFAULT_CATEGORY_IMAGES
 * 5. General gourmet food fallback
 */
export function getMenuItemImage(item: {
  name?: string;
  category?: string;
  image?: string | null;
}): string {
  if (item.image && item.image.trim().length > 0) {
    return item.image;
  }

  const name = item.name?.trim() || "";

  if (DISH_IMAGES_BY_NAME[name]) {
    return DISH_IMAGES_BY_NAME[name];
  }

  // Keyword heuristic
  const lower = name.toLowerCase();
  if (lower.includes("pizza")) return DISH_IMAGES_BY_NAME["Margherita Pizza"];
  if (lower.includes("burger")) return DISH_IMAGES_BY_NAME["Chicken Burger"];
  if (lower.includes("steak") || lower.includes("beef") || lower.includes("ribeye"))
    return DISH_IMAGES_BY_NAME["Ribeye Steak"];
  if (lower.includes("salmon") || lower.includes("fish"))
    return DISH_IMAGES_BY_NAME["Grilled Salmon Fillet"];
  if (lower.includes("pasta") || lower.includes("spaghetti") || lower.includes("carbonara"))
    return DISH_IMAGES_BY_NAME["Spaghetti Carbonara"];
  if (lower.includes("sushi") || lower.includes("sashimi"))
    return DISH_IMAGES_BY_NAME["Sushi Moriawase"];
  if (lower.includes("noodle") || lower.includes("ramen"))
    return DISH_IMAGES_BY_NAME["Japanese Tonkotsu Ramen"];
  if (lower.includes("salad")) return DISH_IMAGES_BY_NAME["Caesar Salad"];
  if (lower.includes("soup")) return DISH_IMAGES_BY_NAME["Tom Yum Soup"];
  if (lower.includes("fries")) return DISH_IMAGES_BY_NAME["French Fries"];
  if (lower.includes("wing")) return DISH_IMAGES_BY_NAME["Buffalo Wings"];
  if (lower.includes("coffee") || lower.includes("latte") || lower.includes("espresso"))
    return DISH_IMAGES_BY_NAME["Coffee"];
  if (lower.includes("tea")) return DISH_IMAGES_BY_NAME["Iced Tea"];
  if (lower.includes("juice")) return DISH_IMAGES_BY_NAME["Fresh Orange Juice"];
  if (lower.includes("cake")) return DISH_IMAGES_BY_NAME["Chocolate Lava Cake"];
  if (lower.includes("ice cream") || lower.includes("gelato"))
    return DISH_IMAGES_BY_NAME["Ice Cream"];

  // Category fallback
  if (item.category && DEFAULT_CATEGORY_IMAGES[item.category]) {
    return DEFAULT_CATEGORY_IMAGES[item.category];
  }

  return DEFAULT_CATEGORY_IMAGES.General;
}

/**
 * Rich mock catalog items with curated images, prices, and categories.
 */
export const MOCK_MENU_ITEMS = [
  // Mains
  {
    name: "Margherita Pizza",
    price: 12.5,
    category: "Mains",
    image: DISH_IMAGES_BY_NAME["Margherita Pizza"],
  },
  {
    name: "Wagyu Truffle Burger",
    price: 16.0,
    category: "Mains",
    image: DISH_IMAGES_BY_NAME["Wagyu Truffle Burger"],
  },
  {
    name: "Spaghetti Carbonara",
    price: 14.5,
    category: "Mains",
    image: DISH_IMAGES_BY_NAME["Spaghetti Carbonara"],
  },
  {
    name: "Japanese Tonkotsu Ramen",
    price: 13.5,
    category: "Mains",
    image: DISH_IMAGES_BY_NAME["Japanese Tonkotsu Ramen"],
  },
  {
    name: "Grilled Salmon Fillet",
    price: 18.5,
    category: "Mains",
    image: DISH_IMAGES_BY_NAME["Grilled Salmon Fillet"],
  },
  {
    name: "Pad Thai",
    price: 11.0,
    category: "Mains",
    image: DISH_IMAGES_BY_NAME["Pad Thai"],
  },

  // Starters
  {
    name: "Caesar Salad",
    price: 8.5,
    category: "Starters",
    image: DISH_IMAGES_BY_NAME["Caesar Salad"],
  },
  {
    name: "Crispy Calamari",
    price: 9.5,
    category: "Starters",
    image: DISH_IMAGES_BY_NAME["Crispy Calamari"],
  },
  {
    name: "Tomato Basil Bruschetta",
    price: 7.0,
    category: "Starters",
    image: DISH_IMAGES_BY_NAME["Tomato Basil Bruschetta"],
  },
  {
    name: "Buffalo Wings",
    price: 10.0,
    category: "Starters",
    image: DISH_IMAGES_BY_NAME["Buffalo Wings"],
  },
  {
    name: "Tom Yum Soup",
    price: 8.0,
    category: "Starters",
    image: DISH_IMAGES_BY_NAME["Tom Yum Soup"],
  },

  // Sides
  {
    name: "Truffle Parmesan Fries",
    price: 6.5,
    category: "Sides",
    image: DISH_IMAGES_BY_NAME["Truffle Parmesan Fries"],
  },
  {
    name: "Garlic Bread",
    price: 4.5,
    category: "Sides",
    image: DISH_IMAGES_BY_NAME["Garlic Bread"],
  },
  {
    name: "Crispy Onion Rings",
    price: 5.5,
    category: "Sides",
    image: DISH_IMAGES_BY_NAME["Crispy Onion Rings"],
  },

  // Drinks
  {
    name: "Iced Caramel Latte",
    price: 5.0,
    category: "Drinks",
    image: DISH_IMAGES_BY_NAME["Iced Caramel Latte"],
  },
  {
    name: "Passionfruit Mojito Mocktail",
    price: 6.0,
    category: "Drinks",
    image: DISH_IMAGES_BY_NAME["Passionfruit Mojito Mocktail"],
  },
  {
    name: "Berry Lemonade",
    price: 4.5,
    category: "Drinks",
    image: DISH_IMAGES_BY_NAME["Berry Lemonade"],
  },
  {
    name: "Fresh Orange Juice",
    price: 4.0,
    category: "Drinks",
    image: DISH_IMAGES_BY_NAME["Fresh Orange Juice"],
  },

  // Desserts
  {
    name: "Classic Tiramisu",
    price: 7.5,
    category: "Desserts",
    image: DISH_IMAGES_BY_NAME["Classic Tiramisu"],
  },
  {
    name: "Chocolate Lava Cake",
    price: 8.0,
    category: "Desserts",
    image: DISH_IMAGES_BY_NAME["Chocolate Lava Cake"],
  },
  {
    name: "Mango Sticky Rice",
    price: 6.5,
    category: "Desserts",
    image: DISH_IMAGES_BY_NAME["Mango Sticky Rice"],
  },
  {
    name: "New York Cheesecake",
    price: 7.0,
    category: "Desserts",
    image: DISH_IMAGES_BY_NAME["New York Cheesecake"],
  },
];
