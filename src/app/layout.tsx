import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider, themeInitScript } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Money Ledger", template: "%s · Money Ledger" },
  description: "A private ledger for every rupee that comes in and goes out, with clear monthly reports.",
  applicationName: "Money Ledger",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
