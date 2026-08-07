import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from '../lib/auth';
import { api } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarded?: boolean;
  requireUnonboarded?: boolean;
}

export function ProtectedRoute({ children, requireOnboarded, requireUnonboarded }: ProtectedRouteProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    // Gate on a valid backend JWT session (also clears expired tokens).
    getSession().then(async ({ session }) => {
      if (!session) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const me = await api.get<{ is_onboarded?: boolean; business?: { is_onboarded?: boolean } }>('/api/v1/auth/me');
        const onboardedState = me.is_onboarded ?? me.business?.is_onboarded ?? true;
        setIsOnboarded(onboardedState);
      } catch {
        // Fallback gracefully if API is temporarily unavailable
        setIsOnboarded(true);
      }
      setStatus('authenticated');
    });
  }, []);

  if (status === 'loading' || (status === 'authenticated' && isOnboarded === null)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--brand)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarded && isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireUnonboarded && isOnboarded === true) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
