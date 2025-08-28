import type { Metadata } from "next";
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
  title: "Free YouTube Subtitle & AI Video Summarizer",
  description:
    "Paste a YouTube link and instantly generate subtitles with AI-powered video summarizer. Simple, fast, and free.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  other: {
    "google-site-verification": "79YkN7Gc3vZ8t5dvAcUZO-HrLL2v1iR7y2N6JxDzMnY",
  },
  openGraph: {
    title: "AI YouTube Subtitle Summarizer",
    description:
      "Summarize YouTube videos and generate subtitles instantly with AI. Just paste a link and get a summary.",

    url: "https://next-ai-subtitle-summarizer.vercel.app/",
    siteName: "AI YouTube Subtitle Summarizer",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "YouTube AI Subtitle Summarizer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI YouTube Subtitle Summarizer",
    description:
      "Summarize YouTube videos instantly with AI and get subtitles. 100% free.",
    images: ["/logo.svg"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
