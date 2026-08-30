'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Layers,
  Activity,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Compass,
  Zap
} from 'lucide-react';
import './Features4.css';

export interface FeatureItem {
  id: string;
  badge: string;
  title: string;
  shortDesc: string;
  bulletPoints: string[];
  icon: React.ReactNode;
  mockup: React.ReactNode;
}

export interface Features4Props {
  badgeText?: string;
  heading?: string;
  subheading?: string;
  autoCycleDuration?: number;
  features?: FeatureItem[];
  onCtaClick?: () => void;
  className?: string;
}

export const Features4: React.FC<Features4Props> = ({
  badgeText = 'Architecture Engine Capabilities',
  heading = 'Engineered for exponential engineering mastery',
  subheading = 'Discover how Trellis transforms static curriculum into an organic, self-calibrating milestone lattice.',
  autoCycleDuration = 5500,
  features,
  onCtaClick,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const defaultFeatures: FeatureItem[] = [
    {
      id: 'radar',
      badge: 'Continuous Geometry',
      title: '6-Axis Competency Radar',
      shortDesc: 'Dynamic polygon tracking across Systems, Architecture, Data, Design, Leadership, and Research.',
      bulletPoints: [
        'Dynamic radar perimeter expansion as milestones are mastered',
        'Automatic baseline inference from optional resume signals',
        'Real-time gap detection against target Canopy Architect roles'
      ],
      icon: <Activity className="w-5 h-5 text-emerald-500" />,
      mockup: (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live Competency Mesh
            </span>
            <span className="text-xs font-mono font-bold text-amber-500">
              Target: Staff Architect
            </span>
          </div>
          <div className="space-y-3 pt-1">
            {[
              { label: 'Distributed Systems & Scaling', val: 85, color: '#10b981' },
              { label: 'Domain-Driven Design (DDD)', val: 78, color: '#059669' },
              { label: 'Event Sagas & Transactional Outbox', val: 72, color: '#047857' },
              { label: 'Zero-Trust Mesh Security', val: 88, color: '#34d399' }
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{item.val}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 0.6 }}
                    style={{ backgroundColor: item.color }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'lattice',
      badge: 'Non-Linear DAG',
      title: 'Organic Growth Lattice',
      shortDesc: 'A living milestone dependency graph that sprouts new branches and prunes irrelevant topics.',
      bulletPoints: [
        'Multi-track exploration without breaking prerequisite foundations',
        'Visual node states: Completed, In-Progress, Available, and Locked',
        'Instant milestone regeneration based on personal calibration feedback'
      ],
      icon: <Layers className="w-5 h-5 text-teal-500" />,
      mockup: (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Milestone Lattice Flow
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600">3 of 8 Mastered</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[
              { title: 'mTLS Service Mesh', status: 'Mastered', badge: 'Done' },
              { title: 'Raft Consensus Protocol', status: 'In Progress', badge: 'Active' },
              { title: 'Transactional Outbox', status: 'Available', badge: 'Next' },
              { title: 'CQRS & Event Sourcing', status: 'Prereq Locked', badge: 'Locked' }
            ].map(node => (
              <div
                key={node.title}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                    {node.badge}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{node.title}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'mentor',
      badge: 'AI Systems Guide',
      title: 'Contextual AI Architecture Guide',
      shortDesc: 'Instant trade-off analysis, deep RFC breakdown, and diagnostic feedback on complex system designs.',
      bulletPoints: [
        'Ask real-time architecture questions regarding Kafka vs RabbitMQ, consensus, or sharding',
        'Deep-dive rationale for every suggested course and resource',
        'Pre-calibrated prompt chips tailored to current learning bottlenecks'
      ],
      icon: <Brain className="w-5 h-5 text-indigo-500" />,
      mockup: (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Trellis AI Guide</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              How does the Transactional Outbox pattern guarantee at-least-once message publishing in Kafka?
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Trellis Recommendation:
              </span>
              <p className="text-[11px] leading-relaxed">
                By writing state changes and event records into the same database transaction, dual-write inconsistencies are mathematically prevented.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'credential',
      badge: 'Verified Proof',
      title: 'Interactive 3D Credential Pass',
      shortDesc: 'Cryptographically verifiable competency credential pass with 3D parallax tilt and metallic EMV chip.',
      bulletPoints: [
        'Real-time mouse tilt with dynamic holographic foil reflection',
        'Directly linked to mastered milestone DAG proofs',
        'Exportable architect portfolio with verifiable competency geometry'
      ],
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      mockup: (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-950 text-white space-y-3 border border-emerald-400/30 shadow-lg">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-emerald-300">
              <span>TRELLIS ARCHITECT PASS</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-white font-bold">VERIFIED</span>
            </div>
            <div className="w-9 h-7 rounded bg-amber-400/80 border border-amber-200/50" />
            <div className="font-mono text-sm font-bold tracking-widest text-emerald-100">
              8829 •••• •••• 2026
            </div>
            <div className="flex justify-between text-[10px] font-mono text-emerald-200/80">
              <span>ELENA ROSTOVA</span>
              <span>EXP: 12/28</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const featuresList = features || defaultFeatures;

  // Auto-cycling timer logic
  useEffect(() => {
    if (isPaused) return;

    const intervalStep = 50; // ms
    const increment = (intervalStep / autoCycleDuration) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setActiveIndex(curr => (curr + 1) % featuresList.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoCycleDuration, featuresList.length]);

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  const activeFeature = featuresList[activeIndex];

  return (
    <div
      className={`features4-container ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{badgeText}</span>
        </div>
        <h2 className="font-literata text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          {heading}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {subheading}
        </p>
      </div>

      {/* Grid of Tabs (Left) and Content Showcase (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Tab Selector Buttons with Progress Bars */}
        <div className="lg:col-span-5 space-y-2.5">
          {featuresList.map((item, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(idx)}
                className={`feature-tab-btn ${isActive ? 'active' : ''}`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isActive ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-literata text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {item.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Animated timer progress bar for active tab */}
                {isActive && (
                  <motion.div
                    className="tab-timer-progress"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Animated Feature Details & Interactive Mockup */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  {activeFeature.badge}
                </span>
                <span className="text-xs text-slate-400">Auto-calibrating</span>
              </div>

              {/* Mockup Preview Area */}
              <div>{activeFeature.mockup}</div>

              {/* Bullet Points */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                {activeFeature.bulletPoints.map((point, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Features4;

