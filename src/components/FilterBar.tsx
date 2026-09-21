'use client';

import React from 'react';
import { FilterState, Category } from '@/lib/types';
import { Filter, Calendar, Globe } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: Category[];
  countries: string[];
}

export default function FilterBar({ filters, onChange, categories, countries }: FilterBarProps) {
  const setPreset = (preset: 'all' | '1997' | '1998') => {
    if (preset === 'all') {
      onChange({ ...filters, startDate: undefined, endDate: undefined });
    } else if (preset === '1997') {
      onChange({ ...filters, startDate: '1997-01-01', endDate: '1997-12-31' });
    } else if (preset === '1998') {
      onChange({ ...filters, startDate: '1998-01-01', endDate: '1998-05-06' });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-slate-200">فیلترهای تحلیل:</span>
          
          <div className="flex gap-1.5 mr-2">
            <button
              onClick={() => setPreset('all')}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                !filters.startDate && !filters.endDate
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              تمام دوره‌ها
            </button>
            <button
              onClick={() => setPreset('1997')}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                filters.startDate === '1997-01-01'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              سال ۱۹۹۷
            </button>
            <button
              onClick={() => setPreset('1998')}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                filters.startDate === '1998-01-01'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              ۴ ماهه ۱۹۹۸
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* فیلتر دسته بندی */}
          <select
            value={filters.categoryID || ''}
            onChange={(e) => onChange({ ...filters, categoryID: e.target.value ? Number(e.target.value) : undefined })}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            <option value="">همه دسته‌بندی‌ها</option>
            {categories.map((c) => (
              <option key={c.categoryID} value={c.categoryID}>{c.categoryName}</option>
            ))}
          </select>

          {/* فیلتر کشور مقصد */}
          <select
            value={filters.country || ''}
            onChange={(e) => onChange({ ...filters, country: e.target.value || undefined })}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            <option value="">همه کشورها</option>
            {countries.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
