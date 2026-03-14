import React from 'react';
import { Trip } from '../types';
import { Activity, ChevronLeft } from 'lucide-react';
import { getParticipantName } from '../utils/participants';

type Props = {
  trip: Trip;
  onClose: () => void;
  currentUserId?: string | null;
  onExpenseClick?: (expenseId: string) => void;
};

export const ActivityLog = ({ trip, onClose, currentUserId, onExpenseClick }: Props) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">יומן פעולות</h2>
      </div>

      <div className="space-y-4">
        {(!trip.activityLog || trip.activityLog.length === 0) ? (
          <div className="text-center py-12 text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>אין עדיין פעילויות בטיול זה.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...trip.activityLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => {
              const participantName = getParticipantName(log.participantId, trip.participants, currentUserId);
              
              let expenseId = log.entityId;
              if (!expenseId && (log.action === 'ADD_EXPENSE' || log.action === 'UPDATE_EXPENSE')) {
                const match = log.details?.match(/הוצאה: (.*)$/);
                if (match) {
                  const desc = match[1];
                  const expense = trip.expenses.find(e => e.description === desc);
                  if (expense) {
                    expenseId = expense.id;
                  }
                }
              }
              
              const isClickable = !!expenseId && trip.expenses.some(e => e.id === expenseId) && onExpenseClick;

              return (
                <div 
                  key={log.id} 
                  onClick={() => isClickable && expenseId ? onExpenseClick(expenseId) : undefined}
                  className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between gap-3 ${isClickable ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-full shrink-0 mt-1">
                      <Activity className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-800">
                        <span className="font-bold">{participantName}</span> {log.details}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(log.timestamp).toLocaleString('he-IL')}
                      </div>
                    </div>
                  </div>
                  {isClickable && (
                    <div className="flex items-center self-stretch">
                      <ChevronLeft className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
