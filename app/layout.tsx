import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "حسابچی | مدیریت هزینه و سود",
  description: "مدیریت هزینه‌ها، محاسبه قیمت تمام‌شده و بررسی سود کسب‌وکار شما",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
