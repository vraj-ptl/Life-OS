'use client';

import React from 'react';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface NumericalInsightsProps {
  data: {
    netFlow: number;
    habitConsistencyRate: string | number;
    completionRate: string | number;
    mostProductiveDay: string;
    totalCompletedTasks: number;
    totalMissedTasks: number;
    totalIncome: number;
    totalExpenses: number;
  };
}

export default function NumericalInsights({ data }: NumericalInsightsProps) {
  return (
    <div className={`chart-card ${styles.chartContainer}`} style={{ minHeight: 'auto' }}>
      <h2>📊 Key Insights Summary</h2>
      <div className={styles.insightsGrid}>
        <div className={styles.insightItem}>
          <span className={styles.insightLabel}>Financial Net Flow</span>
          <span className={`${styles.insightValue} ${data.netFlow >= 0 ? styles.insightValuePositive : styles.insightValueNegative}`}>
            ${data.netFlow.toFixed(2)}
          </span>
          <span className={styles.insightSub}>Income vs Expenses</span>
        </div>
        
        <div className={styles.insightItem}>
          <span className={styles.insightLabel}>Habit Consistency</span>
          <span className={`${styles.insightValue} ${styles.insightValueViolet}`}>{data.habitConsistencyRate}%</span>
          <span className={styles.insightSub}>Success rate in 30 days</span>
        </div>
        
        <div className={styles.insightItem}>
          <span className={styles.insightLabel}>Task Completion Rate</span>
          <span className={`${styles.insightValue} ${styles.insightValueBlue}`}>{data.completionRate}%</span>
          <span className={styles.insightSub}>{data.totalCompletedTasks} done, {data.totalMissedTasks} missed</span>
        </div>
        
        <div className={styles.insightItem}>
          <span className={styles.insightLabel}>Most Productive Day</span>
          <span className={`${styles.insightValue} ${styles.insightValueAmber}`}>{data.mostProductiveDay || 'N/A'}</span>
          <span className={styles.insightSub}>Peak task completion</span>
        </div>
      </div>
    </div>
  );
}
