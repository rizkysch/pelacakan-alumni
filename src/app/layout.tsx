import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// IMPORT PROVIDER BARU
import { TrackingProvider } from "@/context/TrackingContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alumni Tracer Engine - Rizky Maulana",
  description: "Sistem Pelacakan Alumni Terintegrasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* BUNGKUS DENGAN TRACKING PROVIDER */}
        <TrackingProvider>
          {children}
        </TrackingProvider>
      </body>
    </html>
  );
}