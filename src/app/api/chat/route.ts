import { NextRequest, NextResponse } from 'next/server';
import { getGeminiInstance, analyticsTools, executeTool } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ai = getGeminiInstance();
    if (!ai) {
      return NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message: 'کلید وب‌سرویس GEMINI_API_KEY در تنظیمات پروژه (Environment Variables) تعریف نشده است.'
        },
        { status: 503 }
      );
    }

    const { messages, currentFilters } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'پیامی ارسال نشده است.' }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1].content;
    if (userMessage.length > 500) {
      return NextResponse.json({ error: 'طول پیام بیش از حد مجاز است.' }, { status: 400 });
    }

    const systemInstruction = `شما «مدیریار»، دستیار ارشد هوش تجاری و تصمیم‌گیری سازمانی برای دیتابیس Northwind هستید.
قوانین اکید:
۱. تمام پاسخ‌ها را به زبان فارسی رسمی، تحلیلی و شایسته مدیران ارشد ارائه دهید.
۲. تاریخ مرجع دیتابیس مه ۱۹۹۸ است.
۳. هیچ عددی را حدس نزنید و ابداع نکنید؛ حتماً از ابزارهای محاسباتی تعبیه‌شده برای واکشی آمار استفاده کنید.
۴. فیلتر جاری اعمال‌شده توسط کاربر عبارت است از: ${JSON.stringify(currentFilters || {})}.
۵. نتایج را با بینش کسب‌وکاری و پیشنهادات اجرایی خلاصه و مستدل سازید.`;

    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: analyticsTools }]
      }
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolResult = await executeTool(call.name, call.args);

      // ارسال نتیجه تابع به مدل جهت دریافت تحلیل نهایی
      const secondResponse = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ functionCall: call }] },
          {
            role: 'tool',
            parts: [
              {
                functionResponse: {
                  name: call.name,
                  response: { result: toolResult }
                }
              }
            ]
          }
        ],
        config: { systemInstruction }
      });

      return NextResponse.json({
        reply: secondResponse.text,
        toolCalled: call.name,
        toolResult
      });
    }

    return NextResponse.json({
      reply: response.text || 'پاسخی برای این سوال دریافت نشد.'
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'خطا در برقراری ارتباط با مدل هوش مصنوعی.' },
      { status: 500 }
    );
  }
}
