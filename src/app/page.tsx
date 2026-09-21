'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  Filter,
  Bot,
  X,
  Send,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, formatNumber, formatDateFa } from '@/lib/utils';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function ModirYarDashboard() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // فیلترها
  const [country, setCountry] = useState<string>('');
  const [categoryID, setCategoryID] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // مودال Drill-down
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // چت
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'سلام! من مدیریار هستم. می‌توانید درباره روند فروش، مشتریان، کالاهای پرفروش یا تأخیرها سؤال بپرسید.' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (country) params.append('country', country);
      if (categoryID) params.append('categoryID', categoryID);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات تحلیلی');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [country, categoryID, startDate, endDate]);

  const handleOpenOrder = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setDrilldownLoading(true);
    try {
      const res = await fetch(`/api/analytics?orderId=${orderId}`);
      if (res.ok) {
        const json = await res.json();
        setDrilldownData(json);
      }
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || chatLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    if (!textToSend) setInputMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          activeFilters: { country, categoryID, startDate, endDate },
        }),
      });
      const resJson = await res.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: resJson.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'خطا در اتصال به موتور هوش مصنوعی. لطفاً دوباره تلاش کنید.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800" dir="rtl">
      {/* هدر */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            م
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">مدیریار | هوش تجاری سازمانی</h1>
            <p className="text-xs text-slate-500">
              تحلیل عملیاتی Northwind • تاریخ مرجع: {data ? formatDateFa(data.kpis.referenceDate) : '...'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(true)}
          className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Bot className="w-4 h-4" />
          <span>مشاور هوشمند</span>
        </button>
      </header>

      {/* فیلترها */}
      <section className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Filter className="w-4 h-4" />
          <span>فیلترها:</span>
        </div>

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-xs focus:outline-none"
        >
          <option value="">همه کشورها</option>
          {data?.entities?.countries?.map((c: string) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={categoryID}
          onChange={(e) => setCategoryID(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-xs focus:outline-none"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {data?.entities?.categories?.map((cat: any) => (
            <option key={cat.categoryID} value={cat.categoryID}>{cat.categoryName}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>از:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>تا:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-slate-50"
          />
        </div>

        {(country || categoryID || startDate || endDate) && (
          <button
            onClick={() => { setCountry(''); setCategoryID(''); setStartDate(''); setEndDate(''); }}
            className="text-xs text-red-600 hover:underline mr-auto"
          >
            پاک کردن فیلترها
          </button>
        )}
      </section>

      {/* محتوا */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {loading && !data && (
          <div className="py-20 text-center text-slate-500">در حال دریافت داده‌های تحلیلی...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">فروش خالص (پس از کسر تخفیف)</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.kpis.totalNetSales)}</p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مبتنی بر اقلام فاکتور</span>
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">تعداد سفارش‌های متمایز</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(data.kpis.totalOrders)}</p>
                  <p className="text-xs text-slate-500 mt-1">تعداد اقلام: {formatNumber(data.kpis.totalItemsCount)}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">میانگین ارزش سبد (AOV)</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.kpis.averageOrderValue)}</p>
                  <p className="text-xs text-slate-500 mt-1">مشتریان فعال: {formatNumber(data.kpis.activeCustomersCount)}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">سفارش‌های با تأخیر در ارسال</p>
                  <p className="text-2xl font-bold text-red-600">{formatNumber(data.kpis.delayedOrdersCount)}</p>
                  <p className="text-xs text-red-500 mt-1">ShippedDate &gt; RequiredDate</p>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* نمودارها (با گارد mounted جهت تضمین عدم کرش هیدراتاسیون) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4">روند ماهانه فروش</h2>
                <div className="h-72 w-full">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.salesTrend}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip formatter={(val: any) => [formatCurrency(val), 'فروش']} />
                        <Area type="monotone" dataKey="netSales" stroke="#2563eb" fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">در حال آماده‌سازی نمودار...</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h2 className="text-base font-bold text-slate-900 mb-4">سهم دسته‌بندی‌ها</h2>
                <div className="h-56 w-full flex-1">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categorySales}
                          dataKey="netSales"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                        >
                          {data.categorySales.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => formatCurrency(val)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">در حال آماده‌سازی نمودار...</div>
                  )}
                </div>
              </div>
            </div>

            {/* ناهنجاری‌ها و برترین‌ها */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm mb-3">۵ کالای برتر در درآمد</h3>
                <div className="space-y-2 text-xs">
                  {data.topProducts.map((p: any, i: number) => (
                    <div key={p.productID} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700">{i + 1}. {p.productName}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(p.totalSales)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm mb-3">۵ مشتری با بیشترین خرید</h3>
                <div className="space-y-2 text-xs">
                  {data.topCustomers.map((c: any, i: number) => (
                    <div key={c.customerID} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700">{i + 1}. {c.companyName}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(c.totalSales)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm mb-3 text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>بیشترین تأخیر ارسال</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {data.anomalies.delayed.slice(0, 4).map((d: any) => (
                    <div
                      key={d.orderID}
                      onClick={() => handleOpenOrder(d.orderID)}
                      className="p-2 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer flex justify-between items-center transition"
                    >
                      <span>سفارش #{d.orderID} ({d.customerName})</span>
                      <span className="font-bold text-red-700">{d.delayDays} روز تأخیر</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* جدول ۱۰ سفارش اخیر همراه با باز کردن جزئیات */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">آخرین سفارش‌ها (جهت Drill-down روی هر ردیف کلیک کنید)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">شماره</th>
                      <th className="py-2.5 px-3">مشتری</th>
                      <th className="py-2.5 px-3">تاریخ ثبت</th>
                      <th className="py-2.5 px-3">مهلت تحویل</th>
                      <th className="py-2.5 px-3">کشور</th>
                      <th className="py-2.5 px-3">کرایه حمل</th>
                      <th className="py-2.5 px-3 text-center">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentOrders.map((ord: any) => (
                      <tr
                        key={ord.orderID}
                        onClick={() => handleOpenOrder(ord.orderID)}
                        className="hover:bg-blue-50/60 cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">#{ord.orderID}</td>
                        <td className="py-2.5 px-3 font-medium">{ord.shipName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{formatDateFa(ord.orderDate)}</td>
                        <td className="py-2.5 px-3 text-slate-500">{formatDateFa(ord.requiredDate)}</td>
                        <td className="py-2.5 px-3">{ord.shipCountry}</td>
                        <td className="py-2.5 px-3 font-mono">${ord.freight.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center text-blue-600">
                          <ExternalLink className="w-3.5 h-3.5 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* مودال فاکتور (Drill-down) */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 max-h-[85vh] overflow-y-auto shadow-2xl relative text-xs">
            <button
              onClick={() => { setSelectedOrderId(null); setDrilldownData(null); }}
              className="absolute left-4 top-4 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {drilldownLoading || !drilldownData ? (
              <div className="py-12 text-center text-slate-500">در حال دریافت اقلام فاکتور...</div>
            ) : (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-base font-bold text-slate-900">جزئیات فاکتور سفارش #{drilldownData.order.orderID}</h3>
                  <p className="text-slate-500 mt-1">مشتری: {drilldownData.customer?.companyName} ({drilldownData.customer?.country})</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-slate-600">
                  <p>تاریخ ثبت: {formatDateFa(drilldownData.order.orderDate)}</p>
                  <p>تحویل: {formatDateFa(drilldownData.order.shippedDate)}</p>
                  <p>شرکت حمل: {drilldownData.shipper?.companyName}</p>
                  <p>هزینه باربری: ${drilldownData.order.freight.toFixed(2)}</p>
                </div>

                <table className="w-full text-right border">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-1.5">کالا</th>
                      <th className="p-1.5">فی</th>
                      <th className="p-1.5">تعداد</th>
                      <th className="p-1.5">تخفیف</th>
                      <th className="p-1.5">مبلغ نهایی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {drilldownData.items.map((it: any, i: number) => (
                      <tr key={i}>
                        <td className="p-1.5 font-medium">{it.productName}</td>
                        <td className="p-1.5">${it.unitPrice.toFixed(2)}</td>
                        <td className="p-1.5">{it.quantity}</td>
                        <td className="p-1.5">{(it.discount * 100).toFixed(0)}%</td>
                        <td className="p-1.5 font-bold">${it.extendedPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg font-bold text-sm text-blue-900">
                  <span>جمع کل خالص فاکتور:</span>
                  <span className="text-base font-mono">${drilldownData.netTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* دراور چت هوش مصنوعی */}
      {isChatOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-80 md:w-96 bg-white shadow-2xl border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">مشاور تحلیلی مدیریار</h3>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white mr-auto'
                    : 'bg-slate-100 text-slate-800 ml-auto whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div className="p-2.5 bg-slate-100 rounded-xl max-w-[80%] text-slate-400 animate-pulse">
                در حال محاسبه و بررسی داده‌ها...
              </div>
            )}
          </div>

          <div className="p-2 border-t flex gap-1 bg-slate-50 overflow-x-auto text-[10px]">
            <button onClick={() => handleSendMessage('فروش کل و سفارشات چقدر است؟')} className="p-1 bg-white border rounded">
              📊 خلاصه فروش
            </button>
            <button onClick={() => handleSendMessage('سفارش‌های دارای بیشترین تأخیر کدامند؟')} className="p-1 bg-white border rounded">
              ⚠️ سفارش‌های معوق
            </button>
          </div>

          <div className="p-2 border-t flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="سؤال خود را بپرسید..."
              className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={chatLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
