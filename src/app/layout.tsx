import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FINTRAXIS — Institutional Corporate Financial Intelligence",
  description:
    "Institutional corporate credit risk surveillance terminal, auditable multi-period financial ledger, Basel III early-warning flags, and deterministic stress testing.",
  applicationName: "FINTRAXIS",
  authors: [{ name: "FINTRAXIS Risk Engineering" }],
  keywords: [
    "credit risk",
    "financial terminal",
    "solvency surveillance",
    "stress testing",
    "covenant compliance",
    "EBITDA leverage",
  ],
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "FINTRAXIS — Institutional Corporate Financial Intelligence",
    description:
      "Corporate credit risk surveillance terminal, auditable multi-period financial ledger, Basel III early-warning flags, and deterministic stress testing.",
    siteName: "FINTRAXIS Sovereign Terminal",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FINTRAXIS — Institutional Corporate Financial Intelligence",
    description:
      "Corporate credit risk surveillance terminal, auditable multi-period financial ledger, Basel III early-warning flags, and deterministic stress testing.",
  },
};

export const viewport: Viewport = {
  themeColor: "#070A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#070A0F] text-[#F8FAFC]`}
      >
        {children}
      </body>
    </html>
  );
}
