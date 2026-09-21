import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { calculateKPIs, getTopEntities, getBusinessAnomalies, getMonthlySalesTrend, db } from './analytics';
import { FilterState } from './types';

// تعریف ابزارها برای Gemini تا مستقیماً محاسبات را فرابخواند
export const analyticsTools: FunctionDeclaration[] = [
  {
    name: 'getKPIs',
    description: 'دریافت شاخص‌های کلیدی فروش شامل فروش خالص، تعداد سفارش‌ها، میانگین فاکتور و مشتریان فعال',
    parameters: {
      type: Type.OBJECT,
      properties: {
        startDate: { type: Type.STRING, description: 'تاریخ شروع مثل 1997-01-01' },
        endDate: { type: Type.STRING, description: 'تاریخ پایان مثل 1997-12-31' },
        country: { type: Type.STRING, description: 'کشور مقصد' }
      }
    }
  },
  {
    name: 'getTopProductsAndCustomers',
    description: 'دریافت لیست ۵ محصول پرفروش و ۵ مشتری برتر بر اساس مبلغ فروش',
    parameters: {
      type: Type.OBJECT,
      properties: {
        country: { type: Type.STRING, description: 'فیلتر کشور' }
      }
    }
  },
  {
    name: 'getBusinessAnomalies',
    description: 'دریافت گزارش سفارش‌های با تاخیر ارسال و کالاهای بحرانی انبار',
    parameters: { type: Type.OBJECT, properties: {} }
  }
];

// اجرای سمت سرور تابع فراخوانی‌شده توسط مدل
export async function executeTool(name: string, args: Record<string, any>) {
  const filters: FilterState = {
    startDate: args.startDate,
    endDate: args.endDate,
    country: args.country
  };

  switch (name) {
    case 'getKPIs':
      return calculateKPIs(filters);
    case 'getTopProductsAndCustomers':
      return getTopEntities(filters);
    case 'getBusinessAnomalies':
      return getBusinessAnomalies(filters);
    default:
      return { error: 'تابع درخواستی تعریف نشده است.' };
  }
}

// ساخت نمونه کلاینت در زمان اجرا (Run-time Lazy Init)
export function getGeminiInstance() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}
