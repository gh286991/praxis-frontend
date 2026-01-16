import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReduxProvider } from "@/lib/store/ReduxProvider";
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
  title: {
    default: "Praxis - AI 程式測驗平台",
    template: "%s | Praxis",
  },
  description: "Praxis 是一個 AI 驅動的程式測驗平台，提供無限練習題庫、即時程式執行、進度追蹤等功能，幫助您準備各類程式設計認證考試。",
  keywords: ["程式設計", "Python", "AI", "測驗", "題庫", "TQC", "認證考試", "程式練習", "coding practice"],
  authors: [{ name: "Praxis Team" }],
  creator: "Praxis",
  publisher: "Praxis",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://praxis.app",
    siteName: "Praxis",
    title: "Praxis - AI 驅動的程式測驗平台",
    description: "AI 驅動的程式測驗平台，提供無限練習題庫、即時程式執行、進度追蹤等功能。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Praxis - AI 程式測驗平台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Praxis - AI 驅動的程式測驗平台",
    description: "AI 驅動的程式測驗平台，提供無限練習題庫、即時程式執行、進度追蹤等功能。",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
