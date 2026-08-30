'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  Compass
} from 'lucide-react';
import './Hero21.css';

export interface Hero21Props {
  badgeText?: string;
  headline?: string;
  subheadline?: string;
  onGetStarted?: () => void;
  onExploreResources?: () => void;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  rightElement?: React.ReactNode;
  ambientLabels?: Array<{
    label: string;
    icon: React.ReactNode;
  }>;
}

export const Hero21: React.FC<Hero21Props> = ({
  badgeText = 'AI-Powered Adaptive Learning Trellis',
  headline = 'Grow your engineering mastery on a living trellis.',
  subheadline = 'Traditional roadmaps are rigid and linear. Trellis continuously evaluates your real-world competencies, identifies your highest-leverage growth gaps, and cultivates an organic milestone path that blooms as you learn.',
  onGetStarted,
  onExploreResources,
  primaryCtaText = 'Begin Your Trellis Path',
  secondaryCtaText = 'Browse Resources',
  rightElement,
  ambientLabels = [
    { label: '98.4% Inference Accuracy', icon: <Zap className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Living Milestone DAG', icon: <Layers className="w-3.5 h-3.5 text-emerald-500" /> },
    { label: 'Zero Static Roadmaps', icon: <Compass className="w-3.5 h-3.5 text-teal-500" /> }
  ]
}) => {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Container with GLSL Aurora Backdrop */}
      <div className="hero21-container bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl">
        
        {/* GLSL Aurora Mesh Layers */}
        <div className="hero21-aurora-bg">
          <div className="hero21-aurora-wave hero21-wave-1" />
          <div className="hero21-aurora-wave hero21-wave-2" />
          <div className="hero21-aurora-wave hero21-wave-3" />
        </div>

        {/* Ambient Top Row: Luminous Orb Mark + Tag & Floating Telemetry */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-8">
          
          {/* Luminous Orb Badge */}
          <div className="flex items-center gap-3">
            <div className="hero21-orb-mark">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{badgeText}</span>
            </div>
          </div>

          {/* Ambient Action Labels */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {ambientLabels.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                className="ambient-action-label"
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-literata text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              {headline}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onGetStarted}
                className="luminous-cta-btn group"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onExploreResources}
                className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{secondaryCtaText}</span>
              </button>
            </div>

            {/* Micro Metrics Strip */}
            <div className="pt-4">
              <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xs">
                <div>
                  <span className="font-literata text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 block">
                    6-Axis
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Competency Radar</span>
                </div>
                <div>
                  <span className="font-literata text-2xl sm:text-3xl font-bold text-amber-500 dark:text-amber-400 block">
                    100%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Adaptive Growth</span>
                </div>
                <div>
                  <span className="font-literata text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300 block">
                    1.8x
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Retention Velocity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Interactive Element / Radar Preview */}
          {rightElement && (
            <div className="lg:col-span-5 relative">
              {rightElement}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero21;

