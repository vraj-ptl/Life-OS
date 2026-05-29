'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success': return <CheckCircle2 className={styles.iconSuccess} />;
    case 'error': return <AlertCircle className={styles.iconError} />;
    case 'info': return <Info className={styles.iconInfo} />;
    case 'warning': return <AlertTriangle className={styles.iconWarning} />;
  }
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastMethods = {
    toast: addToast,
    success: (message: string, description?: string) => addToast({ type: 'success', message, description }),
    error: (message: string, description?: string) => addToast({ type: 'error', message, description }),
    info: (message: string, description?: string) => addToast({ type: 'info', message, description }),
    warning: (message: string, description?: string) => addToast({ type: 'warning', message, description }),
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={cn(styles.toast, styles[t.type])}>
            <div className={styles.iconContainer}>
              <ToastIcon type={t.type} />
            </div>
            <div className={styles.content}>
              <h4 className={styles.title}>{t.message}</h4>
              {t.description && <p className={styles.description}>{t.description}</p>}
            </div>
            <button className={styles.closeBtn} onClick={() => removeToast(t.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
