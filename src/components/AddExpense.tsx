import React, { useState, useEffect } from 'react';
import { Trip, Expense, ExpenseSplit, Category } from '../types';
import { Check, Plus, Settings, Loader2, ChevronDown } from 'lucide-react';
import { CURRENCIES, fetchExchangeRates } from '../utils/currency';
import { ICON_MAP } from '../utils/categories';
import { CategoryEditor } from './CategoryEditor';

type Props = {
  trip: Trip;
  initialExpense?: Expense;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
  onUpdateCategories: (categories: Category[]) => void;
};

export const AddExpense = ({ trip, initialExpense, onSave, onCancel, onUpdateCategories }: Props) => {
  const [description, setDescription] = useState(initialExpense?.description || '');
  
  // Currency State
  const [currency, setCurrency] = useState(initialExpense?.originalCurrency || trip.tripCurrency);
  const [exchangeRate, setExchangeRate] = useState(initialExpense?.exchangeRate?.toString() || '1');
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const updateRate = async () => {
      if (currency === trip.tripCurrency) {
        setExchangeRate('1');
        return;
      }

      setIsFetchingRate(true);
      const rates = await fetchExchangeRates(currency);
      if (rates && rates[trip.tripCurrency]) {
        setExchangeRate(rates[trip.tripCurrency].toString());
      }
      setIsFetchingRate(false);
    };

    updateRate();
  }, [currency, trip.tripCurrency]);

  // Amount State (in selected currency)
  const [amount, setAmount] = useState(() => {
    if (initialExpense) {
      const rate = initialExpense.exchangeRate || 1;
      return (initialExpense.amount / rate).toFixed(2);
    }
    return '';
  });

  const [tag, setTag] = useState(initialExpense?.tag || '');
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);

  const [date, setDate] = useState(
    initialExpense?.date 
      ? new Date(initialExpense.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  
  // Payer state
  const [payerMode, setPayerMode] = useState<'SINGLE' | 'MULTIPLE'>(
    (initialExpense?.payers?.length || 0) > 1 ? 'MULTIPLE' : 'SINGLE'
  );
  const [singlePayer, setSinglePayer] = useState(
    (initialExpense?.payers && initialExpense.payers.length === 1) 
      ? initialExpense.payers[0].participantId 
      : (initialExpense as any)?.paidBy || trip.participants[0]?.id || ''
  );
  const [multiPayers, setMultiPayers] = useState<Record<string, string>>({});

  // Split state
  const [splitType, setSplitType] = useState<'EQUAL' | 'EXACT'>(
    // Heuristic: if amounts are not roughly equal, assume EXACT
    initialExpense?.splits && initialExpense.splits.length > 0 && 
    !initialExpense.splits.every(s => Math.abs(s.amount - initialExpense.splits[0].amount) < 0.01)
      ? 'EXACT' 
      : 'EQUAL'
  );
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(
    initialExpense?.splits.map(s => s.participantId) || trip.participants.map(p => p.id)
  );
  const [exactSplits, setExactSplits] = useState<Record<string, string>>({});

  // Initialize multiPayers and exactSplits
  useEffect(() => {
    const initialPayers: Record<string, string> = {};
    const initialSplits: Record<string, string> = {};
    const rate = initialExpense?.exchangeRate || 1;

    trip.participants.forEach(p => {
      initialPayers[p.id] = '';
      initialSplits[p.id] = '';
    });

    if (initialExpense) {
      // Populate payers
      if (initialExpense.payers) {
        initialExpense.payers.forEach(p => {
          initialPayers[p.participantId] = (p.amount / rate).toFixed(2);
        });
      } else if ((initialExpense as any).paidBy) {
        // Legacy support
        initialPayers[(initialExpense as any).paidBy] = (initialExpense.amount / rate).toFixed(2);
      }

      // Populate splits
      initialExpense.splits.forEach(s => {
        initialSplits[s.participantId] = (s.amount / rate).toFixed(2);
      });
    }

    setMultiPayers(initialPayers);
    setExactSplits(initialSplits);
  }, [trip.participants, initialExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const rate = parseFloat(exchangeRate);

    if (!description.trim() || isNaN(numAmount) || numAmount <= 0 || isNaN(rate) || rate <= 0) return;

    if (!tag) {
      alert('חובה לבחור קטגוריה');
      return;
    }

    // Convert to Trip Currency for storage
    const finalAmountInTripCurrency = numAmount * rate;

    // Construct Payers
    let finalPayers: { participantId: string; amount: number }[] = [];
    
    if (payerMode === 'SINGLE') {
      finalPayers = [{ participantId: singlePayer, amount: finalAmountInTripCurrency }];
    } else {
      let totalPaid = 0;
      finalPayers = trip.participants.map(p => {
        const val = parseFloat(multiPayers[p.id] || '0');
        if (val > 0) {
          totalPaid += val;
          return { participantId: p.id, amount: val * rate };
        }
        return null;
      }).filter(Boolean) as { participantId: string; amount: number }[];

      if (Math.abs(totalPaid - numAmount) > 0.01) {
        alert(`סכום התשלומים (${totalPaid}) לא שווה לסכום ההוצאה (${numAmount})`);
        return;
      }
    }

    // Construct Splits
    let finalSplits: ExpenseSplit[] = [];

    if (selectedBeneficiaries.length === 0) {
      alert('חובה לבחור לפחות משתתף אחד בחלוקה');
      return;
    }

    if (splitType === 'EQUAL') {
      const splitAmount = finalAmountInTripCurrency / selectedBeneficiaries.length;
      finalSplits = selectedBeneficiaries.map(id => ({
        participantId: id,
        amount: splitAmount
      }));
    } else {
      let totalSplit = 0;
      finalSplits = selectedBeneficiaries.map(id => {
        const val = parseFloat(exactSplits[id] || '0');
        totalSplit += val;
        return { participantId: id, amount: val * rate };
      });

      if (Math.abs(totalSplit - numAmount) > 0.01) {
        alert(`סכום החלוקה (${totalSplit}) לא שווה לסכום ההוצאה (${numAmount})`);
        return;
      }
    }

    const expense: Expense = {
      id: initialExpense?.id || crypto.randomUUID(),
      description: description.trim(),
      amount: finalAmountInTripCurrency,
      date: new Date(date).toISOString(),
      payers: finalPayers,
      splits: finalSplits,
      tag,
      originalCurrency: currency,
      exchangeRate: rate
    };

    onSave(expense);
  };

  const toggleBeneficiary = (id: string) => {
    if (selectedBeneficiaries.includes(id)) {
      setSelectedBeneficiaries(selectedBeneficiaries.filter(bid => bid !== id));
    } else {
      setSelectedBeneficiaries([...selectedBeneficiaries, id]);
    }
  };

  if (showCategoryEditor) {
    return (
      <CategoryEditor 
        categories={trip.categories} 
        onSave={(newCategories) => {
          onUpdateCategories(newCategories);
          // If current tag was deleted, reset to first available
          if (!newCategories.find(c => c.name === tag)) {
            setTag(newCategories[0]?.name || '');
          }
        }} 
        onClose={() => setShowCategoryEditor(false)} 
      />
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{initialExpense ? 'עריכת הוצאה' : 'הוספת הוצאה'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {trip.categories.map(cat => {
                const Icon = ICON_MAP[cat.icon];
                const isSelected = tag === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setTag(cat.name);
                      setDescription(cat.name);
                    }}
                    className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${isSelected ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                    title={cat.name}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform ${isSelected ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                      style={{ backgroundColor: cat.color }}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                    </div>
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => setShowCategoryEditor(true)}
                className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-50 opacity-70 hover:opacity-100 transition-all"
                title="ערוך קטגוריות"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">תיאור</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="לדוגמה: ארוחת ערב, מונית..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">סכום</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="0.00"
              />
              <div className="relative w-28">
                <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-between px-3 border border-slate-200 rounded-xl bg-white">
                  <span className="font-medium text-sm text-slate-700">{currency}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-full opacity-0 cursor-pointer"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
              </div>
            </div>
            {currency !== trip.tripCurrency && (
              <div className="text-xs text-slate-500 mt-1 px-1 flex items-center gap-1">
                 {isFetchingRate ? (
                   <>
                     <Loader2 className="w-3 h-3 animate-spin"/>
                     <span>מעדכן שער...</span>
                   </>
                 ) : (
                   <span>
                     ≈ {(parseFloat(amount || '0') * parseFloat(exchangeRate || '0')).toFixed(2)} {trip.tripCurrency}
                     <span className="opacity-70 mx-1">(1 {currency} = {parseFloat(exchangeRate || '0').toFixed(2)} {trip.tripCurrency})</span>
                   </span>
                 )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">תאריך</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Who Paid Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">מי שילם?</label>
          
          <select 
            value={payerMode === 'MULTIPLE' ? 'MULTIPLE' : singlePayer}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'MULTIPLE') {
                setPayerMode('MULTIPLE');
              } else {
                setPayerMode('SINGLE');
                setSinglePayer(val);
              }
            }}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-3"
          >
            {trip.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="MULTIPLE">מספר משתתפים</option>
          </select>

          {payerMode === 'MULTIPLE' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {trip.participants.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-700">{p.name}</span>
                  <div className="relative w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={multiPayers[p.id] || ''}
                      onChange={(e) => setMultiPayers({...multiPayers, [p.id]: e.target.value})}
                      className="w-full p-2 pl-8 border border-slate-200 rounded-lg text-left"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                  </div>
                </div>
              ))}
              <div className="text-xs text-slate-500 text-left mt-2">
                סה"כ שולם: {Object.values(multiPayers).reduce<number>((sum, val: string) => sum + (parseFloat(val) || 0), 0).toFixed(2)} / {amount || '0.00'}
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* How to Split Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">איך מתחלקים?</label>
          
          {/* Beneficiary Selection */}
          <div className="mb-4">
            <div className="text-xs text-slate-500 mb-2">עבור מי ההוצאה?</div>
            <div className="flex flex-wrap gap-2">
              {trip.participants.map(p => {
                const isSelected = selectedBeneficiaries.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleBeneficiary(p.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      isSelected 
                        ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedBeneficiaries(trip.participants.map(p => p.id))}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-indigo-600 underline"
              >
                בחר הכל
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSplitType('EQUAL')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${splitType === 'EQUAL' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              שווה בשווה
            </button>
            <button
              type="button"
              onClick={() => {
                setSplitType('EXACT');
                const total = parseFloat(amount);
                if (!isNaN(total) && total > 0 && selectedBeneficiaries.length > 0) {
                  const newSplits: Record<string, string> = {};
                  const count = selectedBeneficiaries.length;
                  const baseAmount = Math.floor((total / count) * 100) / 100;
                  const remainder = Number((total - (baseAmount * count)).toFixed(2));
                  
                  trip.participants.forEach(p => newSplits[p.id] = '');
                  
                  selectedBeneficiaries.forEach((id, index) => {
                    let val = baseAmount;
                    if (index === 0) val = Number((val + remainder).toFixed(2));
                    newSplits[id] = val.toFixed(2);
                  });
                  setExactSplits(newSplits);
                }
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${splitType === 'EXACT' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              סכומים מדויקים
            </button>
          </div>

          {splitType === 'EXACT' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {trip.participants.filter(p => selectedBeneficiaries.includes(p.id)).map(p => {
                const currentVal = parseFloat(exactSplits[p.id] || '0');
                const otherSum = Object.entries(exactSplits)
                  .filter(([id]) => id !== p.id)
                  .reduce((sum, [, val]) => sum + (parseFloat(val as string) || 0), 0);
                const maxAllowed = Math.max(0, parseFloat(amount || '0') - otherSum);
                const isOverLimit = currentVal > maxAllowed + 0.01; // Small epsilon for float comparison

                return (
                  <div key={p.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-slate-700">{p.name}</span>
                      <div className="relative w-32">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={exactSplits[p.id] || ''}
                          onChange={(e) => setExactSplits({...exactSplits, [p.id]: e.target.value})}
                          className={`w-full p-2 pl-8 border rounded-lg text-left outline-none transition-colors ${
                            isOverLimit 
                              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                          placeholder="0.00"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                      </div>
                    </div>
                    <div className={`text-[10px] text-left pl-1 ${isOverLimit ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                      מקסימום: {maxAllowed.toFixed(2)}
                    </div>
                  </div>
                );
              })}
              <div className="text-xs text-slate-500 text-left mt-2 pt-2 border-t border-slate-200">
                סה"כ חולק: {Object.values(exactSplits).reduce<number>((sum, val: string) => sum + (parseFloat(val) || 0), 0).toFixed(2)} / {amount || '0.00'}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="submit"
            className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            {initialExpense ? 'עדכן הוצאה' : 'שמור הוצאה'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-700 p-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
};
