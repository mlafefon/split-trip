import { useState, useEffect } from 'react';
import { Trip, Expense, Category } from '../types';
import { AddExpense } from './AddExpense';
import { AddTransfer } from './AddTransfer';
import { TripForm } from './TripForm';
import { Balances } from './Balances';
import { Statistics } from './Statistics';
import { ExpenseDetails } from './ExpenseDetails';
import { Receipt, Users, BarChart3, Plus, Trash2, Pencil, Loader2, ArrowRightLeft, Search, X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { fetchExchangeRates } from '../utils/currency';
import { ICON_MAP } from '../utils/categories';

type Props = {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
};

type Tab = 'EXPENSES' | 'BALANCES' | 'STATISTICS';

export const TripView = ({ trip, updateTrip }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>('EXPENSES');
  const [addMode, setAddMode] = useState<'NONE' | 'EXPENSE' | 'TRANSFER'>('NONE');
  const [showMenu, setShowMenu] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [viewingExpenseId, setViewingExpenseId] = useState<string | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      expenses: [...trip.expenses, expense]
    });
    setAddMode('NONE');
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    updateTrip({
      ...trip,
      expenses: trip.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e)
    });
    setEditingExpenseId(null);
  };

  const handleUpdateCategories = (categories: Category[]) => {
    updateTrip({
      ...trip,
      categories
    });
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    updateTrip(updatedTrip);
    setIsEditing(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setDeleteExpenseId(expenseId);
  };

  const confirmDeleteExpense = () => {
    if (deleteExpenseId) {
      updateTrip({
        ...trip,
        expenses: trip.expenses.filter(e => e.id !== deleteExpenseId)
      });
      setDeleteExpenseId(null);
    }
  };

  const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = trip.expenses.filter(expense => {
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
  });

  if (isEditing) {
    return (
      <TripForm 
        initialTrip={trip}
        onSave={handleUpdateTrip}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  if (addMode === 'EXPENSE') {
    return (
      <AddExpense 
        trip={trip} 
        onSave={handleAddExpense} 
        onCancel={() => setAddMode('NONE')} 
        onUpdateCategories={handleUpdateCategories}
      />
    );
  }

  if (addMode === 'TRANSFER') {
    return <AddTransfer trip={trip} onSave={handleAddExpense} onCancel={() => setAddMode('NONE')} />;
  }

  if (editingExpenseId) {
    const expenseToEdit = trip.expenses.find(e => e.id === editingExpenseId);
    if (expenseToEdit) {
      return (
        <AddExpense 
          trip={trip} 
          initialExpense={expenseToEdit}
          onSave={handleUpdateExpense} 
          onCancel={() => setEditingExpenseId(null)} 
          onUpdateCategories={handleUpdateCategories}
        />
      );
    }
  }

  if (viewingExpenseId) {
    const expenseToView = trip.expenses.find(e => e.id === viewingExpenseId);
    if (expenseToView) {
      return (
        <ExpenseDetails 
          trip={trip}
          expense={expenseToView}
          onEdit={() => {
            setViewingExpenseId(null);
            setEditingExpenseId(expenseToView.id);
          }}
          onDelete={() => {
            setViewingExpenseId(null);
            setDeleteExpenseId(expenseToView.id);
          }}
          onClose={() => setViewingExpenseId(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog 
        isOpen={!!deleteExpenseId}
        title="מחיקת הוצאה"
        message="האם אתה בטוח שברצונך למחוק הוצאה זו? הפעולה אינה הפיכה."
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeleteExpenseId(null)}
      />

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg relative">
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="ערוך פרטי טיול"
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
        
        <div className="text-indigo-100 text-sm mb-1">סה"כ הוצאות בטיול</div>
        <div className="text-4xl font-bold mb-2" dir="ltr">
          {totalSpent.toFixed(2)} <span className="text-2xl">{trip.tripCurrency}</span>
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
                ≈ {(totalSpent * (exchangeRate || 1)).toFixed(2)} {trip.baseCurrency} 
                <span className="mx-2 opacity-50">|</span>
                <span className="opacity-70">1 {trip.tripCurrency} = {exchangeRate?.toFixed(2)} {trip.baseCurrency}</span>
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
        <button 
          onClick={() => setActiveTab('BALANCES')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'BALANCES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-4 h-4" /> יתרות
        </button>
        <button 
          onClick={() => setActiveTab('STATISTICS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'STATISTICS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart3 className="w-4 h-4" /> סטטיסטיקות
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeTab === 'EXPENSES' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
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
                  
                  const payerNames = payers.map(p => trip.participants.find(part => part.id === p.participantId)?.name || 'לא ידוע');
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
                    <div 
                      key={expense.id} 
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
                          <span>שולם ע"י {payerText}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left" dir="ltr">
                          {expense.originalCurrency && expense.originalCurrency !== trip.tripCurrency && expense.exchangeRate ? (
                            <>
                              <div className="font-bold text-slate-800">
                                {(expense.amount / expense.exchangeRate).toFixed(2)} {expense.originalCurrency}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {expense.amount.toFixed(2)} {trip.tripCurrency}
                              </div>
                            </>
                          ) : (
                            <div className="font-bold text-slate-800">{expense.amount.toFixed(2)} {trip.tripCurrency}</div>
                          )}
                          <div className="text-xs text-slate-400 text-right" dir="rtl">
                            {new Date(expense.date).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-0 transition-opacity" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="flex flex-col gap-3 mb-4 animate-in slide-in-from-bottom-8 fade-in duration-300 z-10 min-w-[240px]">
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
                  </div>
                </>
              )}
              
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`bg-indigo-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${showMenu ? 'rotate-45 bg-slate-800' : ''}`}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'BALANCES' && (
          <Balances trip={trip} exchangeRate={exchangeRate} />
        )}

        {activeTab === 'STATISTICS' && (
          <Statistics trip={trip} />
        )}
      </div>
    </div>
  );
};
