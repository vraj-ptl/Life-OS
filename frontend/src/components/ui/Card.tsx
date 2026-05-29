import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card = ({
  children,
  className,
  style,
  glass = false,
  hover = false,
  padding = 'lg',
  onClick
}: CardProps) => {
  return (
    <div 
      className={cn(
        styles.card,
        glass && styles.glass,
        hover && styles.hover,
        styles[`padding-${padding}`],
        className
      )}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};
