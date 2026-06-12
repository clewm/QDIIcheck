import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "QDII Watch - 基金申购限额监控",
  description: "每日自动监控 QDII 基金申购状态与限额变化，第一时间推送通知",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QDII Watch",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col">
          {children}
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
