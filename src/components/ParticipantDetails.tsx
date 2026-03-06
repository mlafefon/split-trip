import { Trip, Expense } from '../types';
import { ArrowRight, ArrowRightLeft, Receipt, ChevronLeft } from 'lucide-react';
import { formatAmount } from '../utils/currency';

type Props = {
  trip: Trip;
  participantId: string;
  onClose: () => void;
  onSelectExpense: (expenseId: string) => void;
};

export const ParticipantDetails = ({ trip, participantId, onClose, onSelectExpense }: Props) => {
  const participant = trip.participants.find(p => p.id === participantId);

  if (!participant) return null;

  const getParticipantName = (id: string) => trip.participants.find(p => p.id === id)?.name || 'לא ידוע';

  const transactions = trip.expenses.map(expense => {
    // Calculate how much this participant paid
    const payers = expense.payers || 
      ((expense as any).paidBy ? [{ participantId: (expense as any).paidBy, amount: expense.amount }] : []);
    
    const paidAmount = payers
      .filter(p => p.participantId === participantId)
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate how much this participant is responsible for
    const splitAmount = expense.splits
      .filter(s => s.participantId === participantId)
      .reduce((sum, s) => sum + s.amount, 0);

    const net = paidAmount - splitAmount;

    if (Math.abs(net) < 0.01) return null; // Skip if net is zero

    let details = '';
    
    if (net < 0) {
      // They owe money (Red)
      // Who paid?
      const otherPayers = payers
        .filter(p => p.participantId !== participantId)
        .map(p => getParticipantName(p.participantId));
      
      if (otherPayers.length > 0) {
        details = `שולם ע"י ${otherPayers.join(', ')}`;
      } else {
        details = 'שולם ע"י אחרים';
      }
    } else {
      // They are owed money (Green)
      // Who did they pay for?
      // This is tricky because "paying for others" implies covering their splits.
      // We can list the other splitters.
      const otherSplitters = expense.splits
        .filter(s => s.participantId !== participantId)
        .map(s => getParticipantName(s.participantId));
      
      if (otherSplitters.length > 0) {
        details = `עבור ${otherSplitters.join(', ')}`;
      } else {
        details = 'עבור אחרים';
      }
    }

    return {
      expense,
      net,
      details
    };
  }).filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => new Date(b.expense.date).getTime() - new Date(a.expense.date).getTime());

  // Calculate total balance
  const totalBalance = transactions.reduce((sum, t) => sum + t.net, 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
      <div className="flex flex-col items-center mb-6 mt-2">
        <h2 className="text-2xl font-bold text-slate-800 text-center">{participant.name}</h2>
        <div className={`text-3xl font-bold mt-2 ${totalBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
          {totalBalance >= 0 ? '+' : ''}{formatAmount(Math.abs(totalBalance))} {trip.tripCurrency}
        </div>
        <div className="text-sm text-slate-500 mt-1">
          {totalBalance >= 0 ? 'חייבים לו/ה' : 'חייב/ת'}
        </div>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>אין פעילות כספית למשתתף זה.</p>
          </div>
        ) : (
          transactions.map(({ expense, net, details }) => (
            <div 
              key={expense.id} 
              onClick={() => onSelectExpense(expense.id)}
              className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0 ml-4">
                <div className="font-bold text-slate-800 truncate">{expense.description}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  {expense.tag === 'העברה' ? <ArrowRightLeft className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                  <span className="truncate">{details}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <div className={`font-bold text-lg whitespace-nowrap ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
                    {net >= 0 ? '+' : ''}{formatAmount(Math.abs(net))} {trip.tripCurrency}
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 pr-7" dir="ltr">
                  {new Date(expense.date).toLocaleDateString('he-IL')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
