'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Plus, Sparkles, Loader2, ArrowUpRight, ArrowDownRight, Target, Hash, Type, Calendar, History } from 'lucide-react';
import api from '@/lib/api';
import { TransactionCard, Transaction } from '@/components/features/TransactionCard';
import styles from './Finance.module.css';
import formStyles from '@/components/features/HabitModal.module.css';

const EXPENSE_CATEGORIES = ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];

export default function FinancePage() {
  const [data, setData] = useState<any>({ summary: { income: 0, expense: 0, balance: 0 }, transactions: [], expensesByCategory: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
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
    try {
      const amount = parseFloat(formData.amount);
      
      // Prevent negative balance
      if (txType === 'expense') {
        const currentBalance = data.summary.income - data.summary.expense;
        if (currentBalance - amount < 0) {
          toast({
            type: 'error',
            message: `Insufficient Balance`,
            description: `You cannot add an expense of ${formatCurrency(amount)}. Your current balance is ${formatCurrency(currentBalance)}.`,
          });
          return;
        }
      }

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

  // Current month calculations
  const currentMonthStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    data.transactions.forEach((tx: any) => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        if (tx.type === 'income') thisMonthIncome += tx.amount;
        else thisMonthExpense += tx.amount;
      }
    });

    return { income: thisMonthIncome, expense: thisMonthExpense };
  }, [data.transactions]);

  // Safe to Spend Calculation
  const safeToSpend = useMemo(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - today.getDate() + 1; // including today
    
    // If we have income this month, base it on that.
    // If not, try to base it on their historical average income.
    let baseIncome = currentMonthStats.income;

    if (baseIncome === 0 && data.transactions.length > 0) {
      let totalHistoricalIncome = 0;
      const incomeMonths = new Set<string>();
      data.transactions.forEach((tx: any) => {
        if (tx.type === 'income') {
          totalHistoricalIncome += tx.amount;
          const date = new Date(tx.date);
          incomeMonths.add(`${date.getFullYear()}-${date.getMonth()}`);
        }
      });
      if (incomeMonths.size > 0) {
        baseIncome = totalHistoricalIncome / incomeMonths.size;
      }
    }

    const availableBudget = baseIncome - currentMonthStats.expense;
    if (availableBudget <= 0) return 0;
    
    return availableBudget / daysLeft;
  }, [currentMonthStats, data.transactions]);

  // Detailed AI Insights Generator
  const smartInsights = useMemo(() => {
    if (data.transactions.length === 0) {
      return [{
        type: 'info',
        title: 'Welcome to Finance Tracker',
        description: 'Add your first transaction to get smart insights on your spending habits!',
        suggestion: 'Start by adding your current bank balance as "Income" to calibrate your Safe to Spend.'
      }];
    }
    
    const insights = [];
    const categories = Object.entries(data.expensesByCategory).sort(([, a], [, b]) => (b as number) - (a as number));
    
    // 1. Overall Balance Check
    if (data.summary.expense > data.summary.income && data.summary.income > 0) {
      const deficit = data.summary.expense - data.summary.income;
      insights.push({
        type: 'danger',
        title: 'Severe Spending Deficit',
        description: `Your all-time expenses (${formatCurrency(data.summary.expense)}) exceed your income (${formatCurrency(data.summary.income)}) by ${formatCurrency(deficit)}.`,
        suggestion: `You have a deficit of ${formatCurrency(deficit)}. You need to immediately cut non-essential expenses and aim to save at least ${formatCurrency(deficit / 3)} per month over the next 3 months to break even.`
      });
    }

    // 2. Category specific warnings
    if (categories.length > 0) {
      const [highestCategory, amount] = categories[0] as [string, number];
      const percentage = Math.round((amount / data.summary.expense) * 100);
      
      const thresholdLimit = highestCategory === 'Housing' ? 35 : 20;
      
      if (percentage > thresholdLimit) {
        const excessPercentage = percentage - thresholdLimit;
        const excessAmount = (excessPercentage / 100) * data.summary.expense;
        const targetAmount = (thresholdLimit / 100) * data.summary.expense;

        let suggestion = `Aim to reduce spending in this category by ${formatCurrency(excessAmount)}. Your target budget for ${highestCategory} should be around ${formatCurrency(targetAmount)} or less.`;
        if (highestCategory === 'Food & Dining') suggestion += ' Try meal prepping on weekends to hit this target.';
        if (highestCategory === 'Shopping') suggestion += ' Implement a "48-hour rule" before buying non-essential items.';

        insights.push({
          type: 'warning',
          title: `Overspending on ${highestCategory}`,
          description: `${highestCategory} takes up ${percentage}% (${formatCurrency(amount)}) of your total expenses. A healthy benchmark is under ${thresholdLimit}%.`,
          suggestion
        });
      }
    }

    // 3. Current Month Burn Rate
    const today = new Date();
    const daysPassed = Math.max(1, today.getDate());
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - today.getDate() + 1; // including today
    
    if (currentMonthStats.income > 0) {
      const burnRate = currentMonthStats.expense / daysPassed;
      const expectedTotalExpense = burnRate * daysInMonth;
      
      if (expectedTotalExpense > currentMonthStats.income) {
        const projectedDeficit = expectedTotalExpense - currentMonthStats.income;
        const remainingBudget = currentMonthStats.income - currentMonthStats.expense;
        
        let suggestion = "";
        if (remainingBudget > 0) {
          const strictDailyLimit = remainingBudget / daysLeft;
          suggestion = `To avoid a ${formatCurrency(projectedDeficit)} deficit by month's end, you MUST limit your spending to exactly ${formatCurrency(strictDailyLimit)}/day for the remaining ${daysLeft} days.`;
        } else {
          suggestion = `You have already exceeded your income by ${formatCurrency(Math.abs(remainingBudget))}. Stop all non-essential spending immediately.`;
        }

        insights.push({
          type: 'warning',
          title: 'High Burn Rate',
          description: `You are spending ${formatCurrency(burnRate)}/day. At this speed, your total expenses will reach ${formatCurrency(expectedTotalExpense)}, which is ${formatCurrency(projectedDeficit)} over your income.`,
          suggestion
        });
      }
    }

    // 4. Days to Zero (Runway Calculation)
    if (data.summary.income > data.summary.expense) {
      const currentBalance = data.summary.income - data.summary.expense;
      const dailyAverageExpense = currentMonthStats.expense > 0 
        ? currentMonthStats.expense / daysPassed 
        : data.summary.expense / 30; // fallback

      if (dailyAverageExpense > 0) {
        const daysToZero = Math.floor(currentBalance / dailyAverageExpense);
        
        if (daysToZero < 30) {
          insights.push({
            type: 'danger',
            title: 'Critical Bank Balance',
            description: `At your current spending rate of ${formatCurrency(dailyAverageExpense)}/day, your total balance of ${formatCurrency(currentBalance)} will hit zero in just ${daysToZero} days!`,
            suggestion: `Stop all non-essential spending. Limit your daily spending to ${formatCurrency(currentBalance / 60)} to stretch your balance to 2 months.`
          });
        } else if (daysToZero < 90) {
           insights.push({
            type: 'warning',
            title: 'Depleting Savings',
            description: `At your current spending rate of ${formatCurrency(dailyAverageExpense)}/day, your savings of ${formatCurrency(currentBalance)} will only last about ${daysToZero} days.`,
            suggestion: `You have roughly ${Math.floor(daysToZero/30)} months of runway. Look for ways to lower your daily average expense to increase this.`
          });
        }
      }
    }

    // 5. Positive Reinforcement
    if (insights.length === 0 && currentMonthStats.income > currentMonthStats.expense && currentMonthStats.expense > 0) {
      const surplus = currentMonthStats.income - currentMonthStats.expense;
      insights.push({
        type: 'success',
        title: 'Excellent Financial Health',
        description: `Your spending is perfectly balanced! You have a surplus of ${formatCurrency(surplus)} this month.`,
        suggestion: `Consider moving ${formatCurrency(surplus * 0.5)} (50% of your surplus) into investments or a high-yield savings account.`
      });
    }

    return insights.length > 0 ? insights : [{
      type: 'info',
      title: 'Tracking Progress',
      description: 'Keep tracking your expenses to build a clearer picture of your financial health.',
      suggestion: 'Consistently log every expense to get better AI insights next month.'
    }];
  }, [data, currentMonthStats]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Finance</h1>
          <p className={styles.headerSubtitle}>Track expenses, achieve goals, and build wealth</p>
        </div>

        <div className={styles.headerActions}>
          <Button 
            leftIcon={<Plus size={18} />} 
            onClick={() => setIsModalOpen(true)}
          >
            New Transaction
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                <Wallet size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>Total Balance</p>
                <h3 className={`${styles.statValue} ${styles.statValueGreen}`}>
                  {formatCurrency(data.summary.balance)}
                </h3>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                <TrendingUp size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>Income (This Month)</p>
                <h3 className={`${styles.statValue} ${styles.statValueBlue}`}>
                  {formatCurrency(currentMonthStats.income)}
                </h3>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statCardAmber}`}>
              <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                <TrendingDown size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>Expenses (This Month)</p>
                <h3 className={`${styles.statValue} ${styles.statValueAmber}`}>
                  {formatCurrency(currentMonthStats.expense)}
                </h3>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCardPurple}`}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                <Target size={24} />
              </div>
              <div>
                <p className={styles.statLabel}>Safe to Spend / Day</p>
                <h3 className={`${styles.statValue} ${styles.statValuePurple}`}>
                  {formatCurrency(safeToSpend)}
                </h3>
              </div>
            </div>
          </div>

          <div className={styles.mainLayout}>
            {/* Left Column: Recent Transactions */}
            <div className={styles.scrollableColumn}>
              <div className={styles.panel}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Recent Transactions</h3>
                  {data.transactions.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      leftIcon={<History size={16} />}
                      onClick={() => setIsHistoryModalOpen(true)}
                    >
                      View All
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-col gap-4">
                  {data.transactions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIconWrapper}>
                        <Wallet size={32} />
                      </div>
                      <h3 className={styles.emptyTitle}>No transactions yet</h3>
                      <p className={styles.emptySubtitle}>
                        Add your first income or expense to start tracking your finances and unlock smart AI insights.
                      </p>
                      <Button leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                        Add Transaction
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {data.transactions.slice(0, 10).map((tx: Transaction) => (
                        <TransactionCard key={tx._id} transaction={tx} onDelete={handleDelete} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Insights & Breakdown */}
            <div className={styles.scrollableColumn}>
              
              {/* Smart AI Insights */}
              <div className="flex flex-col gap-4">
                <h3 className={styles.sectionTitle}>Smart Insights</h3>
                {smartInsights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.aiInsightCard} ${
                      insight.type === 'danger' ? styles.aiDanger : 
                      insight.type === 'warning' ? styles.aiWarning : 
                      insight.type === 'success' ? styles.aiSuccess : 
                      styles.aiInfo
                    }`}
                  >
                    <div className={styles.aiHeader}>
                      <Sparkles size={16} />
                      <span>{insight.title}</span>
                    </div>
                    <p className={styles.aiText}>
                      {insight.description}
                    </p>
                    {insight.suggestion && (
                      <div className="mt-2 text-sm text-primary-light bg-primary/10 p-3 rounded-lg border border-primary/20">
                        <strong>💡 Suggestion:</strong> {insight.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Expense Breakdown */}
              <div className={styles.panel}>
                <h3 className={styles.sectionTitle}>Expense Breakdown</h3>
                {Object.keys(data.expensesByCategory).length === 0 ? (
                  <div className="text-center py-10 text-muted">No expenses yet.</div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {Object.entries(data.expensesByCategory)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([category, amount]: [string, any]) => {
                        const percentage = ((amount / data.summary.expense) * 100).toFixed(0);
                        return (
                          <div key={category} className={styles.breakdownItem}>
                            <div className={styles.breakdownHeader}>
                              <span className={styles.breakdownCategory}>{category}</span>
                              <span className={styles.breakdownAmount}>{formatCurrency(amount)}</span>
                            </div>
                            <div className={styles.progressBarTrack}>
                              <div 
                                className={styles.progressBarFill} 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add ${txType === 'income' ? 'Income' : 'Expense'}`} size="md">
        <form onSubmit={handleSaveTransaction} className={formStyles.form}>
          
          {/* Transaction Type Toggle */}
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>
              <Wallet size={15} />
              Transaction Type
            </label>
            <div className={styles.toggleContainer}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${txType === 'expense' ? styles.toggleBtnExpenseActive : ''}`}
                onClick={() => { setTxType('expense'); setFormData({...formData, category: EXPENSE_CATEGORIES[0]})}}
              >
                <ArrowDownRight size={18} style={{ marginRight: '8px' }} />
                Expense
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${txType === 'income' ? styles.toggleBtnIncomeActive : ''}`}
                onClick={() => { setTxType('income'); setFormData({...formData, category: INCOME_CATEGORIES[0]})}}
              >
                <ArrowUpRight size={18} style={{ marginRight: '8px' }} />
                Income
              </button>
            </div>
          </div>

          {/* Amount Field */}
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="finance-amount">
              <Sparkles size={15} />
              Amount (₹)
            </label>
            <input
              id="finance-amount"
              type="number"
              step="0.01"
              min="0"
              required
              className={formStyles.input}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {/* Category Field */}
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="finance-category">
              <Hash size={15} />
              Category
            </label>
            <select
              id="finance-category"
              className={formStyles.input}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc', cursor: 'pointer' }}
            >
              <optgroup label={txType === 'expense' ? 'Expense Categories' : 'Income Categories'} style={{ background: '#0f172a', color: '#94a3b8' }}>
                {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                  <option key={cat} value={cat} style={{ background: '#1e293b', color: '#f8fafc', padding: '10px' }}>{cat}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Description Field */}
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label} htmlFor="finance-desc">
              <Type size={15} />
              Description
            </label>
            <input
              id="finance-desc"
              required
              className={formStyles.input}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={`e.g. ${txType === 'expense' ? 'Groceries' : 'Monthly salary'}`}
            />
          </div>

          {/* Date Field */}
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="finance-date">
              <Calendar size={15} />
              Date
            </label>
            <input
              id="finance-date"
              type="date"
              required
              className={formStyles.input}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" fullWidth className="mt-4" size="lg">
            Add {txType === 'income' ? 'Income' : 'Expense'}
          </Button>
        </form>
      </Modal>

      {/* Transaction History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Transaction History" size="lg">
        <div className="flex flex-col gap-4" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
          {data.transactions.length === 0 ? (
            <div className="text-center py-10 text-muted">No transactions yet.</div>
          ) : (
            data.transactions.map((tx: Transaction) => (
              <TransactionCard key={tx._id} transaction={tx} onDelete={handleDelete} />
            ))
          )}
        </div>
      </Modal>

    </div>
  );
}
