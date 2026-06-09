import React from 'react';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import styles from '@/app/(dashboard)/finance/Finance.module.css';

export interface Budget {
  _id: string;
  category: string;
  monthlyLimit: number;
}

interface Props {
  budget: Budget;
  currentSpent: number;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, currentSpent, onDelete }: Props) {
  const percentage = Math.min((currentSpent / budget.monthlyLimit) * 100, 100);
  const isOver = currentSpent >= budget.monthlyLimit;
  const isWarning = percentage >= 80 && !isOver;

  let trackColor = '#3b82f6';
  if (isOver) trackColor = '#ef4444';
  else if (isWarning) trackColor = '#f59e0b';

  return (
    <div className={styles.breakdownItem} style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px' }}>
      <div className={styles.breakdownHeader} style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOver ? <AlertCircle size={18} color="#ef4444" /> : isWarning ? <AlertCircle size={18} color="#f59e0b" /> : <CheckCircle size={18} color="#10b981" />}
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{budget.category}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: isOver ? '#ef4444' : 'var(--text-primary)', fontWeight: 600 }}>
            {formatCurrency(currentSpent)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {formatCurrency(budget.monthlyLimit)}</span>
          </span>
          <button 
             onClick={() => onDelete(budget._id)} 
             style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
           >
             <Trash2 size={14} />
           </button>
        </div>
      </div>
      
      <div className={styles.progressBarTrack} style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
        <div 
          className={styles.progressBarFill} 
          style={{ width: `${percentage}%`, background: trackColor, transition: 'width 0.5s ease-out' }}
        />
      </div>
      
      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: isOver ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--text-muted)' }}>
        {isOver 
          ? `Over budget by ${formatCurrency(currentSpent - budget.monthlyLimit)}` 
          : `${formatCurrency(budget.monthlyLimit - currentSpent)} remaining`}
      </div>
    </div>
  );
}
