'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface TimeOfDayChartProps {
  data: any[];
}

const COLORS = ['#fde047', '#f97316', '#a78bfa', '#38bdf8']; // Morning, Afternoon, Evening, Night

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.label}>{payload[0].payload.name}</p>
        <p style={{ color: payload[0].fill, fontWeight: 600 }}>
          {payload[0].value} tasks completed
        </p>
      </div>
    );
  }
  return null;
};

export default function TimeOfDayChart({ data }: TimeOfDayChartProps) {

  return (
    <div className={`chart-card ${styles.chartContainer}`}>
      <h2>⏰ Productivity by Time of Day</h2>
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis 
              type="number" 
              tickLine={false} 
              axisLine={true} 
              tick={{ fill: '#94a3b8' }}
              label={{ value: 'Tasks Completed', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 13 }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              tickLine={false} 
              axisLine={true} 
              tick={{ fill: '#94a3b8' }} 
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30} animationDuration={1500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
