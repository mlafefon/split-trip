import { Trip } from '../types';

export type Transaction = {
  from: string;
  to: string;
  amount: number;
};

export const calculateBalances = (trip: Trip) => {
  const balances: Record<string, number> = {};
  
  trip.participants.forEach(p => {
    balances[p.id] = 0;
  });

  trip.expenses.forEach(expense => {
    // Handle payers (support both new multiple payers and legacy single payer)
    const payers = expense.payers || 
      ((expense as any).paidBy ? [{ participantId: (expense as any).paidBy, amount: expense.amount }] : []);

    payers.forEach(payer => {
      if (balances[payer.participantId] !== undefined) {
        balances[payer.participantId] += payer.amount;
      }
    });

    // People who owe get negative balance
    expense.splits.forEach(split => {
      if (balances[split.participantId] !== undefined) {
        balances[split.participantId] -= split.amount;
      }
    });
  });

  return balances;
};

export const calculateSettlement = (balances: Record<string, number>): Transaction[] => {
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([id, amount]) => {
    if (amount < -0.01) debtors.push({ id, amount: -amount });
    else if (amount > 0.01) creditors.push({ id, amount });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    
    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount * 100) / 100
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
};
