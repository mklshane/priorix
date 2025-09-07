import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Sora } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import ToastProvider from "@/components/providers/ToastProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Priorix",
  description:
    "Priorix – Your productivity companion for managing tasks, study sessions, and personal growth efficiently.",

  icons: {
    icon: [
      { url: "/icon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
  },

  openGraph: {
    title: "Priorix",
    description:
      "Priorix – Your productivity companion for managing tasks, study sessions, and personal growth efficiently.",
    url: "https://priorix.vercel.app/",
    siteName: "Priorix",
    images: [
      {
        url: "https://priorix.vercel.app/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Priorix – Productivity App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${sora.variable} antialiased`}
      >
        <ToastProvider />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
