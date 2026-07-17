// =============================================
// ルートレイアウト
// アプリ全体に共通するHTML構造を定義します
// =============================================
import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// 日本語フォントを使用
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "スタンプラリー | 月次目標達成アプリ",
  description: "毎月の目標を設定して、達成をスタンプで記録しよう！",
};

// スマホ表示の最適化
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
