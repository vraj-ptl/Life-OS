'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Activity, 
  Wallet, 
  BarChart2, 
  Mail, 
  Calendar, 
  BookOpen, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { href: '/habits', label: 'Habits', icon: <Activity size={20} /> },
  { href: '/finance', label: 'Finance', icon: <Wallet size={20} /> },
  { href: '/analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
  { href: '/email', label: 'Email', icon: <Mail size={20} /> },
  { href: '/calendar', label: 'Calendar', icon: <Calendar size={20} /> },
  { href: '/notes', label: 'Notes', icon: <BookOpen size={20} /> },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(styles.sidebar, isCollapsed && styles.collapsed)}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          {!isCollapsed && <span className={styles.logoText}>Life OS</span>}
        </div>
        <button 
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(styles.navItem, isActive && styles.active)}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={styles.navIcon}>{item.icon}</div>
              {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
              {isActive && <div className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className={styles.footer}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
              <div className={styles.levelBadge}>{user.level}</div>
            </div>
            
            {!isCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userXp}>{user.xp} XP to next level</span>
                <div className={styles.xpBar}>
                  <div 
                    className={styles.xpFill} 
                    style={{ width: `${(user.xp % 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
