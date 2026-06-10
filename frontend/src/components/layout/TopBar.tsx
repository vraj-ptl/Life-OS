'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './TopBar.module.css';

export const TopBar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <header className={styles.topbar}>


      <div className={styles.actions}>
        <div className={styles.profileContainer}>
          <button 
            className={styles.profileBtn}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarFallback}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </button>

          {showDropdown && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownName}>{user?.name}</span>
                <span className={styles.dropdownEmail}>{user?.email}</span>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={logout}>
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
