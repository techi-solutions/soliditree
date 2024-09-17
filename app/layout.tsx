import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cookieToInitialState } from "wagmi";
import { headers } from "next/headers";
import { config } from "@/services/walletConnect/config";
import Web3ModalProvider from "@/services/walletConnect/context";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Soliditree",
  description: "An interface for your smart contracts",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config, headers().get("cookie"));
  return (
    <html lang="en">
      <meta name="theme-color" content="#0f766e" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-teal-700 via-emerald-600 to-green-500`}
      >
        <Web3ModalProvider initialState={initialState}>
          {children}
        </Web3ModalProvider>
        <Analytics />
      </body>
    </html>
  );
}
