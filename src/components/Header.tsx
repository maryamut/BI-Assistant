'use client';

import React from 'react';
import { BarChart3, Database, Sparkles, RefreshCw } from 'lucide-react';
import { ANCHOR_DATE } from '@/lib/analytics';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
  onOpenChat: () => void;
}

export default function Header({ onRefresh, loading, onOpenChat }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-500/20 shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              مدیریار <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">نسخه Northwind</span>
            </h1>
            <p className="text-xs text-slate-400">داشبورد اجرایی و هوش تحلیلی داده‌های بازرگانی</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>تاریخ مرجع داده‌ها: {ANCHOR_DATE}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="بازخوانی داده‌ها"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-medium text-sm transition-all shadow-md shadow-emerald-700/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>دستیار هوشمند</span>
          </button>
        </div>
      </div>
    </header>
  );
}
