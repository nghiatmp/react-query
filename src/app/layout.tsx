import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bếp nhà — Công thức & thực đơn tuần",
  description: "Lưu công thức ngon, lên thực đơn tuần và chuẩn bị danh sách đi chợ.",
};

// layout.tsx là SERVER component (mặc định) - không cần "use client".
// Providers (client) được đặt bên trong để cung cấp QueryClient cho cả cây.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
