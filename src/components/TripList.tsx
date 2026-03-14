import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip } from '../types';
import { Plane, Users, Calendar, Trash2, Archive, Eye, Pencil } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { AppIcon } from './AppIcon';
import { formatAmount } from '../utils/currency';

type Props = {
  trips: Trip[];
  archivedTrips: Trip[];
  loadingArchived: boolean;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  onLoadArchived: () => void;
  onUnarchive: (id: string) => void;
};

export const TripList = ({ trips, archivedTrips, loadingArchived, onSelect, onCreateNew, onDelete, onLoadArchived, onUnarchive }: Props) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [localTokens, setLocalTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalTokens(JSON.parse(localStorage.getItem('tripTokens') || '{}'));
  }, []);

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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100"
        >
          <AppIcon className="w-16 h-16 mx-auto mb-4 opacity-50 grayscale" />
          <p className="text-slate-500">עדיין אין טיולים. צור את הטיול הראשון שלך!</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {trips.map(trip => {
              const canEditTrip = (trip.editCode && localTokens[trip.id] === trip.editCode) || !trip.editCode;
              
              return (
                <motion.div 
                  key={trip.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelect(trip.id)}
                >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-2xl">{trip.icon || '✈️'}</span>
                    {trip.destination}
                  </h3>
                  <div 
                    className="text-slate-400 bg-slate-50 p-1.5 rounded-lg flex items-center justify-center"
                    title={canEditTrip ? 'הרשאת עריכה' : 'הרשאת צפייה'}
                  >
                    {canEditTrip ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
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
                    {formatAmount(trip.expenses
                      .filter(exp => exp.tag !== 'העברה')
                      .reduce((sum, exp) => sum + exp.amount, 0))} <span className="text-[70%]">{trip.tripCurrency}</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
        <button 
          onClick={() => {
            if (!showArchived) {
              onLoadArchived();
            }
            setShowArchived(!showArchived);
          }}
          className="text-slate-500 hover:text-indigo-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
        >
          <Archive className="w-4 h-4" />
          {showArchived ? 'הסתר טיולים בארכיון' : 'הצג טיולים בארכיון'}
        </button>
      </div>

      {showArchived && (
        <div className="mt-4 space-y-4">
          {loadingArchived ? (
            <div className="text-center py-4 text-slate-500">טוען ארכיון...</div>
          ) : archivedTrips.length === 0 ? (
            <div className="text-center py-4 text-slate-500">אין טיולים בארכיון</div>
          ) : (
            <div className="grid gap-4 opacity-75">
              {archivedTrips.map(trip => {
                const canEditTrip = (trip.editCode && localTokens[trip.id] === trip.editCode) || !trip.editCode;
                
                return (
                  <div 
                    key={trip.id} 
                    className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-600 flex items-center gap-2">
                        <span className="text-2xl opacity-75">{trip.icon || '✈️'}</span>
                        {trip.destination}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div 
                          className="text-slate-400 bg-white p-1.5 rounded-lg flex items-center justify-center border border-slate-100"
                          title={canEditTrip ? 'הרשאת עריכה' : 'הרשאת צפייה'}
                        >
                          {canEditTrip ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </div>
                        <button 
                          onClick={() => onUnarchive(trip.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium bg-indigo-50 px-3 py-1.5 rounded-lg"
                        >
                          החזר מהארכיון
                        </button>
                      </div>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
