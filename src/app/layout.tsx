import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TCS RestaurantOS • Hospitality Operating System",
  description: "Next-generation floor management, high-speed waiter ordering, kitchen display system (KDS), and cashier register.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-obsidian-950 text-zinc-100 selection:bg-amber-500/25 selection:text-amber-200 min-h-[100dvh] flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
