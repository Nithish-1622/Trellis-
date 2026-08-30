import React from 'react';
import { TrackNode } from '../types';
import {
  CheckCircle2,
  Brain,
  Lock,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Lightbulb,
  MoreHorizontal,
  Leaf,
  LockOpen
} from 'lucide-react';

interface TrellisVineProps {
  nodes: TrackNode[];
  viewMode: 'full' | 'week';
  onSelectNode: (node: TrackNode) => void;
  onOpenWhyThis: (node: TrackNode) => void;
  onFeedback: (nodeId: string, feedback: 'up' | 'down') => void;
}

export const TrellisVine: React.FC<TrellisVineProps> = ({
  nodes,
  viewMode,
  onSelectNode,
  onOpenWhyThis,
  onFeedback
}) => {
  const displayedNodes = viewMode === 'week' ? nodes.filter(n => (n.weekIndex || 1) <= 1) : nodes;

  return (
    <div className="relative w-full py-8 min-h-[850px]">
      {/* Background SVG Vine Paths */}
      <svg
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 800 1000"
      >
        <defs>
          <linearGradient id="vineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#003527" />
            <stop offset="35%" stopColor="#2b6954" />
            <stop offset="70%" stopColor="#95d3ba" />
            <stop offset="100%" stopColor="#c3c0ff" />
          </linearGradient>
          <filter id="vineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Full Vine Path */}
        <path
          className="path-line"
          d="M 400 30 C 420 120, 540 180, 520 280 C 500 380, 240 400, 260 520 C 280 640, 480 680, 420 820 C 380 920, 400 980, 400 1000"
          fill="none"
          stroke="#95d3ba"
          strokeLinecap="round"
          strokeWidth="4"
          strokeDasharray="4 6"
        />

        {/* Mastered / Active Solid Vine Section */}
        <path
          className="path-line"
          d="M 400 30 C 420 120, 540 180, 520 280 C 500 380, 240 400, 260 520"
          fill="none"
          stroke="#003527"
          strokeLinecap="round"
          strokeWidth="5"
          filter="url(#vineGlow)"
        />

        {/* Decorative Trellis Leaves along the vine */}
        <g transform="translate(480, 210) rotate(-25)">
          <path d="M0,0 Q12,-15 24,0 Q12,15 0,0" fill="#2b6954" opacity="0.8" />
        </g>
        <g transform="translate(340, 430) rotate(45)">
          <path d="M0,0 Q10,-12 20,0 Q10,12 0,0" fill="#52b788" opacity="0.6" />
        </g>
        <g transform="translate(300, 600) rotate(-15)">
          <path d="M0,0 Q10,-12 20,0 Q10,12 0,0" fill="#95d3ba" opacity="0.7" />
        </g>
      </svg>

      {/* Nodes Stack */}
      <div className="relative z-10 flex flex-col items-center gap-20 md:gap-24 w-full">
        {displayedNodes.map((node, index) => {
          if (node.status === 'mastered') {
            return (
              <div
                key={node.id}
                className="node-enter w-full max-w-md ml-auto md:mr-16 lg:mr-28 relative"
              >
                {/* Left Attachment Point Dot */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#003527] rounded-full border-4 border-[#f8f9ff] z-20 shadow-sm hidden md:block" />

                <div className="glass-card rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group border border-white/80">
                  {/* Status Badge & Actions */}
                  <div className="flex justify-between items-start mb-3.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#003527]/10 text-[#003527] px-2.5 py-1 rounded-md text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[#003527]" />
                      Mastered
                    </div>
                    <button
                      onClick={() => onSelectNode(node)}
                      className="text-[#bfc9c3] group-hover:text-[#003527] p-1 rounded hover:bg-gray-100/50 transition-colors"
                      title="Inspect node details"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  <h4
                    onClick={() => onSelectNode(node)}
                    className="font-literata text-2xl font-bold text-[#003527] mb-2 cursor-pointer hover:text-[#064e3b] transition-colors"
                  >
                    {node.title}
                  </h4>
                  <p className="text-sm text-[#404944] mb-4 leading-relaxed">
                    {node.description || node.shortDescription}
                  </p>

                  <div className="flex justify-between items-center pt-4 border-t border-[#bfc9c3]/20">
                    <button
                      onClick={() => onOpenWhyThis(node)}
                      className="bg-[#dce9ff]/60 hover:bg-[#dce9ff] text-[#0d1c2e] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-[#bfc9c3]/30 transition-colors shadow-2xs"
                    >
                      <Leaf className="w-3.5 h-3.5 text-[#003527] fill-[#003527]" />
                      Why this?
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onFeedback(node.id, 'up')}
                        title="Helpful milestone"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          node.feedback === 'up'
                            ? 'bg-[#003527] text-white'
                            : 'hover:bg-[#d5e3fc] text-[#707974] hover:text-[#003527]'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onFeedback(node.id, 'down')}
                        title="Not helpful"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          node.feedback === 'down'
                            ? 'bg-rose-600 text-white'
                            : 'hover:bg-[#d5e3fc] text-[#707974] hover:text-rose-600'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (node.status === 'current') {
            return (
              <div
                key={node.id}
                className="node-enter w-full max-w-md mr-auto md:ml-16 lg:ml-28 relative"
              >
                {/* Right Attachment Point Dot with pulse */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#003527] dark:[#52b788] rounded-full border-4 border-[#f8f9ff] z-20 pulse-ai hidden md:block" />

                <div className="glass-card rounded-xl p-6 ring-2 ring-[#003527] dark:ring-[#52b788]/30 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,53,39,0.14)] relative overflow-hidden bg-white/90">
                  {/* Active Indigo Stripe Accent */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#003527] dark:[#52b788]" />

                  {/* Status & Progress */}
                  <div className="flex justify-between items-start mb-3.5 pl-1">
                    <div className="inline-flex items-center gap-1.5 bg-[#003527] dark:[#52b788]/10 text-[#003527] dark:[#52b788] px-2.5 py-1 rounded-md text-xs font-semibold">
                      <Brain className="w-4 h-4 text-[#003527] dark:[#52b788] pulse-ai" />
                      Current Focus
                    </div>
                    <span className="text-xs font-bold font-mono text-[#003527] dark:[#52b788]">
                      {node.progress}%
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectNode(node)}
                    className="font-literata text-2xl font-bold text-[#0d1c2e] mb-2 pl-1 cursor-pointer hover:text-[#003527] dark:[#52b788] transition-colors"
                  >
                    {node.title}
                  </h4>
                  <p className="text-sm text-[#404944] mb-4 pl-1 leading-relaxed">
                    {node.description || node.shortDescription}
                  </p>

                  {/* Custom Progress Trellis */}
                  <div className="w-full h-2 bg-[#dce9ff] rounded-full mb-4 overflow-hidden flex">
                    <div
                      className="h-full bg-[#003527] dark:[#52b788] rounded-full transition-all duration-700"
                      style={{ width: `${node.progress}%` }}
                    />
                  </div>

                  {/* Recommendation Chip & Feedback */}
                  <div className="flex justify-between items-center pt-3.5 border-t border-[#bfc9c3]/20 pl-1">
                    <button
                      onClick={() => onOpenWhyThis(node)}
                      className="bg-[#dce9ff]/70 hover:bg-[#dce9ff] text-[#0d1c2e] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-[#bfc9c3]/30 transition-colors shadow-2xs"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-[#003527] dark:[#52b788]" />
                      Recommended based on your quiz
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onFeedback(node.id, 'up')}
                        title="Great recommendation"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          node.feedback === 'up'
                            ? 'bg-[#003527] dark:[#52b788] text-white'
                            : 'hover:bg-[#d5e3fc] text-[#707974] hover:text-[#003527] dark:[#52b788]'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onFeedback(node.id, 'down')}
                        title="Not relevant"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          node.feedback === 'down'
                            ? 'bg-rose-600 text-white'
                            : 'hover:bg-[#d5e3fc] text-[#707974] hover:text-rose-600'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA: Continue Learning */}
                  <button
                    onClick={() => onSelectNode(node)}
                    className="w-full mt-4 bg-white hover:bg-[#f8f9ff] text-[#003527] border border-[#bfc9c3]/50 hover:border-[#003527] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex justify-center items-center gap-2 shadow-sm group/btn"
                  >
                    <span>Continue Learning</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform text-[#003527]" />
                  </button>
                </div>
              </div>
            );
          }

          // Upcoming / Locked Node
          return (
            <div
              key={node.id}
              className="node-enter w-full max-w-md mx-auto relative opacity-85 group"
            >
              {/* Attachment Top Point */}
              <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-4 h-4 bg-[#bfc9c3] rounded-full border-4 border-[#f8f9ff] z-20 hidden md:block" />

              <div className="glass-card rounded-xl p-6 border-dashed border-[#bfc9c3]/60 relative transition-all duration-300 hover:border-[#003527]/60 hover:opacity-100">
                {/* Hover Preview Overlay */}
                <div className="absolute inset-0 bg-[#eff4ff]/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => onSelectNode(node)}
                    className="bg-white text-[#003527] px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-2 hover:bg-[#003527] hover:text-white transition-all border border-[#003527]/20"
                  >
                    <LockOpen className="w-4 h-4" />
                    Preview Milestone
                  </button>
                </div>

                <div className="flex justify-between items-start mb-3.5">
                  <div className="inline-flex items-center gap-1.5 bg-[#d5e3fc]/80 text-[#707974] px-2.5 py-1 rounded-md text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-[#707974]" />
                    Upcoming
                  </div>
                  {(node.requires || (node.prerequisites && (Array.isArray(node.prerequisites) ? node.prerequisites.length > 0 : Boolean(node.prerequisites)))) && (
                    <span className="text-[11px] font-mono text-[#707974] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#bfc9c3]/30">
                      Requires: {node.requires || (Array.isArray(node.prerequisites) ? node.prerequisites.join(', ') : String(node.prerequisites))}
                    </span>
                  )}
                </div>

                <h4 className="font-literata text-2xl font-bold text-[#707974] mb-2">
                  {node.title}
                </h4>
                <p className="text-sm text-[#707974]/90 mb-4 leading-relaxed">
                  {node.description || node.shortDescription}
                </p>

                <div className="flex justify-between items-center pt-4 border-t border-[#bfc9c3]/20">
                  <span className="text-xs text-[#707974] flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#707974]" />
                    Unlocks downstream resilience modules
                  </span>
                  <button
                    onClick={() => onOpenWhyThis(node)}
                    className="text-xs text-[#003527] dark:[#52b788] hover:underline font-semibold"
                  >
                    Why this?
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

