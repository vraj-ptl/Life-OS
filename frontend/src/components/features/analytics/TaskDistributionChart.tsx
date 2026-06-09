'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface TaskDistributionChartProps {
  data: any[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export default function TaskDistributionChart({ data }: TaskDistributionChartProps) {
  // Filter out zero values and take top 6
  const filteredData = data.filter(item => item.value > 0).slice(0, 6);

  if (filteredData.length === 0) {
    return (
      <div className={`chart-card ${styles.chartContainer}`}>
        <h2>🎯 Task Distribution</h2>
        <div className={styles.emptyState} style={{ padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No tag data available for the last 30 days.</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.label}>{payload[0].name}</p>
          <p style={{ color: payload[0].payload.fill, fontWeight: 600 }}>
            {payload[0].value} tasks completed
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`chart-card ${styles.chartContainer}`}>
      <h2>🎯 Task Distribution by Tags</h2>
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              animationBegin={200}
              animationDuration={1500}
            >
              {filteredData.map((entry, index) => (
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
