import React, { useState, useEffect } from 'react';
import { Trip, Participant, Category } from '../types';
import { CURRENCIES, fetchExchangeRates } from '../utils/currency';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { X, Plus, ChevronDown, Pencil, Check, Loader2 } from 'lucide-react';
import { CurrencySelect } from './CurrencySelect';
import { ConfirmDialog } from './ConfirmDialog';

type Props = {
  initialTrip?: Trip;
  onSave: (trip: Trip) => void;
  onCancel: () => void;
};

export const TripForm = ({ initialTrip, onSave, onCancel }: Props) => {
  const [destination, setDestination] = useState(initialTrip?.destination || '');
  const [baseCurrency, setBaseCurrency] = useState(initialTrip?.baseCurrency || 'ILS');
  const [tripCurrency, setTripCurrency] = useState(initialTrip?.tripCurrency || 'EUR');
  const [participants, setParticipants] = useState<Participant[]>(
    initialTrip?.participants || []
  );
  const [categories, setCategories] = useState<Category[]>(
    initialTrip?.categories || DEFAULT_CATEGORIES
  );
  const [notes, setNotes] = useState(initialTrip?.notes || '');
  const [newParticipantName, setNewParticipantName] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCurrencyConfirm, setShowCurrencyConfirm] = useState(false);

  // If initialTrip changes (e.g. when switching trips), update state
  useEffect(() => {
    if (initialTrip) {
      setDestination(initialTrip.destination);
      setBaseCurrency(initialTrip.baseCurrency);
      setTripCurrency(initialTrip.tripCurrency);
      setParticipants(initialTrip.participants);
      setCategories(initialTrip.categories);
      setNotes(initialTrip.notes || '');
    }
  }, [initialTrip]);

  const handleAddParticipant = () => {
    if (newParticipantName.trim()) {
      setParticipants([...participants, { id: crypto.randomUUID(), name: newParticipantName.trim() }]);
      setNewParticipantName('');
    }
  };

  const handleRemoveParticipant = (id: string) => {
    // Prevent removing if it's the last participant
    if (participants.length <= 1) return;
    
    // If editing an existing trip, check if participant has expenses
    if (initialTrip) {
      const hasExpenses = initialTrip.expenses.some(e => 
        (e.payers?.some(p => p.participantId === id)) || 
        ((e as any).paidBy === id) || 
        e.splits.some(s => s.participantId === id)
      );
      
      if (hasExpenses) {
        alert('לא ניתן להסיר משתתף שיש לו הוצאות או חלק בהוצאות קיימות.');
        return;
      }
    }

    setParticipants(participants.filter(p => p.id !== id));
  };

  const startEditingParticipant = (p: Participant) => {
    setEditingParticipantId(p.id);
    setEditingName(p.name);
  };

  const saveParticipantName = () => {
    if (editingParticipantId && editingName.trim()) {
      setParticipants(participants.map(p => 
        p.id === editingParticipantId ? { ...p, name: editingName.trim() } : p
      ));
      setEditingParticipantId(null);
      setEditingName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || participants.length === 0) return;

    // Check if trip currency changed and we have expenses
    if (initialTrip && tripCurrency !== initialTrip.tripCurrency && initialTrip.expenses.length > 0) {
      setShowCurrencyConfirm(true);
      return;
    }

    // Otherwise save directly
    saveTrip(false);
  };

  const saveTrip = async (shouldUpdateExpenses: boolean) => {
    let updatedExpenses = initialTrip?.expenses || [];

    if (shouldUpdateExpenses && initialTrip) {
      setIsProcessing(true);
      try {
        // Group expenses by original currency to minimize API calls
        const currencies = new Set<string>();
        updatedExpenses.forEach(e => {
          currencies.add(e.originalCurrency || initialTrip.tripCurrency);
        });

        const ratesMap: Record<string, Record<string, number>> = {};
        
        // Fetch rates for all source currencies
        await Promise.all(Array.from(currencies).map(async (currency) => {
          if (currency === tripCurrency) return; // No need if same
          const rates = await fetchExchangeRates(currency);
          if (rates) {
            ratesMap[currency] = rates;
          }
        }));

        updatedExpenses = updatedExpenses.map(e => {
          const sourceCurrency = e.originalCurrency || initialTrip.tripCurrency;
          
          // If source is same as new target, rate is 1
          if (sourceCurrency === tripCurrency) {
             const originalAmount = e.amount / (e.exchangeRate || 1);
             return {
               ...e,
               amount: originalAmount,
               exchangeRate: 1,
               originalCurrency: sourceCurrency,
               payers: e.payers.map(p => ({ ...p, amount: (p.amount / e.amount) * originalAmount })),
               splits: e.splits.map(s => ({ ...s, amount: (s.amount / e.amount) * originalAmount }))
             };
          }

          const rates = ratesMap[sourceCurrency];
          if (!rates || !rates[tripCurrency]) {
            console.warn(`Could not find rate for ${sourceCurrency} to ${tripCurrency}`);
            return e; // Keep as is if rate not found
          }

          const newRate = rates[tripCurrency];
          const originalAmount = e.amount / (e.exchangeRate || 1);
          const newAmount = originalAmount * newRate;
          const ratio = newAmount / e.amount;

          return {
            ...e,
            amount: newAmount,
            exchangeRate: newRate,
            originalCurrency: sourceCurrency, // Ensure it's set
            payers: e.payers.map(p => ({ ...p, amount: p.amount * ratio })),
            splits: e.splits.map(s => ({ ...s, amount: s.amount * ratio }))
          };
        });

      } catch (error) {
        console.error('Failed to update expenses currency', error);
        alert('אירעה שגיאה בעדכון שערי המטבע. הטיול יישמר עם המטבע החדש אך ההוצאות לא עודכנו.');
      } finally {
        setIsProcessing(false);
      }
    }

    const tripData: Trip = {
      id: initialTrip?.id || crypto.randomUUID(),
      destination: destination.trim(),
      baseCurrency,
      tripCurrency,
      participants,
      expenses: updatedExpenses,
      categories: categories,
      createdAt: initialTrip?.createdAt || new Date().toISOString(),
      notes: notes.trim()
    };

    // Don't await onSave here to prevent the form from getting stuck if offline
    onSave(tripData);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
      <ConfirmDialog 
        isOpen={showCurrencyConfirm}
        title="שינוי מטבע טיול"
        message={`שינוי מטבע הטיול מ-${initialTrip?.tripCurrency} ל-${tripCurrency} יעדכן את כל ההוצאות הקיימות לפי שערים עדכניים. האם להמשיך?`}
        confirmText="עדכן הוצאות"
        cancelText="ביטול"
        isDestructive={false}
        onConfirm={() => {
          setShowCurrencyConfirm(false);
          saveTrip(true);
        }}
        onCancel={() => setShowCurrencyConfirm(false)}
      />

      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
          <p className="text-slate-600 font-medium">מעדכן שערי מטבע...</p>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {initialTrip ? 'עריכת טיול' : 'יצירת טיול חדש'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">יעד הטיול</label>
          <input 
            type="text" 
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="לדוגמה: פריז, תאילנד..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CurrencySelect 
            label="מטבע הבית"
            value={baseCurrency}
            onChange={setBaseCurrency}
            short
            align="right"
          />
          <CurrencySelect 
            label="מטבע הטיול"
            value={tripCurrency}
            onChange={setTripCurrency}
            short
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">משתתפים</label>
          <div className="flex gap-2 mb-3">
            <input 
              type="text" 
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddParticipant();
                }
              }}
              className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="שם המשתתף..."
            />
            <button 
              type="button"
              onClick={handleAddParticipant}
              className="bg-slate-100 text-slate-700 p-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <div key={p.id} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium border border-indigo-100">
                {editingParticipantId === p.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-24 p-1 text-sm border border-indigo-200 rounded focus:outline-none focus:border-indigo-500 bg-white"
                      autoFocus
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveParticipantName();
                        }
                      }}
                    />
                    <button type="button" onClick={saveParticipantName} className="text-emerald-600 hover:text-emerald-700">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {p.name}
                    <div className="flex items-center gap-1 mr-1 border-r border-indigo-200 pr-2">
                      <button type="button" onClick={() => startEditingParticipant(p)} className="text-indigo-400 hover:text-indigo-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {participants.length > 1 && (() => {
                        // Check if participant has expenses
                        const hasExpenses = initialTrip?.expenses.some(e => 
                          (e.payers?.some(payer => payer.participantId === p.id)) || 
                          ((e as any).paidBy === p.id) || 
                          e.splits.some(s => s.participantId === p.id)
                        );

                        if (hasExpenses) return null;

                        return (
                          <button type="button" onClick={() => handleRemoveParticipant(p.id)} className="text-indigo-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">הערות</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
            placeholder="הערות כלליות לטיול..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="submit"
            disabled={isProcessing}
            className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {initialTrip ? 'עדכן טיול' : 'שמור טיול'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 bg-slate-100 text-slate-700 p-3 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
};
