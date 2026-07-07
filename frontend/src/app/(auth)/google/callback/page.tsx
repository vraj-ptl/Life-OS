'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import React, { Suspense } from 'react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState('Authenticating with Google...');
  
  // Use a ref to prevent double execution in React Strict Mode
  const hasAttempted = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      toast({ type: 'error', message: errorDescription || error || 'Google authentication failed' });
      router.push('/login');
      return;
    }

    if (!code) {
      router.push('/login');
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const authenticate = async () => {
      try {
        const res = await api.post<any>('/auth/oauth/g/callback', { code });
        
        if (res.success && res.data) {
          toast({ type: 'success', message: 'Successfully logged in with Google!' });
          login(res.data.token, res.data.user);
          router.push('/dashboard');
        }
      } catch (err: any) {
        toast({ type: 'error', message: err.message || 'Google authentication failed' });
        router.push('/login');
      }
    };

    authenticate();
  }, [searchParams, login, router, toast]);

  return (
    <div className="flex justify-center items-center h-64">
      <Card glass className="p-xl border-border-hover shadow-xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gradient">{status}</h2>
        <p className="text-muted text-sm mt-2">Please wait while we log you in...</p>
      </Card>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
