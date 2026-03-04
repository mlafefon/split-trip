import React, { useState, useRef, useEffect } from 'react';
import { CURRENCIES } from '../utils/currency';
import { Search, ChevronDown, X } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  short?: boolean;
  align?: 'left' | 'right';
};

export const CurrencySelect = ({ value, onChange, label, className = '', short = false, align = 'left' }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = CURRENCIES.find(c => c.code === value);

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white hover:border-indigo-500 transition-all outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="font-medium text-sm text-slate-700">
          {selectedCurrency ? (short ? selectedCurrency.code : `${selectedCurrency.code} - ${selectedCurrency.name}`) : value}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 ${short ? `${alignmentClass} w-64 max-w-[90vw]` : 'w-full'} bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-60`}>
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                className="w-full pr-9 pl-8 py-2 text-sm border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="חיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">לא נמצאו תוצאות</div>
            ) : (
              filteredCurrencies.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-right px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 ${value === c.code ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'}`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono opacity-60 text-xs bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
