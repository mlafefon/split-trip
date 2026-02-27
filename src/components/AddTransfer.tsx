import React, { useState } from 'react';
import { Trip, Expense } from '../types';
import { ArrowLeft } from 'lucide-react';
import { CURRENCIES } from '../utils/currency';

type Props = {
  trip: Trip;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
};

export const AddTransfer = ({ trip, onSave, onCancel }: Props) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(trip.tripCurrency);
  const [exchangeRate, setExchangeRate] = useState('1');
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
      date: new Date(date).toISOString(),
      payers: [{ participantId: senderId, amount: finalAmountInTripCurrency }],
      splits: [{ participantId: receiverId, amount: finalAmountInTripCurrency }],
      tag: 'העברה',
      originalCurrency: currency,
      exchangeRate: rate
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

        <div className="grid grid-cols-2 gap-4">
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
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  if (e.target.value === trip.tripCurrency) {
                    setExchangeRate('1');
                  }
                }}
                className="w-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
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

        {currency !== trip.tripCurrency && (
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-orange-800 mb-1">
              שער המרה (1 {currency} = ? {trip.tripCurrency})
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                required
                min="0.0001"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="1.00"
              />
              <div className="text-sm text-orange-600 whitespace-nowrap">
                = {(parseFloat(amount || '0') * parseFloat(exchangeRate || '0')).toFixed(2)} {trip.tripCurrency}
              </div>
            </div>
          </div>
        )}

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
