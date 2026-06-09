'use client';

import React, { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import gsap from 'gsap';
import styles from './Analytics.module.css';
import StatCard from '@/components/features/analytics/StatCard';
import FinancialChart from '@/components/features/analytics/FinancialChart';
import HabitConsistencyChart from '@/components/features/analytics/HabitConsistencyChart';
import EnergyMatrixChart from '@/components/features/analytics/EnergyMatrixChart';
import TaskDistributionChart from '@/components/features/analytics/TaskDistributionChart';
import TimeOfDayChart from '@/components/features/analytics/TimeOfDayChart';
import NumericalInsights from '@/components/features/analytics/NumericalInsights';
import AIInsightPanel from '@/components/features/analytics/AIInsightPanel';
import BudgetUtilizationChart from '@/components/features/analytics/BudgetUtilizationChart';
import SubscriptionBreakdownChart from '@/components/features/analytics/SubscriptionBreakdownChart';
import { Activity, Zap, TrendingUp, CheckCircle, Calendar, Wallet, Repeat } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const containerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const yearOptions = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get<any>(`/analytics/detailed?month=${selectedMonth}&year=${selectedYear}`);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (!loading && data && containerRef.current) {
      const q = gsap.utils.selector(containerRef);
      
      gsap.fromTo(q('.stat-card'), 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.7)' }
      );

      gsap.fromTo(q('.chart-card'),
        { scale: 0.95, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, delay: 0.2, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, [loading, data]);

  const selectStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(30, 41, 59, 0.8)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <div>
          <h1>Advanced Analytics</h1>
          <p>Your Life Balance, Energy, and Financial Insights in one place.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} style={{ color: 'var(--color-primary-light)' }} />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={selectStyle}
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={selectStyle}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading Analytics Data...</div>
      ) : !data ? (
        <div className={styles.emptyState}>No Data Available</div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <StatCard 
              title="Tasks Completed" 
              value={data.numericalSummaries?.totalCompletedTasks || 0} 
              label={`${monthNames[selectedMonth-1]} Total`}
              icon={<CheckCircle size={24} color="#3b82f6" />} 
            />
            <StatCard 
              title="Tasks Missed" 
              value={data.numericalSummaries?.totalMissedTasks || 0} 
              label="Overdue / Missed" 
              icon={<Zap size={24} color="#ef4444" />} 
            />
            <StatCard 
              title="Habit Consistency" 
              value={`${data.numericalSummaries?.habitConsistencyRate || 0}%`} 
              label="Maintained Routines" 
              icon={<Activity size={24} color="#8b5cf6" />} 
            />
            <StatCard 
              title="Net Financial Flow" 
              value={`₹${(data.numericalSummaries?.netFlow || 0).toLocaleString()}`} 
              label="Income vs Expenses" 
              icon={<TrendingUp size={24} color="#10b981" />} 
            />
            <StatCard 
              title="Subscription Costs" 
              value={`₹${(data.numericalSummaries?.totalSubscriptionCost || 0).toLocaleString()}/mo`} 
              label={`${data.numericalSummaries?.subscriptionCount || 0} Active`} 
              icon={<Repeat size={24} color="#06b6d4" />} 
            />
            <StatCard 
              title="Budgets Active" 
              value={data.numericalSummaries?.budgetCount || 0} 
              label="Categories Tracked" 
              icon={<Wallet size={24} color="#f59e0b" />} 
            />
          </div>

          <div className={styles.twoColGrid}>
            <AIInsightPanel insight={data.aiInsight} />
            <NumericalInsights data={data.numericalSummaries} />
          </div>

          <div className={styles.chartsGrid}>
            <FinancialChart data={data.timelineData} />
            <HabitConsistencyChart data={data.timelineData} />
          </div>

          <div className={styles.chartsGrid}>
            <BudgetUtilizationChart data={data.budgetUtilization} />
            <SubscriptionBreakdownChart data={data.subscriptionBreakdown} />
          </div>

          <div className={styles.chartsGrid}>
             <EnergyMatrixChart data={data.timelineData} />
          </div>

          <div className={styles.twoColGrid}>
            <TaskDistributionChart data={data.taskDistribution} />
            <TimeOfDayChart data={data.timeOfDay} />
          </div>
        </>
      )}
    </div>
  );
}
