import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip, Expense, Category } from '../types';
import { AddExpense } from './AddExpense';
import { TripForm } from './TripForm';
import { Balances } from './Balances';
import { Statistics } from './Statistics';
import { ExpenseDetails } from './ExpenseDetails';
import { ParticipantDetails } from './ParticipantDetails';
import { Receipt, Users, BarChart3, Plus, Trash2, Pencil, Loader2, ArrowRightLeft, Search, X, ChevronLeft, Activity, Filter } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { fetchExchangeRates, formatAmount } from '../utils/currency';
import { ICON_MAP } from '../utils/categories';
import { getParticipantName } from '../utils/participants';

type Props = {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
  setBackHandler: (handler: (() => boolean) | null) => void;
  isReadOnly?: boolean;
  isEditing: boolean;
  onEditChange: (isEditing: boolean) => void;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
  initialViewingExpenseId?: string | null;
  onClearInitialViewingExpenseId?: () => void;
};

type Tab = 'EXPENSES' | 'BALANCES' | 'STATISTICS';

export const TripView = ({ trip, updateTrip, setBackHandler, isReadOnly = false, isEditing, onEditChange, currentUserId, setCurrentUserId, initialViewingExpenseId, onClearInitialViewingExpenseId }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>('EXPENSES');
  const [addMode, setAddMode] = useState<'NONE' | 'EXPENSE' | 'TRANSFER'>('NONE');
  const [showMenu, setShowMenu] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [viewingExpenseId, setViewingExpenseId] = useState<string | null>(initialViewingExpenseId || null);
  const [viewingParticipantId, setViewingParticipantId] = useState<string | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  useEffect(() => {
    if (initialViewingExpenseId) {
      setViewingExpenseId(initialViewingExpenseId);
      setActiveTab('EXPENSES');
      if (onClearInitialViewingExpenseId) {
        onClearInitialViewingExpenseId();
      }
    }
  }, [initialViewingExpenseId, onClearInitialViewingExpenseId]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPayer, setSelectedPayer] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [settleDebtData, setSettleDebtData] = useState<{ from: string; to: string; amount: number } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, addMode, editingExpenseId, viewingExpenseId, viewingParticipantId, isEditing]);

  useEffect(() => {
    const hasModalOpen = addMode !== 'NONE' || editingExpenseId !== null || viewingExpenseId !== null || viewingParticipantId !== null || isEditing;

    if (hasModalOpen) {
      setBackHandler(() => {
        if (addMode !== 'NONE') {
          setAddMode('NONE');
          setSettleDebtData(null);
          return true;
        }
        if (editingExpenseId) {
          setEditingExpenseId(null);
          return true;
        }
        if (viewingExpenseId) {
          setViewingExpenseId(null);
          return true;
        }
        if (viewingParticipantId) {
          setViewingParticipantId(null);
          return true;
        }
        if (isEditing) {
          onEditChange(false);
          return true;
        }
        return false;
      });
    } else {
      setBackHandler(null);
    }

    return () => setBackHandler(null);
  }, [addMode, editingExpenseId, viewingExpenseId, viewingParticipantId, isEditing, setBackHandler, onEditChange]);

  useEffect(() => {
    const getRates = async () => {
      if (trip.baseCurrency !== trip.tripCurrency) {
        setIsFetchingRate(true);
        const rates = await fetchExchangeRates(trip.tripCurrency);
        if (rates && rates[trip.baseCurrency]) {
          setExchangeRate(rates[trip.baseCurrency]);
        }
        setIsFetchingRate(false);
      } else {
        setExchangeRate(1);
      }
    };
    getRates();
  }, [trip.baseCurrency, trip.tripCurrency]);

  const handleAddExpense = (expense: Expense) => {
    updateTrip({
      ...trip,
      expenses: [...trip.expenses, expense],
      activityLog: [
        ...(trip.activityLog || []),
        {
          id: crypto.randomUUID(),
          participantId: currentUserId || trip.participants[0].id,
          action: 'ADD_EXPENSE',
          timestamp: new Date().toISOString(),
          details: `הוסיף/ה הוצאה: ${expense.description}`,
          entityId: expense.id
        }
      ]
    });
    setAddMode('NONE');
    setSettleDebtData(null);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    updateTrip({
      ...trip,
      expenses: trip.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e),
      activityLog: [
        ...(trip.activityLog || []),
        {
          id: crypto.randomUUID(),
          participantId: currentUserId || trip.participants[0].id,
          action: 'UPDATE_EXPENSE',
          timestamp: new Date().toISOString(),
          details: `עדכן/ה הוצאה: ${updatedExpense.description}`,
          entityId: updatedExpense.id
        }
      ]
    });
    setEditingExpenseId(null);
  };

  const handleUpdateCategories = (categories: Category[]) => {
    updateTrip({
      ...trip,
      categories,
      activityLog: [
        ...(trip.activityLog || []),
        {
          id: crypto.randomUUID(),
          participantId: currentUserId || trip.participants[0].id,
          action: 'UPDATE_TRIP',
          timestamp: new Date().toISOString(),
          details: `עדכן/ה את קטגוריות הטיול`
        }
      ]
    });
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    updateTrip({
      ...updatedTrip,
      activityLog: [
        ...(updatedTrip.activityLog || []),
        {
          id: crypto.randomUUID(),
          participantId: currentUserId || updatedTrip.participants[0].id,
          action: 'UPDATE_TRIP',
          timestamp: new Date().toISOString(),
          details: `עדכן/ה את פרטי הטיול`
        }
      ]
    });
    onEditChange(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setDeleteExpenseId(expenseId);
  };

  const confirmDeleteExpense = () => {
    if (deleteExpenseId) {
      const expenseToDelete = trip.expenses.find(e => e.id === deleteExpenseId);
      updateTrip({
        ...trip,
        expenses: trip.expenses.filter(e => e.id !== deleteExpenseId),
        activityLog: [
          ...(trip.activityLog || []),
          {
            id: crypto.randomUUID(),
            participantId: currentUserId || trip.participants[0].id,
            action: 'DELETE_EXPENSE',
            timestamp: new Date().toISOString(),
            details: `מחק/ה הוצאה: ${expenseToDelete?.description || ''}`
          }
        ]
      });
      setDeleteExpenseId(null);
    }
  };

  const handleSettleDebt = (data: { from: string; to: string; amount: number }) => {
    setSettleDebtData(data);
    setAddMode('TRANSFER');
  };

  const totalSpent = trip.expenses
    .filter(e => e.tag !== 'העברה')
    .reduce((sum, e) => sum + e.amount, 0);

  const activeCategories = useMemo(() => {
    const usedTags = new Set(trip.expenses.map(e => e.tag).filter(Boolean));
    return trip.categories.filter(c => usedTags.has(c.name));
  }, [trip.expenses, trip.categories]);

  const toggleFilters = () => {
    if (showFilters) {
      setSelectedCategory(null);
      setSelectedPayer(null);
    }
    setShowFilters(!showFilters);
  };

  const filteredExpenses = trip.expenses.filter(expense => {
    // Check category filter
    if (selectedCategory && expense.tag !== selectedCategory) return false;

    // Check payer filter
    if (selectedPayer) {
      const payers = expense.payers || 
        ((expense as any).paidBy ? [{ participantId: (expense as any).paidBy, amount: expense.amount }] : []);
      if (!payers.some(p => p.participantId === selectedPayer)) return false;
    }

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    // Check description
    if (expense.description.toLowerCase().includes(query)) return true;
    
    // Check tag
    if (expense.tag?.toLowerCase().includes(query)) return true;
    
    // Check payer names
    const payers = expense.payers || 
      ((expense as any).paidBy ? [{ participantId: (expense as any).paidBy, amount: expense.amount }] : []);
    const payerNames = payers.map(p => trip.participants.find(part => part.id === p.participantId)?.name || '');
    if (payerNames.some(name => name.toLowerCase().includes(query))) return true;
    
    return false;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <TripForm 
          key="trip-form"
          initialTrip={trip}
          onSave={handleUpdateTrip}
          onCancel={() => onEditChange(false)}
          currentUserId={currentUserId}
          setCurrentUserId={setCurrentUserId}
        />
      ) : addMode === 'EXPENSE' ? (
        <AddExpense 
          key="add-expense"
          trip={trip} 
          onSave={handleAddExpense} 
          onCancel={() => setAddMode('NONE')} 
          onUpdateCategories={handleUpdateCategories}
          currentUserId={currentUserId}
        />
      ) : addMode === 'TRANSFER' ? (
        <AddExpense 
          key="add-transfer"
          trip={trip} 
          onSave={handleAddExpense} 
          onCancel={() => {
            setAddMode('NONE');
            setSettleDebtData(null);
          }} 
          onUpdateCategories={handleUpdateCategories}
          defaultMode="TRANSFER"
          initialData={settleDebtData ? {
            amount: settleDebtData.amount,
            description: 'הסדר חוב',
            tag: 'העברה',
            notes: 'הסדר חוב',
            payers: [{ participantId: settleDebtData.from, amount: settleDebtData.amount }],
            splits: [{ participantId: settleDebtData.to, amount: settleDebtData.amount }],
            originalCurrency: trip.tripCurrency
          } : undefined}
          currentUserId={currentUserId}
        />
      ) : editingExpenseId ? (
        <AddExpense 
          key="edit-expense"
          trip={trip} 
          initialExpense={trip.expenses.find(e => e.id === editingExpenseId)}
          onSave={handleUpdateExpense} 
          onCancel={() => setEditingExpenseId(null)} 
          onUpdateCategories={handleUpdateCategories}
          currentUserId={currentUserId}
        />
      ) : viewingExpenseId ? (
        <ExpenseDetails 
          key="view-expense"
          trip={trip}
          expense={trip.expenses.find(e => e.id === viewingExpenseId)!}
          onEdit={() => {
            setViewingExpenseId(null);
            setEditingExpenseId(viewingExpenseId);
          }}
          onDelete={() => {
            setViewingExpenseId(null);
            setDeleteExpenseId(viewingExpenseId);
          }}
          onClose={() => setViewingExpenseId(null)}
          isReadOnly={isReadOnly}
          currentUserId={currentUserId}
        />
      ) : viewingParticipantId ? (
        <ParticipantDetails 
          key="view-participant"
          trip={trip}
          participantId={viewingParticipantId}
          onClose={() => setViewingParticipantId(null)}
          onSelectExpense={setViewingExpenseId}
          currentUserId={currentUserId}
        />
      ) : (
        <motion.div key="trip-view-main" className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ConfirmDialog 
            isOpen={!!deleteExpenseId}
            title="מחיקת הוצאה"
            message="האם אתה בטוח שברצונך למחוק הוצאה זו? הפעולה אינה הפיכה."
            onConfirm={confirmDeleteExpense}
            onCancel={() => setDeleteExpenseId(null)}
          />

      {/* User Identification Modal */}
      {!isReadOnly && !currentUserId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-slate-800 mb-2">ברוך הבא לטיול!</h2>
            <p className="text-center text-slate-500 mb-6">אנא בחר מי אתה מתוך רשימת המשתתפים כדי שתוכל להוסיף הוצאות.</p>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {trip.participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => setCurrentUserId(p.id)}
                  className="w-full p-4 text-right bg-slate-50 hover:bg-indigo-50 rounded-xl font-medium text-slate-700 hover:text-indigo-700 transition-colors border border-slate-100 hover:border-indigo-200"
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => setCurrentUserId('none')}
                className="w-full p-4 text-center bg-transparent hover:bg-slate-100 rounded-xl font-medium text-slate-500 transition-colors mt-2"
              >
                אף אחד (צופה בלבד)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg relative">
        <div className="text-indigo-100 text-sm mb-1">סה"כ הוצאות בטיול</div>
        <div className="text-4xl font-bold mb-2" dir="ltr">
          {formatAmount(totalSpent)} <span className="text-[70%]">{trip.tripCurrency}</span>
        </div>
        {trip.baseCurrency !== trip.tripCurrency && (
          <div className="text-indigo-200 text-sm bg-white/10 inline-block px-3 py-1 rounded-lg backdrop-blur-sm min-h-[32px]">
            {isFetchingRate ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>מעדכן שער חליפין...</span>
              </div>
            ) : (
              <div dir="ltr" className="flex items-center gap-2">
                ≈ {formatAmount(totalSpent * (exchangeRate || 1))} <span className="text-[70%]">{trip.baseCurrency}</span> 
                <span className="mx-2 opacity-50">|</span>
                <span className="opacity-70">1 <span className="text-[70%]">{trip.tripCurrency}</span> = {formatAmount(exchangeRate || 0)} <span className="text-[70%]">{trip.baseCurrency}</span></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('EXPENSES')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'EXPENSES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Receipt className="w-4 h-4" /> הוצאות
        </button>
        {trip.participants.length > 1 && (
          <button 
            onClick={() => setActiveTab('BALANCES')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'BALANCES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4" /> יתרות
          </button>
        )}
        <button 
          onClick={() => setActiveTab('STATISTICS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'STATISTICS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart3 className="w-4 h-4" /> סטטיסטיקות
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'EXPENSES' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
            {/* Search Bar */}
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pr-10 pl-10 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="חיפוש הוצאות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <button
                onClick={toggleFilters}
                className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${showFilters || selectedCategory || selectedPayer ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                    {/* Category Filter */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 mb-2">סינון לפי קטגוריה</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!selectedCategory ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          הכל
                        </button>
                        {activeCategories.map(category => (
                          <button
                            key={category.name}
                            onClick={() => setSelectedCategory(category.name)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === category.name ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payer Filter */}
                    {trip.participants.length > 1 && (
                      <div>
                        <div className="text-xs font-bold text-slate-500 mb-2">סינון לפי משלם</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedPayer(null)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!selectedPayer ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            כולם
                          </button>
                          {trip.participants.map(participant => (
                            <button
                              key={participant.id}
                              onClick={() => setSelectedPayer(participant.id)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedPayer === participant.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              {participant.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {trip.expenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>אין עדיין הוצאות בטיול זה.</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>לא נמצאו הוצאות התואמות לחיפוש.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map(expense => {
                  const payers = expense.payers || 
                    ((expense as any).paidBy ? [{ participantId: (expense as any).paidBy, amount: expense.amount }] : []);
                  
                  const payerNames = payers.map(p => getParticipantName(p.participantId, trip.participants, currentUserId));
                  const payerText = payerNames.length > 1 
                    ? `${payerNames.length} משתתפים` 
                    : payerNames[0] || 'לא ידוע';

                  const category = trip.categories.find(c => c.name === expense.tag);
                  let Icon = category ? ICON_MAP[category.icon] : null;
                  let iconColor = category?.color;

                  if (expense.tag === 'העברה') {
                    Icon = ArrowRightLeft;
                    iconColor = '#f97316'; // orange-500
                  }

                  return (
                    <motion.div 
                      key={expense.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setViewingExpenseId(expense.id)}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{expense.description}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            {Icon && <Icon className="w-3 h-3" style={{ color: iconColor }} />}
                            {expense.tag}
                          </span>
                          {trip.participants.length > 1 && <span>שולם ע"י {payerText}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-2">
                        <div className="text-left" dir="ltr">
                          {expense.originalCurrency && expense.originalCurrency !== trip.tripCurrency && expense.exchangeRate ? (
                            <>
                              <div className="font-bold text-slate-800">
                                {formatAmount(expense.amount / expense.exchangeRate)} <span className="text-[70%]">{expense.originalCurrency}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {formatAmount(expense.amount)} <span className="text-[70%]">{trip.tripCurrency}</span>
                              </div>
                            </>
                          ) : (
                            <div className="font-bold text-slate-800">{formatAmount(expense.amount)} <span className="text-[70%]">{trip.tripCurrency}</span></div>
                          )}
                          <div className="text-xs text-slate-400 text-right" dir="rtl">
                            {new Date(expense.date).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-slate-300" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            {!isReadOnly && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
                <AnimatePresence>
                {showMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-0" 
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3 mb-4 z-10 min-w-[240px]"
                    >
                      <button 
                        onClick={() => {
                          setAddMode('TRANSFER');
                          setShowMenu(false);
                        }}
                        className="group bg-white text-slate-700 p-3 pr-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 transition-all hover:scale-105 active:scale-95"
                      >
                        <div className="bg-orange-50 p-3 rounded-xl group-hover:bg-orange-100 transition-colors">
                          <ArrowRightLeft className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800">העברה</div>
                          <div className="text-xs text-slate-500">תשלום בין חברים</div>
                        </div>
                      </button>
  
                      <button 
                        onClick={() => {
                          setAddMode('EXPENSE');
                          setShowMenu(false);
                        }}
                        className="group bg-white text-slate-700 p-3 pr-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 transition-all hover:scale-105 active:scale-95"
                      >
                        <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                          <Receipt className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800">הוצאה חדשה</div>
                          <div className="text-xs text-slate-500">קניות, מסעדות, אטרקציות...</div>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
                </AnimatePresence>
                
                <button 
                  onClick={() => {
                    if (!currentUserId || currentUserId === 'none') {
                      alert('אנא בחר מי אתה (בעריכת הטיול) לפני הוספת הוצאה.');
                      return;
                    }
                    if (trip.participants.length === 1) {
                      setAddMode('EXPENSE');
                    } else {
                      setShowMenu(!showMenu);
                    }
                  }}
                  className={`bg-indigo-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${showMenu ? 'rotate-45 bg-slate-800' : ''}`}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
            </motion.div>
        )}

        {activeTab === 'BALANCES' && (
          <motion.div
            key="balances"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Balances 
              trip={trip} 
              exchangeRate={exchangeRate} 
              onSelectParticipant={setViewingParticipantId}
              onSettleDebt={!isReadOnly ? handleSettleDebt : undefined}
              currentUserId={currentUserId}
            />
          </motion.div>
        )}

        {activeTab === 'STATISTICS' && (
          <motion.div
            key="statistics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Statistics trip={trip} currentUserId={currentUserId} />
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
