import React from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import styles from '@/app/(dashboard)/finance/Finance.module.css';

export interface Subscription {
  _id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  category: string;
  isActive: boolean;
}

interface Props {
  subscription: Subscription;
  onDelete: (id: string) => void;
}

export function SubscriptionCard({ subscription, onDelete }: Props) {
  const nextDate = new Date(subscription.nextBillingDate);
  const isSoon = (nextDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 7;

  return (
    <div className={styles.breakdownItem} style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px' }}>
      <div className={styles.breakdownHeader} style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarClock size={18} color="#3b82f6" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{subscription.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subscription.category}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
           <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ef4444' }}>
             {formatCurrency(subscription.amount)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
           </span>
           <button 
             onClick={() => onDelete(subscription._id)} 
             style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
           >
             <Trash2 size={14} />
           </button>
        </div>
      </div>
      <div style={{ padding: '8px', background: isSoon ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', color: isSoon ? '#f87171' : 'var(--text-secondary)' }}>
        <span>Next Billing:</span>
        <span style={{ fontWeight: 600 }}>{nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>
  );
}
