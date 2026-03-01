import { Trip, Expense } from '../types';
import { ICON_MAP } from '../utils/categories';
import { ArrowRightLeft, Pencil, Trash2, X, Calendar, User, Users, FileText } from 'lucide-react';

type Props = {
  trip: Trip;
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export const ExpenseDetails = ({ trip, expense, onEdit, onDelete, onClose }: Props) => {
  const category = trip.categories.find(c => c.name === expense.tag);
  let Icon = category ? ICON_MAP[category.icon] : null;
  let iconColor = category?.color;

  if (expense.tag === 'העברה') {
    Icon = ArrowRightLeft;
    iconColor = '#f97316'; // orange-500
  }

  const getParticipantName = (id: string) => trip.participants.find(p => p.id === id)?.name || 'לא ידוע';

  // Normalize payers for display
  const payers = expense.payers || 
    ((expense as any).paidBy ? [{ participantId: (expense as any).paidBy, amount: expense.amount }] : []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
      <button 
        onClick={onClose}
        className="absolute top-4 left-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
      >
        <X className="w-5 h-5 text-slate-500" />
      </button>

      <div className="flex flex-col items-center mb-6 mt-2">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md mb-4"
          style={{ backgroundColor: iconColor || '#94a3b8' }}
        >
          {Icon ? <Icon className="w-8 h-8" /> : <span className="text-2xl">?</span>}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 text-center">{expense.description}</h2>
        <div className="text-3xl font-bold text-indigo-600 mt-2" dir="ltr">
          {expense.amount.toFixed(2)} {trip.tripCurrency}
        </div>
        {expense.originalCurrency && expense.originalCurrency !== trip.tripCurrency && expense.exchangeRate && (
          <div className="text-sm text-slate-400 mt-1" dir="ltr">
            ({(expense.amount / expense.exchangeRate).toFixed(2)} {expense.originalCurrency})
          </div>
        )}
        <div className="flex items-center gap-2 mt-4 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full text-sm">
          <Calendar className="w-4 h-4" />
          {new Date(expense.date).toLocaleDateString('he-IL')}
        </div>
      </div>

      <div className="space-y-6">
        {/* Payers Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            מי שילם?
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            {payers.map((payer, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">{getParticipantName(payer.participantId)}</span>
                <span className="text-slate-600" dir="ltr">{payer.amount.toFixed(2)} {trip.tripCurrency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Splits Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            עבור מי?
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            {expense.splits.map((split, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">{getParticipantName(split.participantId)}</span>
                <span className="text-slate-600" dir="ltr">{split.amount.toFixed(2)} {trip.tripCurrency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        {expense.notes && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              הערות
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-slate-700 whitespace-pre-wrap">
              {expense.notes}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
        <button 
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          ערוך
        </button>
        <button 
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 p-3 rounded-xl font-medium hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          מחק
        </button>
      </div>
    </div>
  );
};
