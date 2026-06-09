import React from 'react';
import { Target, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import styles from '@/app/(dashboard)/finance/Finance.module.css';

export interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  deadline?: string;
}

interface Props {
  goal: SavingsGoal;
  onDelete: (id: string) => void;
  onAddFunds: (id: string, amount: number) => void;
}

export function SavingsGoalCard({ goal, onDelete, onAddFunds }: Props) {
  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100).toFixed(0);
  
  return (
    <div className={styles.breakdownItem} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: `1px solid ${goal.color}33` }}>
      <div className={styles.breakdownHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} color={goal.color} />
          <span className={styles.breakdownCategory}>{goal.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={styles.breakdownAmount}>
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </span>
          <button 
            onClick={() => onDelete(goal._id)} 
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className={styles.progressBarTrack} style={{ marginTop: '12px', height: '10px' }}>
        <div 
          className={styles.progressBarFill} 
          style={{ width: `${percentage}%`, background: goal.color }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>{percentage}% Reached</span>
        {goal.deadline && <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>}
      </div>

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => {
            const amount = prompt(`Add funds to ${goal.name}:`);
            if (amount && !isNaN(parseFloat(amount))) {
              onAddFunds(goal._id, parseFloat(amount));
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Add Funds
        </button>
      </div>
    </div>
  );
}
