import { Trip } from '../types';
import { calculateBalances, calculateSettlement } from '../utils/settlement';
import { ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { ICON_MAP } from '../utils/categories';

type Props = {
  trip: Trip;
  view: 'BALANCES' | 'SETTLEMENT';
  exchangeRate: number | null;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export const Balances = ({ trip, view, exchangeRate }: Props) => {
  const balances = calculateBalances(trip);
  const getParticipantName = (id: string) => trip.participants.find(p => p.id === id)?.name || 'לא ידוע';

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

  // Calculate Payer Data (including transfers? usually yes for balances, but maybe not for "spending" chart if it means consumption. 
  // But the user only asked to exclude transfers from the *category* chart. 
  // "בגרף הקטגוריות ... אל תציג בגרף זה את ההעברות". 
  // So I will leave payer chart as is, or maybe I should exclude transfers there too? 
  // Usually "how much each participant spent" includes what they paid for others, but transfers are payments too.
  // However, transfers are usually zero-sum in terms of "cost", but they are "cash out".
  // I will stick to the request: "In the category graph... do not show transfers".

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

  if (view === 'BALANCES') {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          {Object.entries(balances).map(([id, balance]) => {
            const isPositive = balance > 0.01;
            const isNegative = balance < -0.01;
            const isZero = !isPositive && !isNegative;

            return (
              <div key={id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="font-bold text-slate-800">{getParticipantName(id)}</div>
                <div className={`text-left ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400'}`} dir="ltr">
                  <div className="font-bold">
                    {isPositive ? '+' : ''}{balance.toFixed(2)} {trip.tripCurrency}
                  </div>
                  <div className="text-xs mt-0.5 flex items-center gap-2">
                    {exchangeRate && trip.baseCurrency !== trip.tripCurrency && !isZero && (
                      <span className="opacity-60">
                        ≈ {isPositive ? '+' : ''}{(balance * exchangeRate).toFixed(2)} {trip.baseCurrency}
                      </span>
                    )}
                    <span className="opacity-80">
                      {isPositive ? 'חייבים לו' : isNegative ? 'חייב לאחרים' : 'מאוזן'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalCategoryExpenses > 0 && (
          <>
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
          </>
        )}
      </div>
    );
  }

  const transactions = calculateSettlement(balances);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="text-emerald-500 text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-bold text-slate-800">הכל מיושב!</h3>
        <p className="text-slate-500">אף אחד לא חייב כסף לאף אחד.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-sm mb-4">
        זוהי הדרך היעילה ביותר להתחשבן בין כולם במינימום העברות.
      </div>
      
      {transactions.map((t, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
          <div className="flex-1 text-center font-medium text-slate-800 bg-slate-50 py-2 rounded-lg">
            {getParticipantName(t.from)}
          </div>
          
          <div className="flex flex-col items-center text-indigo-600 px-2" dir="ltr">
            <div className="font-bold whitespace-nowrap">{t.amount.toFixed(2)} {trip.tripCurrency}</div>
            <ArrowLeft className="w-5 h-5 my-1" />
            {exchangeRate && trip.baseCurrency !== trip.tripCurrency && (
              <div className="text-xs text-slate-400 whitespace-nowrap">
                ≈ {(t.amount * exchangeRate).toFixed(2)} {trip.baseCurrency}
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center font-medium text-slate-800 bg-slate-50 py-2 rounded-lg">
            {getParticipantName(t.to)}
          </div>
        </div>
      ))}
    </div>
  );
};
