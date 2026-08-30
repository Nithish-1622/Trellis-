'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Quote,
  Star,
  CheckCircle2,
  Sparkles,
  Building,
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import './SocialProof15.css';

export interface TestimonialStory {
  id: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  headline: string;
  quote: string;
  metric: string;
  metricLabel: string;
  verifiedDomain: string;
}

export interface SocialProof15Props {
  badgeText?: string;
  heading?: string;
  subheading?: string;
  autoRotateDuration?: number;
  stories?: TestimonialStory[];
  className?: string;
}

export const SocialProof15: React.FC<SocialProof15Props> = ({
  badgeText = 'Verified Engineering Stories',
  heading = 'Trusted by Staff & Principal Systems Architects',
  subheading = 'Discover how leading engineers use Trellis to calibrate skill gaps and master high-throughput distributed systems.',
  autoRotateDuration = 6000,
  stories,
  className = ''
}) => {
  const defaultStories: TestimonialStory[] = [
    {
      id: 'marcus',
      author: 'Marcus Vance',
      role: 'Principal Systems Architect',
      company: 'ScaleMesh Inc.',
      avatar: '/avatars/Artboards_Diversity_Avatars_by_Netguru-01.svg',
      headline: 'Cut our multi-region database sharding research time by 60%',
      quote: 'Traditional linear courses felt slow and generic. Trellis immediately identified my exact gap in distributed consensus (Raft) and generated a custom 3-milestone DAG with hands-on labs. The adaptive pruning saved me hundreds of hours.',
      metric: '60% Faster',
      metricLabel: 'Mastery Velocity',
      verifiedDomain: 'Distributed Systems'
    },
    {
      id: 'priya',
      author: 'Priya Sharma',
      role: 'Staff Infrastructure Engineer',
      company: 'CloudVector Labs',
      avatar: '/avatars/Artboards_Diversity_Avatars_by_Netguru-12.svg',
      headline: 'The 6-axis skill radar gave me clear promotion evidence',
      quote: 'Trellis replaced ambiguous engineering rubrics with clean competency geometry. As I mastered event sagas and outbox patterns, my verified radar expanded in real-time. I used the exportable pass in my promotion review to Staff Engineer.',
      metric: 'Staff Promoted',
      metricLabel: 'Career Milestone',
      verifiedDomain: 'Software Architecture & DDD'
    },
    {
      id: 'david',
      author: 'David Chen',
      role: 'Head of Cloud Security',
      company: 'Aegis Security',
      avatar: '/avatars/Artboards_Diversity_Avatars_by_Netguru-24.svg',
      headline: 'The AI guide provides deep RFC trade-offs, not shallow summaries',
      quote: 'Whenever we debated Istio mTLS vs SPIFFE/SPIRE for our zero-trust mesh, the Trellis AI guide walked through operational latency, failure domains, and cryptographic rotation step-by-step. Unmatched depth for architects.',
      metric: 'Zero-Trust Mesh',
      metricLabel: 'Enterprise Implementation',
      verifiedDomain: 'Security & Zero-Trust'
    },
    {
      id: 'sarah',
      author: 'Sarah Jenkins',
      role: 'Lead Data Platform Architect',
      company: 'FinPulse Systems',
      avatar: '/avatars/Artboards_Diversity_Avatars_by_Netguru-37.svg',
      headline: 'Organic milestone pruning prevented burnout and duplicated study',
      quote: 'Because Trellis inferred my Kafka and Redis background from my initial calibration, it completely skipped basic queueing and focused straight on Debezium CDC and transactional outbox. Highly recommended.',
      metric: '18 Prerequisites',
      metricLabel: 'Smart-Skipped via Inference',
      verifiedDomain: 'Data Engineering'
    }
  ];

  const storiesList = stories || defaultStories;
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Timed progress bar and rotation
  useEffect(() => {
    if (isPaused) return;

    const intervalStep = 50;
    const increment = (intervalStep / autoRotateDuration) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setActiveIndex(curr => (curr + 1) % storiesList.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoRotateDuration, storiesList.length]);

  const handleSelectStory = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  const activeStory = storiesList[activeIndex];

  return (
    <div
      className={`socialproof15-container ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-2 max-w-xl">
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

        {/* Global Rating Chip */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-4 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="block text-emerald-600 dark:text-emerald-400">4.9/5 Rating</span>
            <span className="text-[11px] font-normal text-slate-500">From 14,000+ engineers</span>
          </div>
        </div>
      </div>

      {/* Main Content: Spotlight Story (Left) + Author Rail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Spotlight Story with Crossfade */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStory.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-6"
            >
              {/* Highlight Metric Pill */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{activeStory.metric} • {activeStory.metricLabel}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  {activeStory.verifiedDomain}
                </span>
              </div>

              {/* Story Headline & Quote */}
              <div className="space-y-3">
                <h3 className="font-literata text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  "{activeStory.headline}"
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{activeStory.quote}"
                </p>
              </div>

              {/* Author Attribution */}
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <img
                  src={activeStory.avatar}
                  alt={activeStory.author}
                  className="w-12 h-12 rounded-full border-2 border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>{activeStory.author}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeStory.role} • <strong>{activeStory.company}</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Author Rail with Timed Progress Indicator */}
        <div className="lg:col-span-5 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-2 mb-1">
            Featured Engineering Leads:
          </span>
          {storiesList.map((story, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => handleSelectStory(idx)}
                className={`author-rail-btn ${isActive ? 'active' : ''}`}
              >
                <img
                  src={story.avatar}
                  alt={story.author}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {story.author}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {story.metric}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {story.role} • {story.company}
                  </p>
                </div>

                {/* Progress bar on active author button */}
                {isActive && (
                  <motion.div
                    className="author-progress-line"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SocialProof15;

