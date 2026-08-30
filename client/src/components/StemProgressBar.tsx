import React from 'react';

interface StemProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  showLeaves?: boolean;
  label?: string;
  className?: string;
}

export const StemProgressBar: React.FC<StemProgressBarProps> = ({
  progress,
  height = 12,
  showLeaves = true,
  label,
  className = ''
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1 text-[#2d4a3e] dark:text-[#a7f3d0]">
          <span>{label}</span>
          <span className="font-mono">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div
        className="relative w-full rounded-full overflow-hidden bg-[#e5ece8] dark:bg-[#13281f] border border-[#bfc9c3]/40 dark:border-[#1e4d3a]/60 shadow-inner"
        style={{ height: `${height}px` }}
      >
        {/* Wood / Lattice subtle background texture */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4a3f2d_1px,transparent_1px)] [background-size:8px_8px]" />

        {/* Living Vine Stem Fill */}
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out relative flex items-center"
          style={{
            width: `${clampedProgress}%`,
            background: 'linear-gradient(90deg, #1b4332 0%, #2d6a4f 50%, #40916c 80%, #52b788 100%)'
          }}
        >
          {/* Stem Vein Highlight */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 bg-white/35 rounded-full" />

          {/* Growing Bud / Leaf Tip */}
          {clampedProgress > 5 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#f59e0b] shadow-md border-2 border-white dark:border-[#06110d] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75" />
            </div>
          )}
        </div>

        {/* Optional decorative unfurling leaves positioned along the stem */}
        {showLeaves && clampedProgress > 30 && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${Math.min(92, clampedProgress * 0.55)}%` }}
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3 text-[#52b788] -rotate-45 -translate-y-0.5">
              <path d="M0 8 C4 2, 12 2, 16 8 C12 14, 4 14, 0 8 Z" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
