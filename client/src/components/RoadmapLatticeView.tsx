import React, { useState } from 'react';
import { RoadmapNode, NodeType, NodeStatus } from '../types';
import { StemProgressBar } from './StemProgressBar';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Lock,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  HelpCircle,
  Play,
  ArrowRight,
  GitFork,
  BookOpen,
  Cpu,
  Compass,
  Calendar,
  Eye,
  Flower2,
  TreeDeciduous,
  Leaf
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoadmapLatticeViewProps {
  nodes: RoadmapNode[];
  onSelectNode: (node: RoadmapNode) => void;
  onOpenWhyThis: (node: RoadmapNode) => void;
  onNodeFeedback: (nodeId: string, action: 'up' | 'down' | 'regen') => void;
  onSwitchBranch?: (forkNodeId: string, branchId: string) => void;
}

export const RoadmapLatticeView: React.FC<RoadmapLatticeViewProps> = ({
  nodes,
  onSelectNode,
  onOpenWhyThis,
  onNodeFeedback,
  onSwitchBranch
}) => {
  const [viewFilter, setViewFilter] = useState<'full' | 'this-week'>('full');
  const [activeForkBranch, setActiveForkBranch] = useState<string>('branch-event');
  const [regeneratingNodeId, setRegeneratingNodeId] = useState<string | null>(null);

  // Filter nodes for "This Week" (weekIndex === 1) vs "Full Path"
  const filteredNodes = viewFilter === 'this-week'
    ? nodes.filter(n => n.weekIndex === 1 || n.status === 'in-progress' || n.status === 'available')
    : nodes;

  // Calculate overall path metrics
  const doneNodes = nodes.filter(n => n.status === 'done').length;
  const overallProgress = Math.round((doneNodes / nodes.length) * 100);
  const totalWeeklyHours = nodes
    .filter(n => n.weekIndex === 1)
    .reduce((acc, curr) => acc + curr.estHours, 0);

  const handleFeedback = (nodeId: string, action: 'up' | 'down' | 'regen') => {
    if (action === 'regen') {
      setRegeneratingNodeId(nodeId);
      setTimeout(() => {
        setRegeneratingNodeId(null);
        onNodeFeedback(nodeId, action);
      }, 700);
    } else {
      onNodeFeedback(nodeId, action);
    }
  };

  const handleBloomCelebration = (node: RoadmapNode) => {
    if (node.status === 'done') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#059669', '#fbbf24']
      });
    }
    onSelectNode(node);
  };

  // Helper to render distinct badges per node type
  const renderNodeTypeIcon = (type: NodeType) => {
    switch (type) {
      case 'course':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Course Module</span>
          </span>
        );
      case 'project':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Hands-on Project</span>
          </span>
        );
      case 'checkpoint':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
            <Flower2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Mastery Checkpoint</span>
          </span>
        );
    }
  };

  const renderBotanicalStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case 'done':
        return (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
            <span>🌸</span>
            <span>Mastered</span>
          </div>
        );
      case 'in-progress':
        return (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pulse">
            <span>🍃</span>
            <span>In Progress</span>
          </div>
        );
      case 'available':
        return (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
            <span>🌱</span>
            <span>Up Next</span>
          </div>
        );
      case 'locked':
        return (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TreeDeciduous className="w-3.5 h-3.5" />
              <span>Personalized Learning Roadmap</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              {doneNodes} of {nodes.length} Completed
            </span>
          </div>
          <h1 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Architecture Milestone Lattice
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Adaptive progression path tailored to your radar assessment. Nodes unlock dynamically as prerequisites are mastered.
          </p>
        </div>

        {/* View Toggle Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Budget: {totalWeeklyHours} hrs this week</span>
          </div>

          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewFilter('full')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewFilter === 'full'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Full Path
            </button>
            <button
              onClick={() => setViewFilter('this-week')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewFilter === 'this-week'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              This Week
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <StemProgressBar
          progress={overallProgress}
          label="Overall Roadmap Trajectory Mastery"
          height={12}
        />
      </div>

      {/* ── The Nodes Lattice Tree View ── */}
      <div className="relative">
        
        {/* Central Vertical Stem connecting nodes */}
        <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-1 -translate-x-1/2 pointer-events-none z-0">
          <svg className="w-16 h-full -ml-8 overflow-visible" preserveAspectRatio="none">
            <path
              d="M 32 0 Q 20 150 44 300 T 24 600 T 40 900 T 32 1200"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="4"
            />
            <path
              d="M 32 0 Q 20 150 44 300 T 24 600 T 40 900 T 32 1200"
              fill="none"
              stroke="currentColor"
              className="text-emerald-500/60 dark:text-emerald-400/50"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Nodes Grid Layout */}
        <div className="space-y-8 relative z-10">
          {filteredNodes.map((node, index) => {
            const isLeft = index % 2 === 0;
            const isLocked = node.status === 'locked';
            const isFork = node.isForkPoint;
            const isRegenerating = regeneratingNodeId === node.id;

            return (
              <div
                key={node.id}
                className={`flex flex-col md:flex-row items-center gap-6 ${
                  isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Node Card Box */}
                <div
                  className={`w-full md:w-[calc(50%-2rem)] p-6 rounded-3xl border transition-all duration-200 relative ${
                    node.status === 'done'
                      ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800/80 shadow-md ring-1 ring-amber-400/20'
                      : node.status === 'in-progress'
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                      : node.status === 'available'
                      ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-md hover:border-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-70'
                  }`}
                >
                  {/* Header Row: Type Icon & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {renderNodeTypeIcon(node.type)}
                    {renderBotanicalStatusBadge(node.status)}
                  </div>

                  {/* Node Title & Description */}
                  <h3 className="font-literata text-lg font-bold text-slate-900 dark:text-white leading-snug mb-1.5">
                    {node.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {node.shortDescription}
                  </p>

                  {/* Fork Specialization Selector */}
                  {isFork && node.forkOptions && (
                    <div className="mb-4 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <GitFork className="w-3.5 h-3.5 text-amber-500" />
                        <span>Specialization Branch:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {node.forkOptions.map(opt => {
                          const isBranchSelected = activeForkBranch === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setActiveForkBranch(opt.id);
                                if (onSwitchBranch) onSwitchBranch(node.id, opt.id);
                              }}
                              className={`p-2.5 rounded-xl text-left text-xs transition-all flex flex-col cursor-pointer ${
                                isBranchSelected
                                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{opt.name}</span>
                              <span className="text-[10px] opacity-75 font-normal">{opt.tag}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {!isLocked && (
                    <div className="mb-4">
                      <StemProgressBar
                        progress={node.progress}
                        height={7}
                        showLeaves={false}
                        label="Module Progress"
                      />
                    </div>
                  )}

                  {/* Footer Action & Feedback */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handleBloomCelebration(node)}
                      disabled={isLocked}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        isLocked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : node.status === 'done'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                          : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 shadow-xs'
                      }`}
                    >
                      {node.status === 'done' ? (
                        <>
                          <span>Review Module</span>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </>
                      ) : node.status === 'in-progress' ? (
                        <>
                          <span>Continue Module</span>
                          <Play className="w-3.5 h-3.5" />
                        </>
                      ) : isLocked ? (
                        <>
                          <span>Locked</span>
                          <Lock className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Start Learning</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenWhyThis(node)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="View AI recommendation rationale"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Why this?</span>
                      </button>

                      <button
                        onClick={() => handleFeedback(node.id, 'up')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          node.feedback === 'up'
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Prioritize similar modules"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleFeedback(node.id, 'down')}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          node.feedback === 'down'
                            ? 'bg-rose-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="De-emphasize this topic"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleFeedback(node.id, 'regen')}
                        disabled={isRegenerating}
                        className={`p-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all cursor-pointer ${
                          isRegenerating ? 'animate-spin' : ''
                        }`}
                        title="Regenerate this step using AI"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isRegenerating && (
                    <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Recalibrating node with Trellis AI...</span>
                    </div>
                  )}
                </div>

                {/* Center Node Marker (Desktop) */}
                <div className="hidden md:flex items-center justify-center w-11 h-11 rounded-full border-4 border-white dark:border-slate-950 shadow-md z-20">
                  {node.status === 'done' ? (
                    <div className="w-full h-full rounded-full bg-amber-500 flex items-center justify-center text-white text-base">
                      🌸
                    </div>
                  ) : node.status === 'in-progress' ? (
                    <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-white text-base animate-pulse">
                      🍃
                    </div>
                  ) : node.status === 'available' ? (
                    <div className="w-full h-full rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm">
                      🌱
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
                      🔒
                    </div>
                  )}
                </div>

                {/* Empty opposite side spacer to maintain grid balance */}
                <div className="hidden md:block w-[calc(50%-2rem)]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
