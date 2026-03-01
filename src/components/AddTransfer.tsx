import React, { useState, useEffect } from 'react';
import { Trip, Expense } from '../types';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import { CURRENCIES, fetchExchangeRates } from '../utils/currency';

type Props = {
  trip: Trip;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
};

export const AddTransfer = ({ trip, onSave, onCancel }: Props) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(trip.tripCurrency);
  const [exchangeRate, setExchangeRate] = useState('1');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [notes, setNotes] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const rate = parseFloat(exchangeRate);
    
    if (isNaN(numAmount) || numAmount <= 0 || isNaN(rate) || rate <= 0) return;
    if (!senderId || !receiverId) {
      alert('נא לבחור מעביר ומקבל');
      return;
    }
    if (senderId === receiverId) {
      alert('לא ניתן להעביר כסף לעצמך');
      return;
    }

    const sender = trip.participants.find(p => p.id === senderId);
    const receiver = trip.participants.find(p => p.id === receiverId);

    if (!sender || !receiver) return;

    const finalAmountInTripCurrency = numAmount * rate;

    const expense: Expense = {
      id: crypto.randomUUID(),
      description: `העברה מ${sender.name} ל${receiver.name}`,
      amount: finalAmountInTripCurrency,
      date: new Date().toISOString(),
      payers: [{ participantId: senderId, amount: finalAmountInTripCurrency }],
      splits: [{ participantId: receiverId, amount: finalAmountInTripCurrency }],
      tag: 'העברה',
      originalCurrency: currency,
      exchangeRate: rate,
      notes: notes.trim()
    };

    onSave(expense);
  };

  const handleSwap = () => {
    setSenderId(receiverId);
    setReceiverId(senderId);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">העברת כספים</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">מעביר</label>
            <select 
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">בחר...</option>
              {trip.participants
                .filter(p => p.id !== receiverId)
                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <button 
            type="button"
            onClick={handleSwap}
            className="text-slate-300 hover:text-indigo-500 transition-colors p-2 rounded-full hover:bg-slate-100"
            title="החלף כיוון"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">מקבל</label>
            <select 
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">בחר...</option>
              {trip.participants
                .filter(p => p.id !== senderId)
                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
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
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-left"
                dir="ltr"
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
              <div className="text-xs text-slate-500 mt-1 px-1 flex items-center gap-1" dir="ltr">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">הערות</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-24"
              placeholder="הוסף הערות להעברה זו..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="submit"
            className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            בצע העברה
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
