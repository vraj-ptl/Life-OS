'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import { isPublicAuthPath } from '@/lib/authPaths';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  xp: number;
  level: number;
  badges: any[];
  preferences: {
    theme: string;
    currency: string;
    notificationsEnabled: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('life-os-token');
    localStorage.removeItem('life-os-user');
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('life-os-token');
      const savedUser = localStorage.getItem('life-os-user');
      const currentPath = pathname || '';
      const onPublicAuthPath = isPublicAuthPath(currentPath);

      if (token) {
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Failed to parse saved user', e);
          }
        }

        if (currentPath.startsWith('/google/callback')) {
          setIsLoading(false);
          return;
        }

        // Verify token & get latest user data
        try {
          const res = await api.get<{ user: User }>('/auth/me');
          if (res.success && res.data) {
            setUser(res.data.user);
            localStorage.setItem('life-os-user', JSON.stringify(res.data.user));
          } else {
            if (onPublicAuthPath) {
              localStorage.removeItem('life-os-token');
              localStorage.removeItem('life-os-user');
              setUser(null);
            } else {
              handleLogout();
            }
          }
        } catch (error) {
          console.error('Auth verification failed', error);
          if (onPublicAuthPath) {
            localStorage.removeItem('life-os-token');
            localStorage.removeItem('life-os-user');
            setUser(null);
          } else {
            handleLogout();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [pathname, router]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('life-os-token', token);
    localStorage.setItem('life-os-user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('life-os-user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout: handleLogout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
