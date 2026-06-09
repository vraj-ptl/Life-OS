'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface EnergyMatrixChartProps {
  data: any[];
}

export default function EnergyMatrixChart({ data }: EnergyMatrixChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isHighRisk = payload.length > 1 && payload[0].value > 0 && payload[1].value > payload[0].value * 0.6;
      
      return (
        <div className={styles.customTooltip}>
          <p className={styles.label}>{new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color, fontWeight: 500 }}>
              {entry.name}: {entry.value}
            </p>
          ))}
          {payload.length > 1 && (
            <p style={{ fontSize: '0.8rem', color: isHighRisk ? '#ef4444' : '#10b981', marginTop: '0.5rem', fontWeight: 600 }}>
              {isHighRisk ? '⚠️ Burnout Risk: Too many high-energy tasks!' : '✅ Sustainable Energy Use'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`chart-card ${styles.chartContainer}`}>
      <h2>⚡ Energy & Productivity Matrix</h2>
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={true} 
              tickFormatter={(val) => new Date(val).getDate().toString()} 
              tick={{ fill: '#94a3b8' }} 
              minTickGap={15}
              label={{ value: 'Date (Day of Month)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 13 }}
            />
            <YAxis 
              tickLine={false} 
              axisLine={true} 
              tick={{ fill: '#94a3b8' }} 
              label={{ value: 'Task Count', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 13 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
            
            <Bar dataKey="lowEnergyTasks" stackId="a" name="Low Energy" fill="#10b981" maxBarSize={40} />
            <Bar dataKey="medEnergyTasks" stackId="a" name="Medium Energy" fill="#3b82f6" maxBarSize={40} />
            <Bar dataKey="highEnergyTasks" stackId="a" name="High Energy" fill="#f97316" maxBarSize={40} />
            <Bar dataKey="missedTasks" stackId="a" name="Missed (Overdue)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
