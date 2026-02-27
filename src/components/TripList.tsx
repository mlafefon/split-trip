import { useState } from 'react';
import { Trip } from '../types';
import { Plane, Users, Calendar, Trash2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

type Props = {
  trips: Trip[];
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
};

export const TripList = ({ trips, onSelect, onCreateNew, onDelete }: Props) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog 
        isOpen={!!deleteId}
        title="מחיקת טיול"
        message="האם אתה בטוח שברצונך למחוק טיול זה? הפעולה אינה הפיכה."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">הטיולים שלי</h2>
        <button 
          onClick={onCreateNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + טיול חדש
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">עדיין אין טיולים. צור את הטיול הראשון שלך!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map(trip => (
            <div 
              key={trip.id} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelect(trip.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800">{trip.destination}</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(trip.id);
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{trip.participants.length} משתתפים</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(trip.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
              </div>
              
              <div className="mt-2 pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">
                  סה"כ הוצאות:
                </span>
                <span className="font-bold text-indigo-600">
                  {trip.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} {trip.tripCurrency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
