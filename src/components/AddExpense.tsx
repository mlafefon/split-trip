import React, { useState, useEffect } from 'react';
import { Trip, Expense, ExpenseSplit, Category } from '../types';
import { Check, Plus, Settings, Loader2, ChevronDown, Lock, ArrowRight } from 'lucide-react';
import { CURRENCIES, fetchExchangeRates, formatAmount } from '../utils/currency';
import { ICON_MAP } from '../utils/categories';
import { CategoryEditor } from './CategoryEditor';
import { CurrencySelect } from './CurrencySelect';
import { Select } from './Select';

type Props = {
  trip: Trip;
  initialExpense?: Expense;
  initialData?: Partial<Expense>;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
  onUpdateCategories: (categories: Category[]) => void;
  defaultMode?: 'EXPENSE' | 'TRANSFER';
};

export const AddExpense = ({ trip, initialExpense, initialData, onSave, onCancel, onUpdateCategories, defaultMode = 'EXPENSE' }: Props) => {
  const isTransfer = defaultMode === 'TRANSFER' || initialExpense?.tag === 'העברה' || initialData?.tag === 'העברה';
  
  const [description, setDescription] = useState(initialExpense?.description || initialData?.description || (isTransfer ? 'העברה' : ''));
  
  // Currency State
  const [currency, setCurrency] = useState(initialExpense?.originalCurrency || initialData?.originalCurrency || trip.tripCurrency);
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
      return formatAmount(initialExpense.amount / rate);
    }
    if (initialData?.amount) {
       return formatAmount(initialData.amount);
    }
    return '';
  });

  const [tag, setTag] = useState(initialExpense?.tag || initialData?.tag || (isTransfer ? 'העברה' : ''));
  const [notes, setNotes] = useState(initialExpense?.notes || initialData?.notes || '');
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
      : (initialExpense as any)?.paidBy || (initialData?.payers?.[0]?.participantId || '')
  );
  const [multiPayers, setMultiPayers] = useState<Record<string, string>>({});

  // Split state
  const [splitMode, setSplitMode] = useState<'EXACT' | 'PERCENTAGE'>('EXACT');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(
    initialExpense?.splits.map(s => s.participantId) || 
    (initialData?.splits?.map(s => s.participantId) || 
    (isTransfer ? [] : trip.participants.map(p => p.id)))
  );
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [manualSplitIds, setManualSplitIds] = useState<string[]>([]);

  // Update description for transfer
  useEffect(() => {
    if (isTransfer) {
      const payerName = trip.participants.find(p => p.id === singlePayer)?.name;
      const receiverId = selectedBeneficiaries[0];
      const receiverName = trip.participants.find(p => p.id === receiverId)?.name;
      
      if (payerName && receiverName) {
        setDescription(`העברה מ${payerName} ל${receiverName}`);
      } else {
        setDescription('העברה');
      }
    }
  }, [isTransfer, singlePayer, selectedBeneficiaries, trip.participants]);

  // Ensure payer is not in beneficiaries for transfer
  useEffect(() => {
    if (isTransfer && selectedBeneficiaries.includes(singlePayer)) {
      const newSelected = selectedBeneficiaries.filter(id => id !== singlePayer);
      setSelectedBeneficiaries(newSelected);
      
      // Also clear split value for them
      const newSplits = { ...splitValues };
      delete newSplits[singlePayer];
      setSplitValues(newSplits);
    }
  }, [isTransfer, singlePayer, selectedBeneficiaries, splitValues]);

  // Initialize splitValues
  useEffect(() => {
    const initialSplits: Record<string, string> = {};
    const rate = initialExpense?.exchangeRate || 1;
    
    if (initialExpense && initialExpense.splits.length > 0) {
      // Load existing splits
      initialExpense.splits.forEach(s => {
        initialSplits[s.participantId] = formatAmount(s.amount / rate);
      });
      // Ensure unselected have 0 or empty
      trip.participants.forEach(p => {
        if (!initialSplits[p.id]) initialSplits[p.id] = '0';
      });
    } else if (initialData?.splits && initialData.splits.length > 0) {
      initialData.splits.forEach(s => {
        initialSplits[s.participantId] = formatAmount(s.amount);
      });
      trip.participants.forEach(p => {
        if (!initialSplits[p.id]) initialSplits[p.id] = '0';
      });
    } else {
      trip.participants.forEach(p => {
        initialSplits[p.id] = '';
      });
    }
    setSplitValues(initialSplits);
  }, [trip.participants, initialExpense, initialData]);

  // Helper to recalculate splits for auto-participants
  const distributeRemaining = (
    targetTotal: number,
    currentSplits: Record<string, string>,
    manuals: string[],
    selected: string[]
  ) => {
    const newSplits = { ...currentSplits };
    const autoParticipants = selected.filter(id => !manuals.includes(id));

    if (autoParticipants.length === 0) return newSplits;

    let manualSum = 0;
    manuals.forEach(id => {
      const val = parseFloat(newSplits[id] || '0');
      if (!isNaN(val)) manualSum += val;
    });

    const remaining = targetTotal - manualSum;
    const count = autoParticipants.length;
    
    // Distribute equally
    const base = Math.floor((remaining / count) * 100) / 100;
    const remainder = Number((remaining - (base * count)).toFixed(2));

    autoParticipants.forEach((id, idx) => {
      let val = base;
      if (idx === 0) val = Number((val + remainder).toFixed(2));
      newSplits[id] = formatAmount(val);
    });

    return newSplits;
  };

  // Helper to calculate equal split (resets manuals)
  const calculateEqualSplits = (totalAmount: number) => {
    if (isNaN(totalAmount) || totalAmount <= 0 || selectedBeneficiaries.length === 0) return;

    setManualSplitIds([]); // Reset manuals
    
    const count = selectedBeneficiaries.length;
    const newSplits = { ...splitValues };
    
    // Reset unselected to 0
    trip.participants.forEach(p => {
      if (!selectedBeneficiaries.includes(p.id)) newSplits[p.id] = '0';
    });

    if (splitMode === 'EXACT') {
      const baseAmount = Math.floor((totalAmount / count) * 100) / 100;
      const remainder = Number((totalAmount - (baseAmount * count)).toFixed(2));
      
      selectedBeneficiaries.forEach((id, index) => {
        let val = baseAmount;
        if (index === 0) val = Number((val + remainder).toFixed(2));
        newSplits[id] = formatAmount(val);
      });
    } else {
      // PERCENTAGE
      const basePercent = Math.floor((100 / count) * 100) / 100;
      const remainder = Number((100 - (basePercent * count)).toFixed(2));
      
      selectedBeneficiaries.forEach((id, index) => {
        let val = basePercent;
        if (index === 0) val = Number((val + remainder).toFixed(2));
        newSplits[id] = formatAmount(val);
      });
    }
    setSplitValues(newSplits);
  };

  const handleEqualSplit = () => {
    const total = parseFloat(amount);
    calculateEqualSplits(total);
  };

  const handleSplitChange = (id: string, value: string) => {
    // 1. Update the changed value
    const newSplits = { ...splitValues, [id]: value };
    
    // 2. Update manual locks
    let newManuals = [...manualSplitIds];
    if (!newManuals.includes(id)) {
      newManuals.push(id);
    }
    
    // If all selected are manual, unlock the oldest one (first in array) that is NOT the current id
    if (selectedBeneficiaries.length > 1 && newManuals.length >= selectedBeneficiaries.length) {
      const firstOther = newManuals.find(mId => mId !== id);
      if (firstOther) {
        newManuals = newManuals.filter(mId => mId !== firstOther);
      }
    }

    setManualSplitIds(newManuals);

    // 3. Distribute remaining
    const total = splitMode === 'EXACT' ? parseFloat(amount || '0') : 100;
    const distributedSplits = distributeRemaining(total, newSplits, newManuals, selectedBeneficiaries);
    
    setSplitValues(distributedSplits);
  };

  const toggleBeneficiary = (id: string) => {
    let newSelected: string[];
    let newManuals = [...manualSplitIds];

    if (selectedBeneficiaries.includes(id)) {
      // Removing
      newSelected = selectedBeneficiaries.filter(bid => bid !== id);
      newManuals = newManuals.filter(mid => mid !== id);
      
      // Clear value
      const newSplits = { ...splitValues, [id]: '' };
      
      // If we removed a manual user, we might need to redistribute?
      // Actually, we should always redistribute among remaining autos.
      // If no autos left (all remaining are manual), unlock one.
      if (newSelected.length > 0 && newManuals.length >= newSelected.length) {
         // Unlock the first one
         const toUnlock = newManuals[0];
         newManuals = newManuals.filter(m => m !== toUnlock);
      }
      
      setManualSplitIds(newManuals);
      setSelectedBeneficiaries(newSelected);
      
      const total = splitMode === 'EXACT' ? parseFloat(amount || '0') : 100;
      const distributed = distributeRemaining(total, newSplits, newManuals, newSelected);
      setSplitValues(distributed);

    } else {
      // Adding
      newSelected = [...selectedBeneficiaries, id];
      setSelectedBeneficiaries(newSelected);
      // New person is auto (not in manuals)
      // Just redistribute
      const total = splitMode === 'EXACT' ? parseFloat(amount || '0') : 100;
      const distributed = distributeRemaining(total, splitValues, newManuals, newSelected);
      setSplitValues(distributed);
    }
  };

  // When switching modes, convert values
  const handleModeChange = (newMode: 'EXACT' | 'PERCENTAGE') => {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0) {
      setSplitMode(newMode);
      setSplitValues({}); // Clear if no amount
      return;
    }

    const newValues: Record<string, string> = {};
    
    if (newMode === 'PERCENTAGE') {
      // EXACT -> PERCENTAGE
      Object.entries(splitValues).forEach(([id, val]) => {
        const numVal = parseFloat(val as string);
        if (!isNaN(numVal)) {
          newValues[id] = formatAmount((numVal / total) * 100);
        } else {
          newValues[id] = '0';
        }
      });
    } else {
      // PERCENTAGE -> EXACT
      Object.entries(splitValues).forEach(([id, val]) => {
        const numVal = parseFloat(val as string);
        if (!isNaN(numVal)) {
          newValues[id] = formatAmount((numVal / 100) * total);
        } else {
          newValues[id] = '0';
        }
      });
    }
    
    setSplitValues(newValues);
    setSplitMode(newMode);
  };

  // ... handleSubmit logic needs update ...


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const rate = parseFloat(exchangeRate);

    if (!description.trim() || isNaN(numAmount) || numAmount <= 0 || isNaN(rate) || rate <= 0) return;

    if (!tag) {
      alert('חובה לבחור קטגוריה');
      return;
    }

    if (payerMode === 'SINGLE' && !singlePayer) {
      alert('חובה לבחור מי שילם');
      return;
    }

    if (isTransfer && payerMode === 'SINGLE' && selectedBeneficiaries.includes(singlePayer)) {
      alert('לא ניתן להעביר כסף לעצמך');
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

    let totalSplit = 0;
    finalSplits = selectedBeneficiaries.map(id => {
      let val = parseFloat(splitValues[id] || '0');
      
      if (splitMode === 'PERCENTAGE') {
        val = (val / 100) * numAmount;
      }
      
      totalSplit += val;
      return { participantId: id, amount: val * rate };
    });

    if (Math.abs(totalSplit - numAmount) > 0.01) {
      alert(`סכום החלוקה (${totalSplit.toFixed(2)}) לא שווה לסכום ההוצאה (${numAmount})`);
      return;
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
      exchangeRate: rate,
      notes: notes.trim()
    };

    onSave(expense);
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
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 relative">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">{initialExpense ? (isTransfer ? 'עריכת העברה' : 'עריכת הוצאה') : (isTransfer ? 'העברה חדשה' : 'הוספת הוצאה')}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          {!isTransfer && (
            <div>
              <div className="flex gap-2 overflow-x-auto p-2 scrollbar-hide">
                {trip.categories.map(cat => {
                  const Icon = ICON_MAP[cat.icon];
                  const isSelected = tag === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (!description || description === tag) {
                          setDescription(cat.name);
                        }
                        setTag(cat.name);
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
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">תיאור</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isTransfer}
              className={`w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${isTransfer ? 'bg-slate-50 text-slate-500' : ''}`}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val);
                  if (splitMode === 'EXACT') {
                    calculateEqualSplits(parseFloat(val));
                  }
                }}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-left"
                dir="ltr"
                placeholder="0.00"
              />
              <CurrencySelect 
                value={currency}
                onChange={setCurrency}
                className="w-32"
                short
              />
            </div>
            {currency !== trip.tripCurrency && (
              <div className="text-xs text-slate-500 mt-1 px-1 flex items-center gap-1" dir="ltr">
                 {isFetchingRate ? (
                   <>
                     <Loader2 className="w-3 h-3 animate-spin"/>
                     <span>מעדכן שער...</span>
                   </>
                 ) : (
                   <span>
                     ≈ {formatAmount(parseFloat(amount || '0') * parseFloat(exchangeRate || '0'))} {trip.tripCurrency}
                     <span className="opacity-70 mx-1">(1 {currency} = {formatAmount(parseFloat(exchangeRate || '0'))} {trip.tripCurrency})</span>
                   </span>
                 )}
              </div>
            )}
          </div>


        </div>

        <hr className="border-slate-100" />

        {/* Who Paid Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{isTransfer ? 'מי מעביר?' : 'מי שילם?'}</label>
          
          <Select
            value={payerMode === 'MULTIPLE' ? 'MULTIPLE' : singlePayer}
            onChange={(val) => {
              if (val === 'MULTIPLE') {
                setPayerMode('MULTIPLE');
              } else {
                setPayerMode('SINGLE');
                setSinglePayer(val);
              }
            }}
            options={[
              ...trip.participants.map(p => ({ value: p.id, label: p.name })),
              { value: 'MULTIPLE', label: 'מספר משתתפים' }
            ]}
            placeholder="בחר משתתף..."
            className="mb-3"
          />

          {payerMode === 'MULTIPLE' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {trip.participants.map(p => {
                const currentVal = parseFloat(multiPayers[p.id] || '0');
                const otherSum = Object.entries(multiPayers)
                  .filter(([id]) => id !== p.id)
                  .reduce((sum, [, val]) => sum + (parseFloat(val as string) || 0), 0);
                
                const totalTarget = parseFloat(amount || '0');
                const maxAllowed = Math.max(0, totalTarget - otherSum);
                const isOverLimit = currentVal > maxAllowed + 0.01;

                return (
                  <div key={p.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                    <div className="relative w-40">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={multiPayers[p.id] || ''}
                        onChange={(e) => setMultiPayers({...multiPayers, [p.id]: e.target.value})}
                        className={`w-full p-2 pl-12 pr-4 border rounded-lg text-left outline-none transition-colors ${
                          isOverLimit 
                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                        dir="ltr"
                        placeholder="0.00"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                    </div>
                  </div>
                );
              })}
              
              <div className="text-xs text-slate-500 text-left mt-2 pt-2 border-t border-slate-200" dir="ltr">
                {(() => {
                  const sum = Object.values(multiPayers).reduce<number>((s, val) => s + (parseFloat(val as string) || 0), 0);
                  const total = parseFloat(amount || '0');
                  const diff = Math.abs(sum - total);
                  const isMatch = diff < 0.01;
                  
                  return (
                    <span className={isMatch ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                      סה"כ שולם: {formatAmount(sum)} / {formatAmount(total)}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* How to Split Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{isTransfer ? 'למי מעבירים?' : 'איך מתחלקים?'}</label>
          
          {/* Controls */}
          {!isTransfer && (
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                 <Select
                   value={splitMode}
                   onChange={(val) => handleModeChange(val as 'EXACT' | 'PERCENTAGE')}
                   options={[
                     { value: 'EXACT', label: 'סכומים מדויקים' },
                     { value: 'PERCENTAGE', label: 'חלוקה לפי אחוזים' }
                   ]}
                 />
              </div>
              <button
                type="button"
                onClick={handleEqualSplit}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                חלוקה שווה
              </button>
            </div>
          )}

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {trip.participants.map(p => {
              // In transfer mode, hide the payer from the list
              if (isTransfer && p.id === singlePayer) return null;

              const isSelected = selectedBeneficiaries.includes(p.id);
              const currentVal = parseFloat(splitValues[p.id] || '0');
              
              // Calculate remaining/max
              const otherSum = Object.entries(splitValues)
                .filter(([id]) => id !== p.id)
                .reduce((sum, [, val]) => {
                  const v = parseFloat(val as string) || 0;
                  return sum + (v > 0 ? v : 0);
                }, 0);
              
              const totalTarget = splitMode === 'EXACT' ? parseFloat(amount || '0') : 100;
              const maxAllowed = Math.max(0, totalTarget - otherSum);
              const isOverLimit = currentVal > maxAllowed + 0.01;

              // Determine split amount text for percentage mode
              let splitAmountText = '';
              if (splitMode === 'PERCENTAGE' && isSelected) {
                 const pct = parseFloat(splitValues[p.id] || '0');
                 const total = parseFloat(amount || '0');
                 if (!isNaN(pct) && !isNaN(total)) {
                    const val = (pct / 100) * total;
                    splitAmountText = `(${formatAmount(val)} ${currency})`;
                 }
              }

              const isManual = manualSplitIds.includes(p.id);

              return (
                <div 
                  key={p.id} 
                  className={`flex flex-col gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer select-none flex-1"
                      onClick={() => {
                        if (isTransfer) {
                          // Exclusive selection for transfer
                          setSelectedBeneficiaries([p.id]);
                          // Set 100% value
                          const total = parseFloat(amount || '0');
                          setSplitValues({ [p.id]: splitMode === 'EXACT' ? total.toString() : '100' });
                        } else {
                          toggleBeneficiary(p.id);
                        }
                      }}
                    >
                      <div className={`w-6 h-6 ${isTransfer ? 'rounded-full' : 'rounded-md'} border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                        {isSelected && (isTransfer ? <div className="w-2.5 h-2.5 rounded-full bg-white" /> : <Check className="w-4 h-4 stroke-[3]" />)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {p.name}
                        </span>
                        {splitAmountText && <span className="text-xs font-normal text-slate-500">{splitAmountText}</span>}
                      </div>
                    </div>
                    
                    {!isTransfer && (
                      <div className="relative w-40">
                        <input
                          type="number"
                          min="0"
                          step={splitMode === 'EXACT' ? "0.01" : "0.1"}
                          value={splitValues[p.id] || ''}
                          onChange={(e) => {
                            if (!isSelected) toggleBeneficiary(p.id);
                            handleSplitChange(p.id, e.target.value);
                          }}
                          className={`w-full p-2 pl-12 pr-8 border rounded-lg text-left outline-none transition-colors ${
                            isOverLimit 
                              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                              : isManual
                                ? 'border-amber-200 bg-amber-50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                                : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                          dir="ltr"
                          placeholder="0.00"
                          disabled={!isSelected}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          {splitMode === 'EXACT' ? currency : '%'}
                        </span>
                        {isManual && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" title="סכום קבוע ידנית">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {!isTransfer && (
              <div className="text-xs text-slate-500 text-left mt-2 pt-2 border-t border-slate-200" dir="ltr">
                סה"כ: {formatAmount(Object.values(splitValues).reduce<number>((sum, val: string) => sum + (parseFloat(val) || 0), 0))} / {splitMode === 'EXACT' ? (amount || '0.00') : '100%'}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">הערות</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-24"
            placeholder="הוסף הערות להוצאה זו..."
          />
        </div>

        {/* Date */}
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

        <div className="flex gap-3 pt-4">
          <button 
            type="submit"
            className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            {initialExpense ? (isTransfer ? 'עדכן העברה' : 'עדכן הוצאה') : (isTransfer ? 'שמור העברה' : 'שמור הוצאה')}
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
