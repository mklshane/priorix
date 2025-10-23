import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Sora } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/contexts/ClientProviders";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta
        name="google-site-verification"
        content="fLVA7x1V2HOU8rArI_1pRCJ3Pma7Et6VVN0XA5otGpU"
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${sora.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
