'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import styles from '@/app/(dashboard)/analytics/Analytics.module.css';

interface AIInsightPanelProps {
  insight: string;
}

export default function AIInsightPanel({ insight }: AIInsightPanelProps) {
  return (
    <div className={`chart-card ${styles.chartContainer} ${styles.aiPanel}`}>
      <h2>
        <Sparkles size={20} /> AI Trend Insights
      </h2>
      <div className={styles.aiBody}>
        <p>
          {insight || "Keep up the great work! Analyze your charts to find your optimal workflow."}
        </p>
      </div>
    </div>
  );
}
