import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小商家智能客服",
  description: "让每个小店都拥有一个24小时在线的智能客服",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
