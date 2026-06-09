'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface SubItem {
  name: string;
  amount: number;
  cycle: string;
  monthlyEquivalent: number;
}

interface SubscriptionBreakdownChartProps {
  data: SubItem[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'];

export default function SubscriptionBreakdownChart({ data }: SubscriptionBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`chart-card ${styles.chartContainer}`}>
        <h2>🔄 Recurring Expenses</h2>
        <div className={styles.emptyState} style={{ padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No active subscriptions. Add subscriptions in Finance to see this chart.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map(s => ({
    name: s.name,
    value: s.monthlyEquivalent,
    cycle: s.cycle,
    originalAmount: s.amount
  }));

  const totalMonthly = chartData.reduce((sum, s) => sum + s.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <p className={styles.label} style={{ fontWeight: 700 }}>{item.name}</p>
          <p style={{ color: payload[0].payload.fill || '#3b82f6', fontWeight: 600 }}>
            ₹{item.value.toLocaleString()}/mo
          </p>
          {item.cycle === 'yearly' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              (₹{item.originalAmount.toLocaleString()}/year)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`chart-card ${styles.chartContainer}`}>
      <h2>🔄 Recurring Expenses</h2>
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary-light)' }}>
          ₹{totalMonthly.toLocaleString()}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '6px' }}>/month total</span>
      </div>
      <div style={{ width: '100%', height: '320px' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
              animationBegin={300}
              animationDuration={1200}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
