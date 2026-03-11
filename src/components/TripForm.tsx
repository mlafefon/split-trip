import React, { useState, useEffect, useRef } from 'react';
import { Trip, Participant, Category } from '../types';
import { CURRENCIES, fetchExchangeRates } from '../utils/currency';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import { X, Plus, ChevronDown, Pencil, Check, Loader2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { CurrencySelect } from './CurrencySelect';
import { ConfirmDialog } from './ConfirmDialog';

type Props = {
  initialTrip?: Trip;
  onSave: (trip: Trip) => void;
  onCancel: () => void;
  currentUserId?: string | null;
  setCurrentUserId?: (id: string | null) => void;
};

export const TripForm = ({ initialTrip, onSave, onCancel, currentUserId, setCurrentUserId }: Props) => {
  const [destination, setDestination] = useState(initialTrip?.destination || '');
  const [icon, setIcon] = useState(initialTrip?.icon || '✈️');
  const [baseCurrency, setBaseCurrency] = useState(initialTrip?.baseCurrency || 'ILS');
  const [tripCurrency, setTripCurrency] = useState(initialTrip?.tripCurrency || 'EUR');
  const [participants, setParticipants] = useState<Participant[]>(
    initialTrip?.participants || []
  );
  const [categories, setCategories] = useState<Category[]>(
    initialTrip?.categories || DEFAULT_CATEGORIES
  );
  const [notes, setNotes] = useState(initialTrip?.notes || '');
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = 'auto';
      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
    }
  }, [notes]);

  const [newParticipantName, setNewParticipantName] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCurrencyConfirm, setShowCurrencyConfirm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localCurrentUserId, setLocalCurrentUserId] = useState<string | null>(currentUserId || null);

  // If initialTrip changes (e.g. when switching trips), update state
  useEffect(() => {
    if (initialTrip) {
      setDestination(initialTrip.destination);
      setIcon(initialTrip.icon || '✈️');
      setBaseCurrency(initialTrip.baseCurrency);
      setTripCurrency(initialTrip.tripCurrency);
      setParticipants(initialTrip.participants);
      setCategories(initialTrip.categories);
      setNotes(initialTrip.notes || '');
      setLocalCurrentUserId(currentUserId || null);
    }
  }, [initialTrip, currentUserId]);

  const handleAddParticipant = () => {
    if (newParticipantName.trim()) {
      if (participants.some(p => p.name.trim().toLowerCase() === newParticipantName.trim().toLowerCase())) {
        alert('משתתף עם שם זה כבר קיים.');
        return;
      }
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
      if (participants.some(p => p.id !== editingParticipantId && p.name.trim().toLowerCase() === editingName.trim().toLowerCase())) {
        alert('משתתף עם שם זה כבר קיים.');
        return;
      }
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
      icon,
      baseCurrency,
      tripCurrency,
      participants,
      expenses: updatedExpenses,
      categories: categories,
      createdAt: initialTrip?.createdAt || new Date().toISOString(),
      notes: notes.trim(),
      activityLog: initialTrip?.activityLog || []
    };

    if (!initialTrip && participants.length > 0) {
      tripData.activityLog = [{
        id: crypto.randomUUID(),
        participantId: participants[0].id,
        action: 'CREATE_TRIP',
        timestamp: new Date().toISOString(),
        details: 'יצר/ה את הטיול'
      }];
    }

    if (initialTrip && setCurrentUserId) {
      setCurrentUserId(localCurrentUserId);
    }

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
          <div className="flex gap-2 relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-[50px] h-[50px] flex items-center justify-center text-2xl bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
            >
              {icon}
            </button>
            {showEmojiPicker && (
              <div className="absolute top-14 right-0 z-50 shadow-xl rounded-xl">
                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                <div className="relative z-50">
                  <EmojiPicker 
                    onEmojiClick={(emojiData) => {
                      setIcon(emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    width={300}
                    height={400}
                  />
                </div>
              </div>
            )}
            <input 
              type="text" 
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-[50px] p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="לדוגמה: פריז, תאילנד..."
            />
          </div>
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
              className="flex-1 h-[50px] p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder={participants.length === 0 ? "השם שלי..." : "שם המשתתף..."}
            />
            <button 
              type="button"
              onClick={handleAddParticipant}
              className="bg-slate-100 h-[50px] text-slate-700 p-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
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

        {initialTrip && setCurrentUserId && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">מי אתה?</label>
            <select
              value={localCurrentUserId || ''}
              onChange={(e) => setLocalCurrentUserId(e.target.value || null)}
              className="w-full h-[50px] p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="" disabled>בחר משתתף...</option>
              <option value="none">אף אחד (צופה בלבד)</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">הערות</label>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={1}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none overflow-hidden"
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
