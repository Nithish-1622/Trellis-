'use client';

import React, { useState } from 'react';
import { TrellisLogo } from './TrellisLogo';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import './Auth2.css';

export interface Auth2Props {
  initialMode?: 'login' | 'register';
  onSuccess: (targetRoute?: string) => void;
  onNavigateHome: () => void;
  onSwitchToMagicLink?: () => void;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onDemoLogin: () => void;
  isLoading?: boolean;
}

export const Auth2: React.FC<Auth2Props> = ({
  initialMode = 'login',
  onSuccess,
  onNavigateHome,
  onSwitchToMagicLink,
  onLogin,
  onRegister,
  onDemoLogin,
  isLoading = false
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      const res = await onRegister(name, email, password);
      if (res.success) {
        onSuccess('/onboarding');
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } else {
      const res = await onLogin(email, password);
      if (res.success) {
        onSuccess('/roadmap');
      } else {
        setErrorMessage(res.error || 'Login failed.');
      }
    }
  };

  const handleOAuth = (provider: string) => {
    // Simulated OAuth sign in with demo user
    onDemoLogin();
    onSuccess('/roadmap');
  };

  return (
    <div className="auth2-container grid grid-cols-1 lg:grid-cols-12 animate-in fade-in duration-300">
      
      {/* Left Form Column */}
      <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-8">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onNavigateHome}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <TrellisLogo size="md" />
            </button>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {mode === 'login' ? 'Auth 2: Sign In' : 'Auth 2: Register'}
            </span>
          </div>

          <h1 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {mode === 'login' ? 'Cultivate your engineering path' : 'Plant your first architecture seed'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
            {mode === 'login'
              ? 'Sign in to access your personalized adaptive learning roadmap.'
              : 'Join Trellis to benchmark your competency geometry with AI guidance.'}
          </p>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('Google')}
              className="auth2-oauth-btn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('GitHub')}
              className="auth2-oauth-btn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Or with email password
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="elena@scalemesh.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{mode === 'login' ? 'Sign In to Trellis' : 'Create Account & Start Calibrating'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Shortcut */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Want to test instantly?</span>
            <button
              type="button"
              onClick={onDemoLogin}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>One-Click Demo Account</span>
            </button>
          </div>
        </div>

        {/* Footer Mode Switch */}
        <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {mode === 'login' ? "Don't have an account?" : 'Already registered?'}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMessage(null); }}
              className="ml-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Register now' : 'Sign in'}
            </button>
          </span>

          {onSwitchToMagicLink && (
            <button
              type="button"
              onClick={onSwitchToMagicLink}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline cursor-pointer"
            >
              Try Magic Link (Auth 5)
            </button>
          )}
        </div>
      </div>

      {/* Right Gradient Hero Side */}
      <div className="hidden lg:flex lg:col-span-5 auth2-gradient-side">
        <div className="space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Cryptographic Competency Mesh</span>
          </div>

          <h2 className="font-literata text-3xl font-bold leading-tight">
            "Traditional roadmaps are dead. Trellis grows with your actual architecture code."
          </h2>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time 6-axis competency geometry</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Smart-prunes irrelevant prerequisite topics</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verifiable 3D architect credential pass</span>
            </div>
          </div>
        </div>

        {/* Bottom Author Attribution */}
        <div className="pt-8 border-t border-white/15 relative z-10">
          <p className="text-xs font-bold text-white">Marcus Vance</p>
          <p className="text-[11px] text-emerald-200/80">Principal Systems Architect at ScaleMesh Inc.</p>
        </div>
      </div>

    </div>
  );
};

export default Auth2;

