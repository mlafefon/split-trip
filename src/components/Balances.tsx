import { Trip } from '../types';
import { calculateBalances, calculateSettlement } from '../utils/settlement';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { formatAmount } from '../utils/currency';
import { getParticipantName } from '../utils/participants';

type Props = {
  trip: Trip;
  exchangeRate: number | null;
  onSelectParticipant?: (id: string) => void;
  onSettleDebt?: (data: { from: string; to: string; amount: number }) => void;
  currentUserId?: string | null;
};

export const Balances = ({ trip, exchangeRate, onSelectParticipant, onSettleDebt, currentUserId }: Props) => {
  const balances = calculateBalances(trip);
  const transactions = calculateSettlement(balances);

  return (
    <div className="space-y-8">
      {/* Balances Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 px-1">יתרות</h3>
        <div className="space-y-3">
          {Object.entries(balances).map(([id, balance]) => {
            const isPositive = balance > 0.01;
            const isNegative = balance < -0.01;
            const isZero = !isPositive && !isNegative;

            return (
              <div 
                key={id} 
                onClick={() => onSelectParticipant?.(id)}
                className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center ${onSelectParticipant ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
              >
                <div className="font-bold text-slate-800">{getParticipantName(id, trip.participants, currentUserId)}</div>
                <div className="flex items-center gap-3 pl-2">
                  <div className={`text-left ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400'}`} dir="ltr">
                    <div className="font-bold">
                      {isPositive ? '+' : ''}{formatAmount(balance)} <span className="text-[70%]">{trip.tripCurrency}</span>
                    </div>
                    <div className="text-xs mt-0.5 flex items-center gap-2">
                      {exchangeRate && trip.baseCurrency !== trip.tripCurrency && !isZero && (
                        <span className="opacity-60">
                          ≈ {isPositive ? '+' : ''}{formatAmount(balance * exchangeRate)} <span className="text-[70%]">{trip.baseCurrency}</span>
                        </span>
                      )}
                      <span className="opacity-80">
                        {isPositive ? 'חייבים לו' : isNegative ? 'חייב לאחרים' : 'מאוזן'}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlements Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 px-1">התחשבנות</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="text-emerald-500 text-3xl mb-2">🎉</div>
            <h3 className="text-base font-bold text-slate-800">הכל מיושב!</h3>
            <p className="text-sm text-slate-500">אף אחד לא חייב כסף לאף אחד.</p>
          </div>
        ) : (
          <>
            <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-sm">
              זוהי הדרך היעילה ביותר להתחשבן בין כולם במינימום העברות.
            </div>
            
            <div className="space-y-3">
              {transactions.map((t, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex-1 text-center font-medium text-slate-800 bg-slate-50 py-2 rounded-lg">
                    {getParticipantName(t.from, trip.participants, currentUserId)}
                  </div>
                  
                  <div className="flex flex-col items-center text-indigo-600 px-2" dir="ltr">
                    <div className="font-bold whitespace-nowrap">{formatAmount(t.amount)} <span className="text-[70%]">{trip.tripCurrency}</span></div>
                    <ArrowLeft className="w-5 h-5 my-1" />
                    {exchangeRate && trip.baseCurrency !== trip.tripCurrency && (
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        ≈ {formatAmount(t.amount * exchangeRate)} <span className="text-[70%]">{trip.baseCurrency}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center font-medium text-slate-800 bg-slate-50 py-2 rounded-lg">
                    {getParticipantName(t.to, trip.participants, currentUserId)}
                  </div>

                  {onSettleDebt && (
                    <button
                      onClick={() => onSettleDebt({ from: t.from, to: t.to, amount: t.amount })}
                      className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      הסדר חוב
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
