'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsapConfig';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { login } = useAuth();

  useGSAP(() => {
    // Entrance animations
    const tl = gsap.timeline();
    tl.from('.auth-header', { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' })
      .from('.auth-field', { y: 20, opacity: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, '-=0.2')
      .from('.auth-action', { scale: 0.95, opacity: 0, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.1');
  }, { scope: containerRef });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await api.post<any>('/auth/login', { email, password, rememberMe });
      if (res.success && res.data) {
        toast({ type: 'success', message: 'Welcome back!' });
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      if (err.errors) {
        // Validation errors from server
        const serverErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => { serverErrors[e.field] = e.message; });
        setErrors(serverErrors);
      } else {
        toast({ type: 'error', message: err.message || 'Login failed' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      localStorage.removeItem('life-os-token');
      localStorage.removeItem('life-os-user');
      const res = await api.get<{url: string}>('/auth/google/url');
      if (res.success && res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Failed to connect to Google' });
    }
  };

  return (
    <div ref={containerRef}>
      <Card glass className="p-lg border-border-hover shadow-glow-sm hover:shadow-glow transition-shadow duration-500">
        <div className="auth-header text-center mb-xl">
          <div className="text-4xl mb-sm">⚡</div>
          <h1 className="text-2xl font-bold text-gradient mb-xs">Welcome Back</h1>
          <p className="text-muted text-sm">Sign in to your Life OS</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="auth-field">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              error={errors.email}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              error={errors.password}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field flex items-center justify-between mt-sm mb-md">
            <label className="flex items-center gap-sm cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-border-default bg-bg-input text-primary focus:ring-primary focus:ring-offset-bg-card accent-primary"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="text-sm text-secondary group-hover:text-primary transition-colors">
                Remember me
              </span>
            </label>
            
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary-light hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <div className="auth-action">
            <Button 
              type="submit" 
              fullWidth 
              size="lg" 
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>

          <div className="auth-action mt-md">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border-default"></div>
              <span className="flex-shrink-0 mx-4 text-muted text-sm">Or continue with</span>
              <div className="flex-grow border-t border-border-default"></div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              fullWidth 
              size="lg" 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>
          </div>
        </form>

        <div className="auth-action mt-lg text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-light hover:text-primary font-medium transition-colors">
            Create one
          </Link>
        </div>
      </Card>
    </div>
  );
}
