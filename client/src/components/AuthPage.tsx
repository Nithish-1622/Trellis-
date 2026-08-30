'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Auth2 from './Auth2';
import Auth5 from './Auth5';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess: (targetRoute?: string) => void;
  onNavigateHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onSuccess,
  onNavigateHome
}) => {
  const { login, register, loginDemoUser, isLoading } = useAuth();
  const [authBlockVariant, setAuthBlockVariant] = useState<'auth2' | 'auth5'>('auth2');

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 space-y-4">
      
      {/* Variant Selector Pill */}
      <div className="inline-flex p-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setAuthBlockVariant('auth2')}
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            authBlockVariant === 'auth2'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Auth 2 (Split & OAuth)
        </button>
        <button
          type="button"
          onClick={() => setAuthBlockVariant('auth5')}
          className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            authBlockVariant === 'auth5'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Auth 5 (Magic Link)
        </button>
      </div>

      {authBlockVariant === 'auth2' ? (
        <Auth2
          initialMode={initialMode}
          onSuccess={onSuccess}
          onNavigateHome={onNavigateHome}
          onSwitchToMagicLink={() => setAuthBlockVariant('auth5')}
          onLogin={login}
          onRegister={register}
          onDemoLogin={loginDemoUser}
          isLoading={isLoading}
        />
      ) : (
        <Auth5
          onSuccess={onSuccess}
          onNavigateHome={onNavigateHome}
          onSwitchToPassword={() => setAuthBlockVariant('auth2')}
          onDemoLogin={loginDemoUser}
        />
      )}
    </div>
  );
};

export default AuthPage;
