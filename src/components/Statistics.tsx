import { Trip } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Download, Printer, TrendingUp, Calendar, Award, Wallet } from 'lucide-react';
import { ICON_MAP } from '../utils/categories';
import { formatAmount } from '../utils/currency';
import { getParticipantName, formatParticipantName } from '../utils/participants';

type Props = {
  trip: Trip;
  currentUserId?: string | null;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export const Statistics = ({ trip, currentUserId }: Props) => {
  // Calculate Category Data (excluding transfers)
  const categoryTotals: Record<string, number> = {};
  let totalCategoryExpenses = 0;
  
  // Daily Data Processing
  const dailyMap: Record<string, any> = {};
  const usedCategories = new Set<string>();

  trip.expenses.forEach(e => {
    if (e.tag === 'העברה') return; // Skip transfers
    
    // Category Totals
    const tagName = e.tag || 'ללא קטגוריה';
    categoryTotals[tagName] = (categoryTotals[tagName] || 0) + e.amount;
    totalCategoryExpenses += e.amount;

    // Daily Data
    const dateKey = new Date(e.date).toISOString().split('T')[0];
    const displayDate = new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { dateKey, name: displayDate };
    }
    dailyMap[dateKey][tagName] = (dailyMap[dateKey][tagName] || 0) + e.amount;
    usedCategories.add(tagName);
  });

  const categoryData = Object.entries(categoryTotals).map(([name, value]) => {
    const category = trip.categories.find(c => c.name === name);
    return {
      name,
      value,
      color: category?.color || '#cbd5e1', // fallback color
      icon: category?.icon || 'HelpCircle' // fallback icon
    };
  }).sort((a, b) => b.value - a.value);

  const dailyData = Object.values(dailyMap).sort((a: any, b: any) => a.dateKey.localeCompare(b.dateKey));

  const totalExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const expensesByCurrency = trip.expenses.reduce((acc, e) => {
    if (e.tag === 'העברה') return acc;
    const currency = e.originalCurrency || trip.tripCurrency;
    const originalAmount = e.amount / (e.exchangeRate || 1);
    acc[currency] = (acc[currency] || 0) + originalAmount;
    return acc;
  }, {} as Record<string, number>);

  const payerData = trip.participants.map(p => {
    const total = trip.expenses.reduce((sum, e) => {
      const payer = e.payers?.find(payer => payer.participantId === p.id);
      if (payer) return sum + payer.amount;
      // Legacy support
      if ((e as any).paidBy === p.id) return sum + e.amount;
      return sum;
    }, 0);
    return {
      name: formatParticipantName(p.name, p.id === currentUserId),
      value: total
    };
  }).filter(d => d.value > 0);

  // Calculate Insights
  const expensesDates = trip.expenses
    .filter(e => e.tag !== 'העברה')
    .map(e => {
      const d = new Date(e.date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    });
  
  let averageDaily = 0;
  if (expensesDates.length > 0) {
    const minDate = Math.min(...expensesDates);
    const maxDate = Math.max(...expensesDates);
    const days = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    averageDaily = totalCategoryExpenses / days;
  }

  let mostExpensiveDay = { name: '', amount: 0 };
  dailyData.forEach((day: any) => {
    const dayTotal = Object.entries(day).reduce((sum, [key, val]) => {
      if (key !== 'dateKey' && key !== 'name') return sum + (val as number);
      return sum;
    }, 0);
    if (dayTotal > mostExpensiveDay.amount) {
      mostExpensiveDay = { name: day.name, amount: dayTotal };
    }
  });

  let mostExpensiveCategory = { name: '', amount: 0, percentage: 0 };
  if (categoryData.length > 0) {
    mostExpensiveCategory = {
      name: categoryData[0].name,
      amount: categoryData[0].value,
      percentage: Math.round((categoryData[0].value / totalCategoryExpenses) * 100)
    };
  }

  const exportToCSV = () => {
    // BOM for Hebrew support in Excel
    const BOM = "\uFEFF";
    const headers = ['תאריך', 'תיאור', 'קטגוריה', 'סכום מקורי', 'מטבע מקורי', 'שער', 'סכום בטיול', 'שולם ע"י', 'עבור', 'הערות'];
    
    const rows = trip.expenses.map(e => {
      const dateObj = new Date(e.date);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const date = `${day}/${month}/${year}`;
      const payers = e.payers.map(p => {
        const name = getParticipantName(p.participantId, trip.participants, currentUserId);
        return `${name} (${formatAmount(p.amount)})`;
      }).join(', ');
      
      const beneficiaries = e.splits.map(s => {
        const name = getParticipantName(s.participantId, trip.participants, currentUserId);
        return `${name} (${formatAmount(s.amount)})`;
      }).join(', ');

      const originalAmount = e.amount / (e.exchangeRate || 1);

      return [
        date,
        `"${e.description.replace(/"/g, '""')}"`,
        e.tag,
        formatAmount(originalAmount),
        e.originalCurrency,
        e.exchangeRate,
        formatAmount(e.amount),
        `"${payers}"`,
        `"${beneficiaries}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = BOM + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trip_expenses_${trip.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (totalCategoryExpenses === 0 && totalExpenses === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>אין מספיק נתונים להצגת סטטיסטיקות.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('trip', trip.id);
            url.searchParams.set('view', 'export');
            window.open(url.toString(), '_blank');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          הדפסת דוח
        </button>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          ייצוא ל-CSV
        </button>
      </div>

      {/* Quick Insights Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-sm text-slate-500 font-medium leading-tight line-clamp-2">ממוצע ליום</div>
          </div>
          <div className="text-xl font-bold text-slate-800 truncate" dir="ltr">
            {formatAmount(averageDaily)} <span className="text-sm font-normal text-slate-500">{trip.tripCurrency}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-sm text-slate-500 font-medium leading-tight line-clamp-2">היום היקר ביותר {mostExpensiveDay.name ? `(${mostExpensiveDay.name})` : ''}</div>
          </div>
          <div className="text-xl font-bold text-slate-800 truncate" dir="ltr">
            {formatAmount(mostExpensiveDay.amount)} <span className="text-sm font-normal text-slate-500">{trip.tripCurrency}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-sm text-slate-500 font-medium leading-tight line-clamp-2">הכי הרבה הוצאות {mostExpensiveCategory.name ? `(${mostExpensiveCategory.name})` : ''}</div>
          </div>
          <div className="text-xl font-bold text-slate-800 truncate" dir="ltr">
            {mostExpensiveCategory.percentage}% <span className="text-sm font-normal text-slate-500">מהתקציב</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="text-sm text-slate-500 font-medium leading-tight line-clamp-2">סה"כ הוצאות</div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-x-2 gap-y-1 overflow-y-auto max-h-[80px]" dir="ltr">
            {Object.entries(expensesByCurrency).map(([currency, amount]) => (
              <div key={currency} className="text-lg font-bold text-slate-800 truncate">
                {formatAmount(amount)} <span className="text-sm font-normal text-slate-500">{currency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {totalCategoryExpenses > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">הוצאות לפי קטגוריה</h3>
          <div className="h-[220px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, bottom: 0 }}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Label 
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as any;
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-xl font-bold fill-slate-700">
                          {formatAmount(totalCategoryExpenses)} {trip.tripCurrency}
                        </text>
                      );
                    }}
                  />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [<>{formatAmount(value)} <span className="text-[70%]">{trip.tripCurrency}</span></>, 'סכום']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {categoryData.sort((a, b) => b.value - a.value).map(cat => {
              const Icon = ICON_MAP[cat.icon];
              return (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                      {Icon && <Icon className="w-3 h-3" />}
                    </div>
                    <span className="text-slate-700">{cat.name}</span>
                  </div>
                  <div className="text-slate-500" dir="ltr">
                    {formatAmount(cat.value)} <span className="text-[70%]">{trip.tripCurrency}</span> ({((cat.value / totalCategoryExpenses) * 100).toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalExpenses > 0 && trip.participants.length > 1 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">הוצאות לפי משתתף</h3>
          <div className="h-[220px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, bottom: 0 }}>
                <Pie
                  data={payerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {payerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [<>{formatAmount(value)} <span className="text-[70%]">{trip.tripCurrency}</span></>, 'סכום']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {payerData.sort((a, b) => b.value - a.value).map((p, index) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-700">{p.name}</span>
                </div>
                <div className="text-slate-500" dir="ltr">
                  {formatAmount(p.value)} <span className="text-[70%]">{trip.tripCurrency}</span> ({((p.value / totalExpenses) * 100).toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dailyData.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">הוצאות יומיות לפי קטגוריה</h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [<>{formatAmount(value)} <span className="text-[70%]">{trip.tripCurrency}</span></>]}
                  labelStyle={{ textAlign: 'right' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {Array.from(usedCategories).map((catName) => {
                  const category = trip.categories.find(c => c.name === catName);
                  const color = category?.color || '#cbd5e1';
                  return (
                    <Bar 
                      key={catName} 
                      dataKey={catName} 
                      stackId="a" 
                      fill={color} 
                      name={catName}
                      radius={[4, 4, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
