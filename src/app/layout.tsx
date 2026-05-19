import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "./components/TopNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "智聘 Copilot — AI 招聘决策助手",
  description: "面向中小企业的一站式 AI 招聘系统",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full flex flex-col text-[#2d2a26]" style={{ background: 'linear-gradient(135deg, #faf9f7 0%, #f3f0eb 50%, #faf9f7 100%)' }}>
        <TopNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </body>
    </html>
  );
}
