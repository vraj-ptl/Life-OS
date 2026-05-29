'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

const EXPENSE_CATEGORIES = ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];

export default function FinancePage() {
  const [data, setData] = useState<any>({ summary: { income: 0, expense: 0, balance: 0 }, transactions: [], expensesByCategory: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>('/finance');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to fetch finance data', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ type: 'error', message: 'Invalid amount' });
      return;
    }

    try {
      const res = await api.post<{ transaction: any }>('/finance', {
        ...formData,
        amount: parseFloat(formData.amount),
        type: txType,
      });

      if (res.success) {
        toast({ type: 'success', message: 'Transaction added' });
        setIsModalOpen(false);
        fetchFinanceData(); // Refresh to get updated aggregations
        
        // Reset form
        setFormData({
          amount: '',
          category: txType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to add transaction' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/finance/${id}`);
      toast({ type: 'success', message: 'Transaction deleted' });
      fetchFinanceData();
    } catch (error) {
      toast({ type: 'error', message: 'Failed to delete' });
    }
  };

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Finance</h1>
          <p className="text-secondary text-sm">Track your expenses in INR (₹)</p>
        </div>

        <Button 
          leftIcon={<Plus size={18} />} 
          onClick={() => setIsModalOpen(true)}
        >
          Add Transaction
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <Card className="flex flex-col gap-2 p-xl bg-gradient-to-br from-card to-card-hover border-border-default shadow-lg">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <Wallet size={20} className="text-primary" />
                <span className="font-medium">Total Balance</span>
              </div>
              <h2 className={`text-4xl font-bold ${data.summary.balance >= 0 ? 'text-primary-light' : 'text-danger'}`}>
                {formatCurrency(data.summary.balance)}
              </h2>
            </Card>

            <Card className="flex flex-col gap-2 p-xl">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <TrendingUp size={20} className="text-success" />
                <span className="font-medium">Income (This Month)</span>
              </div>
              <h2 className="text-3xl font-bold text-success">
                {formatCurrency(data.summary.income)}
              </h2>
            </Card>

            <Card className="flex flex-col gap-2 p-xl">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <TrendingDown size={20} className="text-danger" />
                <span className="font-medium">Expenses (This Month)</span>
              </div>
              <h2 className="text-3xl font-bold text-danger">
                {formatCurrency(data.summary.expense)}
              </h2>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            {/* Recent Transactions List */}
            <Card className="lg:col-span-2 p-lg">
              <h3 className="text-lg font-semibold mb-6">Recent Transactions</h3>
              
              {data.transactions.length === 0 ? (
                <div className="text-center py-10 text-muted">No transactions found.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {data.transactions.map((tx: Transaction) => (
                    <div key={tx._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                          {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-primary">{tx.description || tx.category}</p>
                          <p className="text-xs text-secondary">{new Date(tx.date).toLocaleDateString()} • {tx.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button 
                          className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => handleDelete(tx._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Expense Breakdown (Simple List instead of chart to avoid Recharts hydration issues for now) */}
            <Card className="lg:col-span-1 p-lg">
              <h3 className="text-lg font-semibold mb-6">Expense Breakdown</h3>
              {Object.keys(data.expensesByCategory).length === 0 ? (
                <div className="text-center py-10 text-muted">No expenses yet.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(data.expensesByCategory)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([category, amount]: [string, any]) => {
                      const percentage = ((amount / data.summary.expense) * 100).toFixed(0);
                      return (
                        <div key={category} className="flex flex-col gap-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-secondary">{category}</span>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                          </div>
                          <div className="w-full h-2 bg-input rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-light rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleSaveTransaction} className="flex flex-col gap-md pt-2">
          
          <div className="flex bg-input border border-border-default rounded-md overflow-hidden p-1">
            <button
              type="button"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${txType === 'expense' ? 'bg-danger text-white' : 'text-secondary hover:text-primary'}`}
              onClick={() => { setTxType('expense'); setFormData({...formData, category: EXPENSE_CATEGORIES[0]})}}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${txType === 'income' ? 'bg-success text-white' : 'text-secondary hover:text-primary'}`}
              onClick={() => { setTxType('income'); setFormData({...formData, category: INCOME_CATEGORIES[0]})}}
            >
              Income
            </button>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary ml-1">Category</label>
            <select
              className="h-12 bg-input border border-border-default rounded-md px-3 text-primary focus:border-primary outline-none transition-all"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <Input
            label="Description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Groceries"
          />

          <Input
            label="Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <Button type="submit" fullWidth className="mt-4">
            Add {txType === 'income' ? 'Income' : 'Expense'}
          </Button>
        </form>
      </Modal>

    </div>
  );
}
