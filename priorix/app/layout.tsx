import type { Metadata } from "next";
import { Outfit, Instrument_Serif } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/contexts/ClientProviders";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Priorix | AI Flashcard App for Spaced Repetition",
    template: "%s | Priorix",
  },
  description:
    "Priorix helps students learn faster with AI-powered flashcards, spaced repetition, notes, and study analytics.",
  keywords: [
    "flashcard app",
    "AI flashcard generator",
    "spaced repetition",
    "study planner",
    "study analytics",
    "student productivity app",
  ],
  icons: {
    icon: [
      { url: "/icon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Priorix | AI Flashcard App for Spaced Repetition",
    description:
      "Learn smarter with adaptive spaced repetition, AI flashcard generation, and student-friendly study tools.",
    url: siteUrl,
    siteName: "Priorix",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Priorix AI flashcard and study platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Priorix | AI Flashcard App for Spaced Repetition",
    description:
      "AI flashcards, spaced repetition, and study analytics for students.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
