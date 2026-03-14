export type Participant = {
  id: string;
  name: string;
};

export type SplitType = 'EQUAL' | 'EXACT';

export type ExpenseSplit = {
  participantId: string;
  amount: number;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  payers: { participantId: string; amount: number }[];
  splits: ExpenseSplit[];
  tag: string;
  originalCurrency?: string;
  exchangeRate?: number;
  notes?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type ActivityLogAction = 'CREATE_TRIP' | 'UPDATE_TRIP' | 'ADD_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE' | 'ADD_PARTICIPANT' | 'REMOVE_PARTICIPANT';

export type ActivityLogEntry = {
  id: string;
  participantId: string;
  action: ActivityLogAction;
  timestamp: string;
  details?: string;
  entityId?: string;
};

export type Trip = {
  id: string;
  destination: string;
  icon?: string;
  baseCurrency: string;
  tripCurrency: string;
  participants: Participant[];
  expenses: Expense[];
  categories: Category[];
  createdAt: string;
  notes?: string;
  editCode?: string; // Secret code for editing permissions
  activityLog?: ActivityLogEntry[];
};

export type ExchangeRates = {
  rates: Record<string, number>;
  base: string;
  date: string;
};
