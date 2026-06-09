'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface BudgetItem {
  category: string;
  allocated: number;
  spent: number;
  utilization: number;
}

interface BudgetUtilizationChartProps {
  data: BudgetItem[];
}

export default function BudgetUtilizationChart({ data }: BudgetUtilizationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`chart-card ${styles.chartContainer}`}>
        <h2>📊 Budget vs Actual</h2>
        <div className={styles.emptyState} style={{ padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No budgets set. Add budgets in Finance to see this chart.</p>
        </div>
      </div>
    );
  }

  const getBarColor = (utilization: number) => {
    if (utilization > 100) return '#ef4444';
    if (utilization > 80) return '#f59e0b';
    return '#10b981';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <p className={styles.label} style={{ fontWeight: 700 }}>{label}</p>
          <p style={{ color: '#10b981' }}>Budget: ₹{item.allocated.toLocaleString()}</p>
          <p style={{ color: getBarColor(item.utilization), fontWeight: 600 }}>
            Spent: ₹{item.spent.toLocaleString()} ({item.utilization}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`chart-card ${styles.chartContainer}`}>
      <h2>📊 Budget vs Actual Spending</h2>
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
            <XAxis type="number" tickFormatter={(v) => `₹${v}`} stroke="var(--text-muted)" fontSize={12} />
            <YAxis type="category" dataKey="category" stroke="var(--text-muted)" fontSize={12} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="var(--border-default)" />
            <Bar dataKey="allocated" fill="rgba(59, 130, 246, 0.25)" radius={[0, 4, 4, 0]} barSize={18} name="Budget" />
            <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={18} name="Spent">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(59, 130, 246, 0.4)', display: 'inline-block' }} /> Budget
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} /> Under Budget
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Near Limit
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Over Budget
        </span>
      </div>
    </div>
  );
}
