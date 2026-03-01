import { Trip } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { ICON_MAP } from '../utils/categories';

type Props = {
  trip: Trip;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export const Statistics = ({ trip }: Props) => {
  // Calculate Category Data (excluding transfers)
  const categoryTotals: Record<string, number> = {};
  let totalCategoryExpenses = 0;
  
  trip.expenses.forEach(e => {
    if (e.tag === 'העברה') return; // Skip transfers
    const tagName = e.tag || 'ללא קטגוריה';
    categoryTotals[tagName] = (categoryTotals[tagName] || 0) + e.amount;
    totalCategoryExpenses += e.amount;
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

  const totalExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

  const payerData = trip.participants.map(p => {
    const total = trip.expenses.reduce((sum, e) => {
      const payer = e.payers?.find(payer => payer.participantId === p.id);
      if (payer) return sum + payer.amount;
      // Legacy support
      if ((e as any).paidBy === p.id) return sum + e.amount;
      return sum;
    }, 0);
    return {
      name: p.name,
      value: total
    };
  }).filter(d => d.value > 0);

  if (totalCategoryExpenses === 0 && totalExpenses === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>אין מספיק נתונים להצגת סטטיסטיקות.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {totalCategoryExpenses > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">הוצאות לפי קטגוריה</h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                    value={`${totalCategoryExpenses.toFixed(0)} ${trip.tripCurrency}`} 
                    position="center" 
                    className="text-xl font-bold fill-slate-700"
                  />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} ${trip.tripCurrency}`, 'סכום']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
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
                    {cat.value.toFixed(2)} {trip.tripCurrency} ({((cat.value / totalCategoryExpenses) * 100).toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalExpenses > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">הוצאות לפי משתתף</h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                  formatter={(value: number) => [`${value.toFixed(2)} ${trip.tripCurrency}`, 'סכום']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {payerData.sort((a, b) => b.value - a.value).map((p, index) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-700">{p.name}</span>
                </div>
                <div className="text-slate-500" dir="ltr">
                  {p.value.toFixed(2)} {trip.tripCurrency} ({((p.value / totalExpenses) * 100).toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
