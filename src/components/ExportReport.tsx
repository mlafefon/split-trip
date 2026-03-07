import { Trip, Expense } from '../types';
import { formatAmount } from '../utils/currency';
import { calculateBalances, calculateSettlement } from '../utils/settlement';
import { useEffect } from 'react';
import { Download } from 'lucide-react';
import metadata from '../../metadata.json';

type Props = {
  trip: Trip;
};

export const ExportReport = ({ trip }: Props) => {
  useEffect(() => {
    document.title = `Export - ${trip.destination}`;
  }, [trip.destination]);

  const balances = calculateBalances(trip);
  const settlements = calculateSettlement(balances);

  // Sort expenses by date
  const sortedExpenses = [...trip.expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const getHebrewDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'ILS': return '₪';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'TRY': return '₺';
      case 'THB': return '฿';
      case 'JPY': return '¥';
      case 'KRW': return '₩';
      case 'INR': return '₹';
      case 'RUB': return '₽';
      default: return code;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-8 print:p-0" dir="rtl">
      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-normal mb-1 text-black">
            {trip.destination} — {getHebrewDate(trip.createdAt)}
          </h1>
          <div className="text-sm text-slate-500">
            נוצר על ידי splt-trip v{metadata.version}
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="print:hidden bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
        >
          <Download className="w-4 h-4" /> הורד כ-PDF / הדפס
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 px-2 text-right font-medium text-slate-900 w-[50%]">תיאור</th>
              <th className="py-2 px-2 text-right font-medium text-slate-900 w-[25%]">סכום</th>
              <th className="py-2 px-2 text-right font-medium text-slate-900 w-[25%]">תאריך</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => {
              return (
                <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2 text-slate-800 font-medium">{expense.description}</td>
                  <td className="py-3 px-2 text-slate-800">
                    {expense.originalCurrency && expense.originalCurrency !== trip.tripCurrency ? (
                      <span>{formatAmount(expense.amount / (expense.exchangeRate || 1))} {getCurrencySymbol(expense.originalCurrency)}</span>
                    ) : (
                      <span>{formatAmount(expense.amount)} {getCurrencySymbol(trip.tripCurrency)}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-500">{formatDate(expense.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-12 max-w-md">
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">התחשבנות</h3>
        <div className="space-y-0">
          {settlements.map((settlement, index) => {
            const fromName = trip.participants.find(p => p.id === settlement.from)?.name;
            const toName = trip.participants.find(p => p.id === settlement.to)?.name;
            
            return (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                <div className="flex items-center gap-8 w-full">
                  <span className="font-medium w-20">{fromName}</span>
                  <span className="text-slate-500 text-sm uppercase tracking-wide">חייב ל</span>
                  <span className="font-medium w-20">{toName}</span>
                  <span className="font-bold mr-auto" dir="ltr">{formatAmount(settlement.amount)} {getCurrencySymbol(trip.tripCurrency)}</span>
                </div>
              </div>
            );
          })}
          {settlements.length === 0 && (
            <p className="text-slate-500 italic">אין צורך בהתחשבנות.</p>
          )}
        </div>
        <div className="border-b-2 border-yellow-400 mt-2 w-full"></div>
      </div>
    </div>
  );
};
