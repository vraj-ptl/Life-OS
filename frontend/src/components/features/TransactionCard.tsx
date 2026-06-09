import React from 'react';
import styles from './TransactionCard.module.css';
import { ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === 'income';
  
  // Map type to CSS variables for dynamic coloring
  const typeStyle = {
    '--type-color': isIncome ? '#10b981' : '#f43f5e', // Emerald for income, Rose for expense
  } as React.CSSProperties;

  return (
    <div className={styles.wrapper} style={typeStyle}>
      <div className={styles.previewCard}>
        <div className={styles.typeRail} />
        
        <div className={styles.cardInner}>
          <div className={styles.topRow}>
            
            <div className={styles.iconWrapper}>
              {isIncome ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
            </div>

            <div className={styles.titleBlock}>
              <h4 className={styles.title} title={transaction.description || transaction.category}>
                {transaction.description || transaction.category}
              </h4>
              <div className={styles.dateCategory}>
                <span>{new Date(transaction.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{transaction.category}</span>
              </div>
            </div>

            <div className={styles.amountBlock}>
              <span className={styles.amount}>
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>
              <button 
                className={styles.deleteBtn}
                onClick={() => onDelete(transaction._id)}
                title="Delete Transaction"
              >
                <Trash2 size={16} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
