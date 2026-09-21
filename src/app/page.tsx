'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  Calendar,
  Filter,
  Bot,
  X,
  Send,
  ExternalLink,
  ChevronLeft,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, formatNumber, formatDateFa } from '@/lib/utils';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function ModirYarDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // وضعیت فیلترها
  const [country, setCountry] = useState<string>('');
  const [categoryID, setCategoryID] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // مودال Drill-down
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // پنل چت هوش مصنوعی
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'سلام! من مدیریار هستم. شما می‌توانید درباره عملکرد فروش، محصولات پرفروش، سفارش‌های دارای تأخیر یا آمار مشتریان از من بپرسید.' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // بارگذاری داده‌ها از API
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (country) params.append('country', country);
      if (categoryID) params.append('categoryID', categoryID);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('خطا در دریافت داده‌های تحلیلی');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [country, categoryID, startDate, endDate]);

  // باز کردن جزئیات سفارش
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

  // ارسال پیام به چت هوش مصنوعی
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || chatLoading) return;

    const userMsg = { sender: 'user' as const, text: query };
    setMessages((prev) => [...prev, userMsg]);
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
        { sender: 'bot', text: 'خطا در ارتباط با سرور چت. لطفاً اتصال اینترنت خود را بررسی کنید.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* هدر بالایی */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            م
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">مدیریار | هوش تجاری سازمانی</h1>
            <p className="text-xs text-slate-500">
              تحلیل داده‌های عملیاتی Northwind • تاریخ مرجع: {data ? formatDateFa(data.kpis.referenceDate) : '...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <Bot className="w-4 h-4" />
            <span>مشاور هوشمند</span>
          </button>
        </div>
      </header>

      {/* نوار فیلترها */}
      <section className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Filter className="w-4 h-4" />
          <span>فیلترها:</span>
        </div>

        {/* کشور */}
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">همه کشورها</option>
          {data?.entities?.countries?.map((c: string) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* دسته‌بندی */}
        <select
          value={categoryID}
          onChange={(e) => setCategoryID(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {data?.entities?.categories?.map((cat: any) => (
            <option key={cat.categoryID} value={cat.categoryID}>
              {cat.categoryName}
            </option>
          ))}
        </select>

        {/* تاریخ شروع */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">از:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-slate-50"
          />
        </div>

        {/* تاریخ پایان */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">تا:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-slate-50"
          />
        </div>

        {(country || categoryID || startDate || endDate) && (
          <button
            onClick={() => {
              setCountry('');
              setCategoryID('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-red-600 hover:underline mr-auto"
          >
            پاک کردن فیلترها
          </button>
        )}
      </section>

      {/* بدنه اصلی */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {loading && !data && (
          <div className="py-20 text-center text-slate-500">در حال پردازش و واکشی اطلاعات واقعی...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            خطا در بارگذاری اطلاعات: {error}
          </div>
        )}

        {data && (
          <>
            {/* کارت‌های شاخص عملکرد (KPI) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* فروش کل */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">فروش خالص کل (پس از تخفیف)</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.kpis.totalNetSales)}</p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>محاسبه بر اساس مبالغ ردیف‌های سفارش</span>
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* تعداد سفارش‌ها */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">تعداد سفارش‌های متمایز</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(data.kpis.totalOrders)}</p>
                  <p className="text-xs text-slate-500 mt-1">تعداد کل اقلام: {formatNumber(data.kpis.totalItemsCount)}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>

              {/* میانگین ارزش سفارش */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">میانگین ارزش سبد خرید (AOV)</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.kpis.averageOrderValue)}</p>
                  <p className="text-xs text-slate-500 mt-1">مشتریان فعال: {formatNumber(data.kpis.activeCustomersCount)}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* سفارش‌های با تأخیر ارسال */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">سفارش‌های دارای تأخیر ارسال</p>
                  <p className="text-2xl font-bold text-red-600">{formatNumber(data.kpis.delayedOrdersCount)}</p>
                  <p className="text-xs text-red-500 mt-1">نیازمند بازبینی واحد لجستیک</p>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* بخش نمودارها */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* روند ماهانه فروش */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">روند فروش خالص ماهانه</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">
                    {data.salesTrend.length} دوره ماهانه
                  </span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.salesTrend}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(val), 'فروش']}
                        labelFormatter={(lbl) => `دوره: ${lbl}`}
                      />
                      <Area type="monotone" dataKey="netSales" stroke="#2563eb" fillOpacity={1} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* سهم دسته‌بندی‌ها */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h2 className="text-base font-bold text-slate-900 mb-4">سهم فروش دسته‌بندی‌ها</h2>
                <div className="h-56 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categorySales}
                        dataKey="netSales"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                      >
                        {data.categorySales.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                  {data.categorySales.slice(0, 4).map((c: any, i: number) => (
                    <div key={c.categoryID} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{c.categoryName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* برترین‌ها و هشدارهای عملیاتی */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* محصولات پرفروش */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4">۵ محصول پرفروش</h2>
                <div className="space-y-3">
                  {data.topProducts.map((p: any, idx: number) => (
                    <div key={p.productID} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {idx + 1}. {p.productName}
                        </p>
                        <p className="text-xs text-slate-400">{p.categoryName}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900">{formatCurrency(p.totalSales)}</p>
                        <p className="text-xs text-slate-400">{formatNumber(p.totalQuantity)} عدد</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* مشتریان برتر */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4">۵ مشتری برتر</h2>
                <div className="space-y-3">
                  {data.topCustomers.map((c: any, idx: number) => (
                    <div key={c.customerID} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {idx + 1}. {c.companyName}
                        </p>
                        <p className="text-xs text-slate-400">{c.country}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900">{formatCurrency(c.totalSales)}</p>
                        <p className="text-xs text-slate-400">{formatNumber(c.orderCount)} سفارش</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ناهنجاری‌های نیازمند اقدام فوری */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>ناهنجاری‌های عملیاتی</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-2">بیشترین تأخیر در تحویل کالا:</p>
                    <div className="space-y-1.5">
                      {data.anomalies.delayed.slice(0, 3).map((d: any) => (
                        <div
                          key={d.orderID}
                          onClick={() => handleOpenOrder(d.orderID)}
                          className="text-xs p-2 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer flex justify-between items-center transition"
                        >
                          <span className="font-medium">سفارش #{d.orderID} ({d.customerName})</span>
                          <span className="font-bold text-red-700">{d.delayDays} روز تأخیر</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-2">کالاهای رو به اتمام بدون سفارش جدید:</p>
                    <div className="space-y-1.5">
                      {data.anomalies.lowStock.slice(0, 2).map((ls: any) => (
                        <div key={ls.productID} className="text-xs p-2 bg-amber-50 rounded-lg flex justify-between">
                          <span>{ls.productName}</span>
                          <span className="font-bold text-amber-800">موجودی: {ls.unitsInStock} عدد</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* جدول ۱۰ سفارش اخیر همراه با قابلیت Drill-Down */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">آخرین سفارش‌ها (برای مشاهده جزئیات کلیک کنید)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                    <tr>
                      <th className="py-3 px-4">شماره سفارش</th>
                      <th className="py-3 px-4">مشتری</th>
                      <th className="py-3 px-4">تاریخ ثبت</th>
                      <th className="py-3 px-4">مهلت تحویل</th>
                      <th className="py-3 px-4">کشور مقصد</th>
                      <th className="py-3 px-4">هزینه حمل</th>
                      <th className="py-3 px-4 text-center">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentOrders.map((ord: any) => (
                      <tr
                        key={ord.orderID}
                        onClick={() => handleOpenOrder(ord.orderID)}
                        className="hover:bg-blue-50/50 cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">#{ord.orderID}</td>
                        <td className="py-3 px-4 font-medium">{ord.shipName}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDateFa(ord.orderDate)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDateFa(ord.requiredDate)}</td>
                        <td className="py-3 px-4">{ord.shipCountry}</td>
                        <td className="py-3 px-4 font-mono">${ord.freight.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center text-blue-600">
                          <ExternalLink className="w-4 h-4 inline" />
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

      {/* مودال Drill-Down فاکتور سفارش */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedOrderId(null);
                setDrilldownData(null);
              }}
              className="absolute left-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {drilldownLoading || !drilldownData ? (
              <div className="py-16 text-center text-slate-500">در حال دریافت اقلام فاکتور...</div>
            ) : (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">جزئیات سفارش #{drilldownData.order.orderID}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    مشتری: {drilldownData.customer?.companyName} ({drilldownData.customer?.country}) • کارمند ثبت‌کننده: {drilldownData.employee?.firstName} {drilldownData.employee?.lastName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <p><span className="text-slate-400">تاریخ ثبت:</span> {formatDateFa(drilldownData.order.orderDate)}</p>
                    <p><span className="text-slate-400">تاریخ تحویل:</span> {formatDateFa(drilldownData.order.shippedDate)}</p>
                  </div>
                  <div>
                    <p><span className="text-slate-400">شرکت حمل:</span> {drilldownData.shipper?.companyName}</p>
                    <p><span className="text-slate-400">هزینه حمل:</span> ${drilldownData.order.freight.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-700 mb-2">اقلام سفارش:</h4>
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-2">کالا</th>
                        <th className="p-2">قیمت واحد</th>
                        <th className="p-2">تعداد</th>
                        <th className="p-2">تخفیف</th>
                        <th className="p-2">مبلغ نهایی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drilldownData.items.map((it: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{it.productName}</td>
                          <td className="p-2 font-mono">${it.unitPrice.toFixed(2)}</td>
                          <td className="p-2 font-mono">{it.quantity}</td>
                          <td className="p-2 font-mono">{(it.discount * 100).toFixed(0)}%</td>
                          <td className="p-2 font-mono font-bold">${it.extendedPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl">
                  <span className="font-bold text-sm text-blue-900">جمع کل فاکتور (خالص):</span>
                  <span className="font-mono font-bold text-lg text-blue-700">
                    ${drilldownData.netTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* کشوی چت مشاور هوشمند (Gemini) */}
      {isChatOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">مشاور تحلیلی مدیریار</h3>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white mr-auto rounded-tl-none'
                    : 'bg-slate-100 text-slate-800 ml-auto rounded-tr-none whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div className="p-3 bg-slate-100 rounded-2xl max-w-[80%] text-slate-500 animate-pulse">
                در حال پردازش آمار و آماده‌سازی پاسخ تحلیلی...
              </div>
            )}
          </div>

          {/* پرسش‌های آماده */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendMessage('فروش کل و میانگین ارزش سفارش چقدر است؟')}
              className="whitespace-nowrap px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
            >
              📊 خلاصه عملکرد
            </button>
            <button
              onClick={() => handleSendMessage('کدام سفارش‌ها بیشترین تأخیر را دارند؟')}
              className="whitespace-nowrap px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
            >
              ⚠️ سفارش‌های معوق
            </button>
            <button
              onClick={() => handleSendMessage('کدام محصولات بیشترین درآمد را ساخته‌اند؟')}
              className="whitespace-nowrap px-2 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
            >
              🏆 محصولات برتر
            </button>
          </div>

          <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="سؤال خود را بپرسید..."
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={chatLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
