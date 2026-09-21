import { NextRequest, NextResponse } from 'next/server';
import {
  calculateKPIs,
  getTopProducts,
  getTopCustomers,
  getOperationalAnomalies,
  REFERENCE_DATE,
} from '@/lib/analytics';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        reply: '⚠️ کلید اتصال به هوش مصنوعی (GEMINI_API_KEY) در تنظیمات Vercel ثبت نشده است. داشبورد و نمودارها به درستی کار می‌کنند؛ برای فعال شدن چت هوشمند، کلید خود را در تب Settings > Environment Variables در Vercel وارد کنید.',
        requiresKey: true,
      });
    }

    const { message, activeFilters } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'پیام نامعتبر است' }, { status: 400 });
    }

    // استخراج شاخص‌ها و اطلاعات واقعی برای هوش مصنوعی
    const kpis: any = calculateKPIs(activeFilters || {});
    const topProds: any[] = getTopProducts(activeFilters || {}, 5);
    const topCusts: any[] = getTopCustomers(activeFilters || {}, 5);
    const anomalies: any = getOperationalAnomalies();

    const promptContext = `
شما «مدیریار»، مشاور ارشد هوش تجاری سازمان بر روی داده‌های Northwind هستید.
تاریخ مرجع کنونی داده‌ها: ${REFERENCE_DATE}.
فیلترهای انتخابی کاربر: ${JSON.stringify(activeFilters || {})}.

آمار دقیق و واقعی دیتابیس (بدون عددسازی):
- فروش خالص کل: $${kpis.totalNetSales}
- تعداد سفارش‌ها: ${kpis.totalOrders}
- میانگین سبد خرید (AOV): $${kpis.averageOrderValue}
- تعداد مشتریان فعال: ${kpis.activeCustomersCount}
- سفارش‌های دارای تأخیر ارسال: ${kpis.delayedOrdersCount} مورد
- ۵ محصول برتر در فروش: ${topProds.map((p: any) => `${p.productName} ($${p.totalSales})`).join('، ')}
- ۵ مشتری برتر: ${topCusts.map((c: any) => `${c.companyName} ($${c.totalSales})`).join('، ')}
- سفارش‌های دارای بیشترین تأخیر: ${anomalies.delayed.map((d: any) => `سفارش #${d.orderID} با ${d.delayDays} روز تأخیر`).join('، ')}

پرسش کاربر: "${message}"

پاسخ را با لحن مدیریتی، حرفه‌ای، به زبان فارسی و با ارجاع دقیق به ارقام فوق بنویسید.
`;

    // فراخوانی مستقیم API رسمی Gemini بدون پکیج‌های واسطه
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptContext }],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API Error:', errText);
      return NextResponse.json({
        reply: 'متأسفانه در پاسخ‌دهی هوش مصنوعی خطایی رخ داد. لطفاً صحت کلید GEMINI_API_KEY را بررسی کنید.',
      });
    }

    const result: any = await geminiRes.json();
    const replyText =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      'پاسخی از مدل دریافت نشد.';

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat Handler Error:', error);
    return NextResponse.json(
      { reply: 'خطا در برقراری ارتباط با مشاور هوشمند.' },
      { status: 500 }
    );
  }
}
