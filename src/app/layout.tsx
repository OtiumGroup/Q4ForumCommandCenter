import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

// Self-hosted (no external font requests — Geist ships as static files
// inside the `geist` package, and Fraunces via @fontsource in globals.css).

export const metadata: Metadata = {
  title: {
    default: "EO Q4 Forum Command Center",
    template: "%s · EO Q4 Forum Command Center",
  },
  description:
    "The private hub for the EO Fort Worth Q4 Forum — meetings, events, member bios, resources, and more.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Q4 Command Center",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0E14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-center" />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
