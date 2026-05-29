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
import { Mail, KeyRound, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const { login } = useAuth();

  const animateStepTransition = (nextStep: 1 | 2 | 3) => {
    const currentEl = document.querySelector(`.step-${step}`);
    const nextEl = document.querySelector(`.step-${nextStep}`);
    
    if (currentEl && nextEl) {
      gsap.to(currentEl, {
        x: -50, opacity: 0, duration: 0.3, onComplete: () => {
          setStep(nextStep);
          gsap.fromTo(nextEl, 
            { x: 50, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
          );
        }
      });
    } else {
      setStep(nextStep);
    }
  };

  useGSAP(() => {
    gsap.from('.auth-header', { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
    gsap.from(`.step-1`, { opacity: 0, scale: 0.95, duration: 0.4, delay: 0.2 });
  }, { scope: containerRef });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      toast({ type: 'success', message: 'OTP Sent', description: 'Check your email for the verification code.' });
      animateStepTransition(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post<{ resetToken: string }>('/auth/verify-otp', { email, otp });
      if (res.success && res.data) {
        setResetToken(res.data.resetToken);
        toast({ type: 'success', message: 'OTP Verified' });
        animateStepTransition(3);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post<any>('/auth/reset-password', { 
        email, 
        resetToken, 
        newPassword 
      });
      if (res.success && res.data) {
        toast({ type: 'success', message: 'Password Reset', description: 'Your password has been changed successfully.' });
        login(res.data.token, res.data.user);
        // AuthContext will handle redirect to dashboard
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef}>
      <Card glass className="p-xl border-border-hover shadow-xl overflow-hidden min-h-[400px] flex flex-col">
        <div className="auth-header text-center mb-lg">
          <div className="text-4xl mb-sm">🔐</div>
          <h1 className="text-2xl font-bold text-gradient mb-xs">Recover Account</h1>
          <p className="text-muted text-sm">
            {step === 1 && "Enter your email to receive an OTP"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Create a new secure password"}
          </p>
        </div>

        <div className="relative flex-1">
          {/* STEP 1 */}
          <div className={`step-1 absolute w-full top-0 ${step !== 1 ? 'hidden' : ''}`}>
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-md">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                leftIcon={<Mail size={18} />}
                error={error}
                disabled={isLoading}
              />
              <Button type="submit" fullWidth size="lg" isLoading={isLoading} rightIcon={<ArrowRight size={18} />} className="mt-sm">
                Send OTP
              </Button>
            </form>
          </div>

          {/* STEP 2 */}
          <div className={`step-2 absolute w-full top-0 ${step !== 2 ? 'opacity-0 pointer-events-none' : ''}`}>
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-md">
              <div className="text-center mb-2">
                <span className="text-xs text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                  {email}
                </span>
              </div>
              <Input
                label="6-Digit OTP"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                leftIcon={<KeyRound size={18} />}
                error={error}
                disabled={isLoading}
                className="text-center tracking-[0.5em] font-mono text-lg"
              />
              <div className="flex gap-sm mt-sm">
                <Button type="button" variant="outline" onClick={() => animateStepTransition(1)} disabled={isLoading}>
                  <ArrowLeft size={18} />
                </Button>
                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  Verify
                </Button>
              </div>
            </form>
          </div>

          {/* STEP 3 */}
          <div className={`step-3 absolute w-full top-0 ${step !== 3 ? 'opacity-0 pointer-events-none' : ''}`}>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-md">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                leftIcon={<Lock size={18} />}
                error={error}
                disabled={isLoading}
              />
              <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-sm">
                Reset Password
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-auto pt-lg text-center text-sm text-muted">
          Remember your password?{' '}
          <Link href="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
