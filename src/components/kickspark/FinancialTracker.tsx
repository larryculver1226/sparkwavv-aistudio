import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Expense } from '../../types/dashboard';

interface FinancialTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  targetIncrease: number;
}

export const FinancialTracker: React.FC<FinancialTrackerProps> = ({ 
  expenses, 
  onAddExpense, 
  onDeleteExpense,
  targetIncrease 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'course' as Expense['category'],
    date: new Date().toISOString().split('T')[0]
  });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const taxSavingsEstimate = totalSpent * 0.25; // Simple 25% estimate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense(newExpense);
    setIsAdding(false);
    setNewExpense({
      description: '',
      amount: 0,
      category: 'course',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Financial Tracker (Tax Deductibility)</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Total Invested</p>
          <p className="text-xl font-display font-bold text-white">${totalSpent.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-2xl bg-neon-lime/10 border border-neon-lime/20">
          <p className="text-[10px] text-neon-lime/60 uppercase font-bold mb-1">Est. Tax Savings</p>
          <p className="text-xl font-display font-bold text-neon-lime">${taxSavingsEstimate.toLocaleString()}</p>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-white/5 border border-neon-cyan/30 space-y-4">
          <input 
            type="text" 
            placeholder="Description (e.g. Coaching Session)"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-neon-cyan outline-none"
            value={newExpense.description}
            onChange={e => setNewExpense({...newExpense, description: e.target.value})}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" 
              placeholder="Amount"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-neon-cyan outline-none"
              value={newExpense.amount || ''}
              onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
              required
            />
            <select 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-neon-cyan outline-none"
              value={newExpense.category}
              onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}
            >
              <option value="course">Course</option>
              <option value="coaching">Coaching</option>
              <option value="certification">Certification</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2 bg-neon-cyan text-black font-bold rounded-xl text-xs uppercase tracking-widest">
            Add Investment
          </button>
        </form>
      )}

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {expenses.length === 0 ? (
          <p className="text-center py-8 text-xs text-white/20 italic">No investments logged yet.</p>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white/40" />
                </div>
                <div>
                  <p className="text-xs font-bold">{expense.description}</p>
                  <p className="text-[10px] text-white/40 uppercase">{expense.category} • {expense.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold">${expense.amount.toLocaleString()}</span>
                <button 
                  onClick={() => onDeleteExpense(expense.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/40 uppercase font-bold">Target Salary Increase</span>
          <span className="text-xs font-bold text-neon-cyan">${targetIncrease.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-neon-cyan" 
            style={{ width: `${Math.min((totalSpent / targetIncrease) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-white/20 mt-2 italic">
          Investing in yourself is the highest ROI activity.
        </p>
      </div>
    </div>
  );
};
