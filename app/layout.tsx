import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PrivyProvider } from "@/components/providers/PrivyProvider";
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
  title: "Tidal - AI-Powered DeFi Yield Dashboard",
  description: "Your AI-managed tidal pool in the DeFi ocean. Navigate yields with an AI that explains every move.",
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
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
