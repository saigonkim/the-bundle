import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Bundle | 20대를 위한 스마트 ETF 큐레이션",
  description: "커피 한 잔의 가치로 시작하는 나만의 ETF 번들 구독 서비스. AI가 들려주는 쉬운 경제 이야기와 함께 건강한 투자 습관을 만드세요.",
  openGraph: {
    title: "The Bundle | 20대를 위한 스마트 ETF 큐레이션",
    description: "커피 한 잔의 가치로 시작하는 나만의 ETF 번들 구독 서비스. AI가 들려주는 쉬운 경제 이야기와 함께 건강한 투자 습관을 만드세요.",
    type: "website",
    locale: "ko_KR",
    url: "https://the-bundle-jade.vercel.app",
    siteName: "The Bundle",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Bundle - ETF Curation Service for 20s",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Bundle | 20대를 위한 스마트 ETF 큐레이션",
    description: "커피 한 잔의 가치로 시작하는 나만의 ETF 번들 구독 서비스.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
