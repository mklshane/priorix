import type { Metadata } from "next";
import { Outfit, Instrument_Serif } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/contexts/ClientProviders";

// 1. Clean, geometric sans-serif for the main UI
const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

// 2. Playful, editorial serif for the large headings
const instrumentSerif = Instrument_Serif({
  variable: "--font-editorial",
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Priorix",
  description:
    "Priorix – Your playful productivity companion for managing tasks, study sessions, and personal growth efficiently.",
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
      <head>
        <meta
          name="google-site-verification"
          content="fLVA7x1V2HOU8rArI_1pRCJ3Pma7Et6VVN0XA5otGpU"
        />
      </head>
      {/* Inject the new font variables into the body */}
      <body
        className={`${outfit.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
