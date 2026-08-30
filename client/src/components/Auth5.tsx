'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrellisLogo } from './TrellisLogo';
import {
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  Zap
} from 'lucide-react';
import './Auth5.css';

export interface Auth5Props {
  onSuccess: (targetRoute?: string) => void;
  onNavigateHome: () => void;
  onSwitchToPassword?: () => void;
  onDemoLogin: () => void;
}

export const Auth5: React.FC<Auth5Props> = ({
  onSuccess,
  onNavigateHome,
  onSwitchToPassword,
  onDemoLogin
}) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cooldown countdown timer when in 'sent' state
  useEffect(() => {
    let timer: number;
    if (isSent && cooldown > 0) {
      timer = window.setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSent, cooldown]);

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      setCooldown(60);
    }, 600);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(60);
  };

  const handleSimulateClickLink = () => {
    onDemoLogin();
    onSuccess('/roadmap');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
      <div className="auth5-card animate-in fade-in duration-300">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onNavigateHome} className="hover:opacity-80 transition-opacity cursor-pointer">
            <TrellisLogo size="md" />
          </button>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Auth 5: Magic Link
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!isSent ? (
            /* STAGE 1: ENTER EMAIL */
            <motion.div
              key="enter-email"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="font-literata text-2xl font-bold text-slate-900 dark:text-white">
                  Sign in with Magic Link
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  We'll send a passwordless verification link directly to your inbox. No passwords required.
                </p>
              </div>

              <form onSubmit={handleSubmitEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Your Work Email
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

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Sending magic link...</span>
                  ) : (
                    <>
                      <span>Send Magic Verification Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OAuth Fallbacks */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                  Or instant login with
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { onDemoLogin(); onSuccess('/roadmap'); }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Demo User</span>
                  </button>

                  {onSwitchToPassword && (
                    <button
                      type="button"
                      onClick={onSwitchToPassword}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Password (Auth 2)</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* STAGE 2: CHECK YOUR INBOX STATE */
            <motion.div
              key="check-inbox"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-center"
            >
              <div className="magic-inbox-icon">
                <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="font-literata text-2xl font-bold text-slate-900 dark:text-white">
                  Check your inbox
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  We've sent a temporary magic link to <strong className="text-slate-900 dark:text-white">{email}</strong>. Click the link inside the email to sign in.
                </p>
              </div>

              {/* Instant Simulation Action */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Simulate Email Click</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateClickLink}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Verification Link (Instant Sign-in)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Resend Cooldown */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Didn't receive the email? Check spam or resend below.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className={`font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors ${
                    cooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend magic link'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSent(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Use a different email address</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Auth5;

