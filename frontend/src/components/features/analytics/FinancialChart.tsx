'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from 'recharts';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface FinancialChartProps {
  data: any[];
}

export default function FinancialChart({ data }: FinancialChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.label}>{new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color, fontWeight: 500 }}>
              {entry.name}: ${entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`chart-card ${styles.chartContainer}`}>
      <h2>💰 Financial Flow</h2>
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <defs>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={true} 
              tickFormatter={(val) => new Date(val).getDate().toString()} 
              tick={{ fill: '#94a3b8' }} 
              minTickGap={15}
              label={{ value: 'Date', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 13 }}
            />
            
            <YAxis 
              stroke="rgba(255,255,255,0.1)" 
              axisLine={true} 
              tickLine={false} 
              tick={{ fill: '#94a3b8' }} 
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 13 }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
            
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
            <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 8 }} connectNulls={true} />
            
            <Brush dataKey="date" height={30} stroke="#94a3b8" fill="rgba(11, 17, 32, 0.9)" tickFormatter={() => ''} y={370} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
