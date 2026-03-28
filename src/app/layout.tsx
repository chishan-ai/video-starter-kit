import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mozoria - AI Storyboard Studio for Anime Creators",
  description:
    "Turn scripts into anime shot by shot. AI-powered storyboard editor with character consistency, video generation, and voiceover. All in one place.",
  metadataBase: new URL("https://mozoria.com"),
  openGraph: {
    title: "Mozoria - AI Storyboard Studio for Anime Creators",
    description:
      "Turn scripts into anime shot by shot. AI-powered storyboard editor with character consistency, video generation, and voiceover.",
    siteName: "Mozoria",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mozoria - AI Storyboard Studio for Anime Creators",
    description:
      "Turn scripts into anime shot by shot. AI storyboard editor with character consistency, video generation, and voiceover.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased dark`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
