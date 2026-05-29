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
import { User, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { login } = useAuth();

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.auth-header', { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' })
      .from('.auth-field', { x: -20, opacity: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }, '-=0.2')
      .from('.auth-action', { scale: 0.95, opacity: 0, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.1');
  }, { scope: containerRef });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Must be at least 6 characters';
    else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = 'Must contain letters and numbers';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await api.post<any>('/auth/register', { 
        name: formData.name, 
        email: formData.email, 
        password: formData.password 
      });
      
      if (res.success && res.data) {
        toast({ type: 'success', message: 'Account created!', description: 'Welcome to Life OS.' });
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      if (err.errors) {
        const serverErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => { serverErrors[e.field] = e.message; });
        setErrors(serverErrors);
      } else {
        toast({ type: 'error', message: err.message || 'Registration failed' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pwdStrength = calculatePasswordStrength(formData.password);

  return (
    <div ref={containerRef}>
      <Card glass className="p-xl border-border-hover shadow-xl">
        <div className="auth-header text-center mb-lg">
          <div className="text-4xl mb-sm">🚀</div>
          <h1 className="text-2xl font-bold text-gradient mb-xs">Create Account</h1>
          <p className="text-muted text-sm">Start your journey with Life OS</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="auth-field">
            <Input
              name="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              leftIcon={<User size={18} />}
              error={errors.name}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail size={18} />}
              error={errors.email}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock size={18} />}
              error={errors.password}
              disabled={isLoading}
            />
            {formData.password && !errors.password && (
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full ${
                      i <= pwdStrength 
                        ? (pwdStrength < 3 ? 'bg-warning-light' : pwdStrength < 4 ? 'bg-info-light' : 'bg-success-light') 
                        : 'bg-border-default'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="auth-field mb-sm">
            <Input
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              leftIcon={<ShieldCheck size={18} />}
              error={errors.confirmPassword}
              disabled={isLoading}
            />
          </div>

          <div className="auth-action">
            <Button 
              type="submit" 
              fullWidth 
              size="lg" 
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </div>
        </form>

        <div className="auth-action mt-lg text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-secondary-light hover:text-secondary font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
