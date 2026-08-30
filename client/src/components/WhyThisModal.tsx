import React from 'react';
import { RoadmapNode } from '../types';
import { X, Sparkles, Target, Zap, ShieldCheck, ThumbsUp, ThumbsDown, Layers } from 'lucide-react';

interface WhyThisModalProps {
  node: RoadmapNode;
  onClose: () => void;
  onFeedback: (nodeId: string, feedback: 'up' | 'down') => void;
}

export const WhyThisModal: React.FC<WhyThisModalProps> = ({
  node,
  onClose,
  onFeedback
}) => {
  const detail = node?.whyThisDetail || {
    scoreGap: '+15% Core Competency Gap',
    rationale: node?.whyThis || 'Sequenced based on your skill radar profile to accelerate mastery of prerequisite systems patterns.',
    targetImpact: 'Unlocks downstream architecture modules and system design labs.',
    keySkill: 'System Design, Architecture Patterns & Resilience',
    predictedSpeedup: 'Saves 4-6 hours in downstream learning'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-emerald-50/50 dark:bg-emerald-950/30 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                AI Recommendation Rationale
              </span>
              <h3 className="font-literata text-lg font-bold text-slate-900 dark:text-white">
                Why "{node.title}"?
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Personalized Diagnostic Analysis</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {detail.rationale}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Skill Gap Addressed
              </span>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{detail.scoreGap}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Target Profile Impact
              </span>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{detail.targetImpact}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Key Mastery Competency
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{detail.keySkill}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Velocity Multiplier
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{detail.predictedSpeedup}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Is this recommendation relevant to your goals?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFeedback(node.id, 'up')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                node.feedback === 'up'
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Helpful</span>
            </button>
            <button
              onClick={() => onFeedback(node.id, 'down')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                node.feedback === 'down'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Not Relevant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
