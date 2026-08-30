'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  BookOpen,
  Clock,
  Award,
  ArrowRight,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Code,
  Layers,
  GraduationCap
} from 'lucide-react';
import { ResourceItem } from '../types';
import './ModalCards.css';

export interface ModalCardsProps {
  resources: ResourceItem[];
  onToggleBookmark?: (id: string) => void;
  onFeedback?: (id: string, action: 'up' | 'down' | 'regen') => void;
  className?: string;
}

export const ModalCards: React.FC<ModalCardsProps> = ({
  resources,
  onToggleBookmark,
  onFeedback,
  className = ''
}) => {
  const [selectedItem, setSelectedItem] = useState<ResourceItem | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when expanded
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  return (
    <div className={`w-full ${className}`}>
      {/* Cards Grid */}
      <div className="modal-cards-grid">
        {resources.map(item => (
          <motion.div
            layoutId={`card-container-${item.id}`}
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="modal-card-item p-6 space-y-4"
            tabIndex={0}
            role="button"
            aria-haspopup="dialog"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedItem(item);
              }
            }}
          >
            <div className="space-y-3">
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <motion.span
                  layoutId={`card-type-${item.id}`}
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {item.type} • {item.level}
                </motion.span>
                <span className="text-xs font-mono font-bold text-amber-500">
                  {item.matchScore}% Match
                </span>
              </div>

              {/* Title */}
              <motion.h3
                layoutId={`card-title-${item.id}`}
                className="font-literata text-base font-bold text-slate-900 dark:text-white leading-snug"
              >
                {item.title}
              </motion.h3>

              {/* Provider & Duration */}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                By {item.provider} • {item.duration}
              </p>

              {/* Short Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* AI Recommendation Reason */}
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{item.whyThis}</span>
            </div>

            {/* Card Footer: Click to Expand CTA */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <span>View Full Syllabus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click to Expand</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expandable Modal Portal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="modal-cards-backdrop" onClick={() => setSelectedItem(null)}>
            <motion.div
              layoutId={`card-container-${selectedItem.id}`}
              className="modal-cards-expanded p-6 sm:p-8 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <motion.span
                      layoutId={`card-type-${selectedItem.id}`}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      {selectedItem.type} • {selectedItem.level}
                    </motion.span>
                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      {selectedItem.matchScore}% Relevance Match
                    </span>
                  </div>

                  <motion.h2
                    layoutId={`card-title-${selectedItem.id}`}
                    className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white"
                  >
                    {selectedItem.title}
                  </motion.h2>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Instructed by <strong>{selectedItem.provider}</strong> • Estimated Time: <strong>{selectedItem.duration}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Relevance Highlight */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Why This Matches Your Learning Path</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  {selectedItem.whyThis}
                </p>
              </div>

              {/* Course Overview & Syllabus */}
              <div className="space-y-4">
                <h4 className="font-literata text-base font-bold text-slate-900 dark:text-white">
                  Curriculum Overview & Hands-on Modules
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedItem.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Target Mastery Level
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedItem.level} Architect</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Time Commitment
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedItem.duration}</p>
                  </div>
                </div>
              </div>

              {/* Interactive Key Takeaways */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Key Architectural Competencies:
                </span>
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time bounded context isolation and schema separation patterns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Idempotent webhook delivery with exponential backoff and dead-letter queues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Resilient distributed state machines with compensating rollback sagas</span>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onFeedback?.(selectedItem.id, 'up')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedItem.feedback === 'up'
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Relevant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onFeedback?.(selectedItem.id, 'down')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedItem.feedback === 'down'
                        ? 'bg-rose-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Not Relevant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark?.(selectedItem.id)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      selectedItem.bookmarked
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{selectedItem.bookmarked ? 'Saved to Profile' : 'Save Course'}</span>
                  </button>
                </div>

                <a
                  href={selectedItem.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Course Lab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModalCards;

