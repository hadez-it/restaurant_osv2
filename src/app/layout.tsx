import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('tcs_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'light');
                  var cl = document.documentElement.classList;
                  cl.remove('light', 'dark');
                  cl.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-obsidian-950 text-zinc-100 selection:bg-amber-500/25 selection:text-amber-200 min-h-[100dvh] flex flex-col transition-colors duration-200`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
