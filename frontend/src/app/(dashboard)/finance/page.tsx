'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Plus, Sparkles, Loader2, ArrowUpRight, ArrowDownRight, Target, Hash, Type, Calendar, History, PieChart, Repeat } from 'lucide-react';
import api from '@/lib/api';
import { TransactionCard, Transaction } from '@/components/features/TransactionCard';
import { SubscriptionCard, Subscription } from '@/components/features/SubscriptionCard';
import { BudgetCard, Budget } from '@/components/features/BudgetCard';
import styles from './Finance.module.css';
import formStyles from '@/components/features/HabitModal.module.css';

const EXPENSE_CATEGORIES = ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];

export default function FinancePage() {
  const [data, setData] = useState<any>({ 
    summary: { income: 0, expense: 0, balance: 0 }, 
    transactions: [], 
    expensesByCategory: {},
    budgets: [],
    subscriptions: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  
  // Tabs
  const [leftTab, setLeftTab] = useState<'transactions'|'subscriptions'>('transactions');
  const [rightTab, setRightTab] = useState<'insights'|'planning'>('insights');

  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('all');
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { toast } = useToast();

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>('/finance');
      if (res.success && res.data) {
        setData({
          ...res.data,
          budgets: res.data.budgets || [],
          subscriptions: res.data.subscriptions || []
        });
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

  // --- Transactions ---
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(formData.amount);
      if (txType === 'expense') {
        const currentBalance = data.summary.income - data.summary.expense;
        if (currentBalance - amount < 0) {
          toast({
            type: 'error', message: `Insufficient Balance`,
            description: `You cannot add an expense of ${formatCurrency(amount)}. Current balance: ${formatCurrency(currentBalance)}.`,
          });
          return;
        }
      }

      const res = await api.post<{ transaction: any }>('/finance', {
        ...formData, amount: parseFloat(formData.amount), type: txType,
      });

      if (res.success) {
        toast({ type: 'success', message: 'Transaction added' });
        setIsModalOpen(false);
        fetchFinanceData();
        setFormData({ amount: '', category: txType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0] });
      }
    } catch (error: any) {
      toast({ type: 'error', message: 'Failed to add transaction' });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/finance/${id}`);
      toast({ type: 'success', message: 'Transaction deleted' });
      fetchFinanceData();
    } catch (error) { toast({ type: 'error', message: 'Failed to delete' }); }
  };

  // --- Budgets ---
  const [budgetForm, setBudgetForm] = useState({ category: EXPENSE_CATEGORIES[0], monthlyLimit: '' });
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/budgets', { ...budgetForm, monthlyLimit: parseFloat(budgetForm.monthlyLimit) });
      toast({ type: 'success', message: 'Budget added' });
      setIsBudgetModalOpen(false);
      fetchFinanceData();
    } catch(err) { toast({ type: 'error', message: 'Failed to add budget' }); }
  };
  const handleDeleteBudget = async (id: string) => {
    await api.delete(`/finance/budgets/${id}`);
    fetchFinanceData();
  };

  // --- Subscriptions ---
  const todayStr = new Date().toISOString().split('T')[0];
  const [subForm, setSubForm] = useState({ name: '', amount: '', billingCycle: 'monthly', nextBillingDate: todayStr, category: 'Entertainment' });
  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/subscriptions', { ...subForm, amount: parseFloat(subForm.amount) });
      toast({ type: 'success', message: 'Subscription added' });
      setIsSubModalOpen(false);
      fetchFinanceData();
    } catch(err: any) { toast({ type: 'error', message: err?.message || 'Failed to add subscription' }); }
  };
  const handleDeleteSub = async (id: string) => {
    await api.delete(`/finance/subscriptions/${id}`);
    fetchFinanceData();
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
    const daysLeft = daysInMonth - today.getDate() + 1;
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
      if (incomeMonths.size > 0) baseIncome = totalHistoricalIncome / incomeMonths.size;
    }

    const availableBudget = baseIncome - currentMonthStats.expense;
    if (availableBudget <= 0) return 0;
    return availableBudget / daysLeft;
  }, [currentMonthStats, data.transactions]);

  const sortedAndFilteredTransactions = useMemo(() => {
    let filtered = [...data.transactions];
    if (filterType === 'month') {
      filtered = filtered.filter((tx: any) => {
        const d = new Date(tx.date);
        const txMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return txMonth === filterMonth;
      });
    } else if (filterType === 'date') {
      filtered = filtered.filter((tx: any) => {
        return new Date(tx.date).toISOString().split('T')[0] === filterDate;
      });
    }
    // Sort descending by date, then by createdAt if date is identical
    return filtered.sort((a: any, b: any) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // If dates are identical (e.g., both 2026-06-10T00:00:00.000Z), sort by creation time
      return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
    });
  }, [data.transactions, filterType, filterMonth, filterDate]);

  // Smart Insights generator - DETAILED version
  const smartInsights = useMemo(() => {
    if (data.transactions.length === 0) {
      return [{ type: 'info', title: 'Welcome to Finance Tracker', description: 'Add your first transaction to get smart insights on your spending habits! Start by logging your income or first expense to calibrate the system.', suggestion: 'Start by adding your current bank balance as "Income" to calibrate your Safe to Spend metric. Then log each expense as you go — the AI will learn your patterns within a week.' }];
    }

    const insights = [];
    const totalBalance = data.summary.income - data.summary.expense;
    const savingsRate = data.summary.income > 0 ? ((totalBalance / data.summary.income) * 100).toFixed(1) : 0;

    // 1. Overall Financial Health
    if (data.summary.expense > data.summary.income && data.summary.income > 0) {
      insights.push({ 
        type: 'danger', 
        title: 'Severe Spending Deficit', 
        description: `Your total expenses (${formatCurrency(data.summary.expense)}) exceed your total income (${formatCurrency(data.summary.income)}) by ${formatCurrency(data.summary.expense - data.summary.income)}. This means you are spending more than you earn, which is unsustainable long-term. Your effective savings rate is negative at ${savingsRate}%.`, 
        suggestion: `Immediately review your largest expense categories below and identify at least 2 areas where you can cut back by 15-20%. Consider setting strict category budgets in the Planning tab to cap your spending.` 
      });
    } else if (data.summary.income > 0) {
      const ratio = data.summary.expense / data.summary.income;
      if (ratio > 0.8) {
        insights.push({
          type: 'warning',
          title: 'High Spending Ratio',
          description: `You are spending ${(ratio * 100).toFixed(0)}% of your income. While you are still in the green, your savings rate of ${savingsRate}% leaves very little margin for emergencies. Your current balance is ${formatCurrency(totalBalance)}.`,
          suggestion: `Financial advisors recommend keeping your spending below 70% of income. Try to identify one recurring expense you could reduce or eliminate this month.`
        });
      } else {
        insights.push({ 
          type: 'success', 
          title: 'Strong Financial Health', 
          description: `Your savings rate is ${savingsRate}%, which is excellent. You are spending ${(ratio * 100).toFixed(0)}% of your income and building a healthy surplus of ${formatCurrency(totalBalance)}. This month you earned ${formatCurrency(currentMonthStats.income)} and spent ${formatCurrency(currentMonthStats.expense)}.`, 
          suggestion: `Consider allocating your surplus into high-yield savings or investments. At your current rate, you could save ${formatCurrency(parseFloat(String(savingsRate)) / 100 * data.summary.income * 12)} annually.` 
        });
      }
    }

    // 2. Budget checks with detailed context
    data.budgets.forEach((b: Budget) => {
       const spent = data.expensesByCategory[b.category] || 0;
       const pct = b.monthlyLimit > 0 ? ((spent / b.monthlyLimit) * 100).toFixed(0) : 0;
       if (spent > b.monthlyLimit) {
         insights.push({ 
           type: 'danger', 
           title: `Budget Exceeded: ${b.category}`, 
           description: `You spent ${formatCurrency(spent)} in "${b.category}", which is ${pct}% of your ${formatCurrency(b.monthlyLimit)} monthly budget — exceeding it by ${formatCurrency(spent - b.monthlyLimit)}.`, 
           suggestion: `Pause all non-essential spending in this category immediately. Consider reducing your budget allocation or finding cheaper alternatives for your ${b.category} expenses.` 
         });
       } else if (spent > b.monthlyLimit * 0.8) {
         insights.push({
           type: 'warning',
           title: `Budget Warning: ${b.category}`,
           description: `You've used ${pct}% of your ${formatCurrency(b.monthlyLimit)} budget for "${b.category}" (${formatCurrency(spent)} spent). You have ${formatCurrency(b.monthlyLimit - spent)} remaining.`,
           suggestion: `You're approaching your limit. Be mindful of additional ${b.category} expenses for the rest of the month.`
         });
       }
    });

    // 3. Category analysis
    const categories = Object.entries(data.expensesByCategory).sort(([,a], [,b]) => (b as number) - (a as number));
    if (categories.length >= 2) {
      const [topCat, topAmt] = categories[0];
      const topPct = data.summary.expense > 0 ? ((topAmt as number / data.summary.expense) * 100).toFixed(0) : 0;
      insights.push({
        type: 'info',
        title: `Top Spending: ${topCat}`,
        description: `"${topCat}" is your largest expense category at ${formatCurrency(topAmt as number)}, representing ${topPct}% of all expenses. ${categories.length > 1 ? `Your second largest category is "${categories[1][0]}" at ${formatCurrency(categories[1][1] as number)}.` : ''}`,
        suggestion: `Analyze whether your "${topCat}" spending aligns with your priorities. Small daily savings in your top category can compound significantly over a year.`
      });
    }

    // 4. Subscription impact
    if (data.subscriptions.length > 0) {
      const totalMonthly = data.subscriptions.reduce((sum: number, s: any) => {
        return sum + (s.billingCycle === 'yearly' ? s.amount / 12 : s.amount);
      }, 0);
      insights.push({
        type: 'info',
        title: `Recurring Costs: ${formatCurrency(totalMonthly)}/mo`,
        description: `You have ${data.subscriptions.length} active subscription(s) costing approximately ${formatCurrency(totalMonthly)} per month (${formatCurrency(totalMonthly * 12)}/year). This represents ${data.summary.income > 0 ? ((totalMonthly / data.summary.income * 100).toFixed(1)) : '?'}% of your total income.`,
        suggestion: `Review each subscription quarterly. Cancel any service you haven't used in the last 30 days. Even one cancelled subscription can save hundreds annually.`
      });
    }

    // 5. Safe to Spend context
    if (safeToSpend > 0) {
      insights.push({
        type: 'info',
        title: `Daily Allowance: ${formatCurrency(safeToSpend)}`,
        description: `Based on your income and current month's expenses, you can safely spend up to ${formatCurrency(safeToSpend)} per day for the remainder of the month without going over budget.`,
        suggestion: `Try to stay below this daily limit. If you have a large planned expense coming up, reduce daily spending in advance to compensate.`
      });
    }

    return insights.length > 0 ? insights : [{ type: 'info', title: 'Tracking Progress', description: 'Keep tracking your expenses to build a clearer picture of your financial health. The more data you log, the more accurate and detailed your insights become.', suggestion: 'Consistently log every expense to get better AI insights next month.' }];
  }, [data, currentMonthStats, safeToSpend]);

  const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={onClick} 
      style={{ 
        flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: active ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        color: active ? 'var(--color-primary-light)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 500,
        transition: 'all 0.2s', border: 'none', cursor: 'pointer', fontSize: '0.9rem'
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Finance</h1>
          <p className={styles.headerSubtitle}>Track expenses, set budgets, and manage subscriptions</p>
        </div>
        <div className={styles.headerActions}>
          <Button leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>New Transaction</Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}><Wallet size={24} /></div>
              <div><p className={styles.statLabel}>Total Balance</p><h3 className={`${styles.statValue} ${styles.statValueGreen}`}>{formatCurrency(data.summary.balance)}</h3></div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}><TrendingUp size={24} /></div>
              <div><p className={styles.statLabel}>Income (This Month)</p><h3 className={`${styles.statValue} ${styles.statValueBlue}`}>{formatCurrency(currentMonthStats.income)}</h3></div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardAmber}`}>
              <div className={`${styles.statIcon} ${styles.statIconAmber}`}><TrendingDown size={24} /></div>
              <div><p className={styles.statLabel}>Expenses (This Month)</p><h3 className={`${styles.statValue} ${styles.statValueAmber}`}>{formatCurrency(currentMonthStats.expense)}</h3></div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardPurple}`}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`}><Target size={24} /></div>
              <div><p className={styles.statLabel}>Safe to Spend / Day</p><h3 className={`${styles.statValue} ${styles.statValuePurple}`}>{formatCurrency(safeToSpend)}</h3></div>
            </div>
          </div>

          <div className={styles.mainLayout}>
            {/* Left Column */}
            <div className={styles.scrollableColumn}>
              <div className={styles.panel} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <TabButton active={leftTab === 'transactions'} onClick={() => setLeftTab('transactions')} icon={<History size={16}/>} label="Transactions" />
                  <TabButton active={leftTab === 'subscriptions'} onClick={() => setLeftTab('subscriptions')} icon={<Repeat size={16}/>} label="Subscriptions" />
                </div>
                
                <div style={{ padding: '24px' }}>
                  {leftTab === 'transactions' && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Recent Activity</h3>
                        {data.transactions.length > 0 && <Button variant="ghost" size="sm" onClick={() => setIsHistoryModalOpen(true)}>View All</Button>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                        <select 
                          value={filterType} 
                          onChange={(e: any) => setFilterType(e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem' }}
                        >
                          <option value="all">All Time</option>
                          <option value="month">By Month</option>
                          <option value="date">By Date</option>
                        </select>
                        
                        {filterType === 'month' && (
                          <input 
                            type="month" 
                            value={filterMonth} 
                            onChange={(e) => setFilterMonth(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem' }}
                          />
                        )}
                        {filterType === 'date' && (
                          <input 
                            type="date" 
                            value={filterDate} 
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.85rem' }}
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-4">
                        {sortedAndFilteredTransactions.length === 0 ? (
                           <div className="text-center py-10 text-muted">No transactions found for this filter.</div>
                        ) : (
                          sortedAndFilteredTransactions.slice(0, 10).map((tx: Transaction) => (
                            <TransactionCard key={tx._id} transaction={tx} onDelete={handleDeleteTransaction} />
                          ))
                        )}
                      </div>
                    </>
                  )}

                  {leftTab === 'subscriptions' && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Active Subscriptions</h3>
                        <Button variant="ghost" size="sm" onClick={() => setIsSubModalOpen(true)} leftIcon={<Plus size={16}/>}>Add</Button>
                      </div>
                      <div className="flex flex-col gap-4">
                        {data.subscriptions.length === 0 ? (
                           <div className="text-center py-10 text-muted">No active subscriptions.</div>
                        ) : (
                          data.subscriptions.map((sub: Subscription) => (
                            <SubscriptionCard key={sub._id} subscription={sub} onDelete={handleDeleteSub} />
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.scrollableColumn}>
              <div className={styles.panel} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 'calc(100vh - 120px)' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                  <TabButton active={rightTab === 'insights'} onClick={() => setRightTab('insights')} icon={<PieChart size={16}/>} label="Overview & Insights" />
                  <TabButton active={rightTab === 'planning'} onClick={() => setRightTab('planning')} icon={<Wallet size={16}/>} label="Budgets" />
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                  {rightTab === 'insights' && (
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-4">
                        <h3 className={styles.sectionTitle}>Smart Insights</h3>
                        {smartInsights.map((insight, idx) => (
                          <div key={idx} className={`${styles.aiInsightCard} ${insight.type === 'danger' ? styles.aiDanger : insight.type === 'warning' ? styles.aiWarning : insight.type === 'success' ? styles.aiSuccess : styles.aiInfo}`}>
                            <div className={styles.aiHeader}><Sparkles size={16} /><span>{insight.title}</span></div>
                            <p className={styles.aiText}>{insight.description}</p>
                            {insight.suggestion && (
                              <div className="mt-2 text-sm text-primary-light bg-primary/10 p-3 rounded-lg border border-primary/20">
                                <strong>💡 Suggestion:</strong> {insight.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div>
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
                                      <div className={styles.progressBarFill} style={{ width: `${percentage}%` }} />
                                    </div>
                                  </div>
                                );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {rightTab === 'planning' && (
                    <div className="flex flex-col gap-8">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Category Budgets</h3>
                          <Button variant="ghost" size="sm" onClick={() => setIsBudgetModalOpen(true)} leftIcon={<Plus size={16}/>}>Add</Button>
                        </div>
                        <div className="flex flex-col gap-4">
                          {data.budgets.length === 0 ? (
                             <div className="text-center py-10 text-muted">No active budgets.</div>
                          ) : (
                            data.budgets.map((b: Budget) => (
                              <BudgetCard key={b._id} budget={b} currentSpent={data.expensesByCategory[b.category] || 0} onDelete={handleDeleteBudget} />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add ${txType === 'income' ? 'Income' : 'Expense'}`} size="md">
        <form onSubmit={handleSaveTransaction} className={formStyles.form}>
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}><Wallet size={15} />Transaction Type</label>
            <div className={styles.toggleContainer}>
              <button type="button" className={`${styles.toggleBtn} ${txType === 'expense' ? styles.toggleBtnExpenseActive : ''}`} onClick={() => { setTxType('expense'); setFormData({...formData, category: EXPENSE_CATEGORIES[0]})}}>
                <ArrowDownRight size={18} style={{ marginRight: '8px' }} /> Expense
              </button>
              <button type="button" className={`${styles.toggleBtn} ${txType === 'income' ? styles.toggleBtnIncomeActive : ''}`} onClick={() => { setTxType('income'); setFormData({...formData, category: INCOME_CATEGORIES[0]})}}>
                <ArrowUpRight size={18} style={{ marginRight: '8px' }} /> Income
              </button>
            </div>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}><Sparkles size={15} />Amount (₹)</label>
            <input type="number" step="0.01" min="0" required className={formStyles.input} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}><Hash size={15} />Category</label>
            <select className={formStyles.input} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc' }}>
              <optgroup label={txType === 'expense' ? 'Expense Categories' : 'Income Categories'} style={{ background: '#0f172a' }}>
                {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </optgroup>
            </select>
          </div>
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}><Type size={15} />Description</label>
            <input required className={formStyles.input} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}><Calendar size={15} />Date</label>
            <input type="date" required className={formStyles.input} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <Button type="submit" fullWidth className="mt-4" size="lg">Add {txType === 'income' ? 'Income' : 'Expense'}</Button>
        </form>
      </Modal>

      {/* Budget Modal */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Set Budget" size="sm">
        <form onSubmit={handleSaveBudget} className={formStyles.form}>
           <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>Category</label>
            <select className={formStyles.input} value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>Monthly Limit (₹)</label>
            <input type="number" required className={formStyles.input} value={budgetForm.monthlyLimit} onChange={(e) => setBudgetForm({ ...budgetForm, monthlyLimit: e.target.value })} />
          </div>
          <Button type="submit" fullWidth className="mt-4">Save Budget</Button>
        </form>
      </Modal>

      {/* Subscription Modal */}
      <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title="Add Subscription" size="sm">
        <form onSubmit={handleSaveSub} className={formStyles.form}>
           <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>Service Name</label>
            <input required className={formStyles.input} value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="e.g. Netflix" />
          </div>
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>Amount (₹)</label>
            <input type="number" required className={formStyles.input} value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} />
          </div>
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>Billing Cycle</label>
            <select className={formStyles.input} value={subForm.billingCycle} onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value })} style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>Next Billing Date</label>
            <input type="date" required className={formStyles.input} value={subForm.nextBillingDate} min={todayStr} onChange={(e) => setSubForm({ ...subForm, nextBillingDate: e.target.value })} />
          </div>
          <div className={`${formStyles.field} ${formStyles.fullWidth}`}>
            <label className={formStyles.label}>Category</label>
            <select className={formStyles.input} value={subForm.category} onChange={(e) => setSubForm({ ...subForm, category: e.target.value })} style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <Button type="submit" fullWidth className="mt-4">Save Subscription</Button>
        </form>
      </Modal>

      {/* Transaction History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Transaction History" size="lg">
        <div className="flex flex-col gap-4" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
          {sortedAndFilteredTransactions.map((tx: Transaction) => <TransactionCard key={tx._id} transaction={tx} onDelete={handleDeleteTransaction} />)}
        </div>
      </Modal>

    </div>
  );
}
