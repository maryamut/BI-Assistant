import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مدیریار | داشبورد هوشمند تحلیل کسب‌وکار',
  description: 'نسخه نمایشی هوشمند تحلیل داده‌های Northwind آماده استقرار در Vercel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
