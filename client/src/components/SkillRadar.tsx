import React, { useState } from 'react';
import { SkillScores } from '../types';
import { Sparkles, RefreshCw, Info } from 'lucide-react';

interface SkillRadarProps {
  currentScores: SkillScores;
  targetScores: SkillScores;
  onOpenDiagnostic?: () => void;
}

type CoreAxis = 'logic' | 'data' | 'systems' | 'ux' | 'agile';

const AXIS_CONFIG: { key: CoreAxis; label: string; x: number; y: number; textAnchor: 'middle' | 'start' | 'end' }[] = [
  { key: 'logic', label: 'Logic', x: 50, y: 7, textAnchor: 'middle' },
  { key: 'data', label: 'Data', x: 94, y: 42, textAnchor: 'middle' },
  { key: 'systems', label: 'Systems', x: 78, y: 96, textAnchor: 'middle' },
  { key: 'ux', label: 'UX', x: 22, y: 96, textAnchor: 'middle' },
  { key: 'agile', label: 'Agile', x: 6, y: 42, textAnchor: 'middle' }
];

// Angles in radians for the 5-point radar: 0 at top (Logic), 72 deg steps
const ANGLES = [
  -Math.PI / 2, // Top (Logic)
  -Math.PI / 2 + (2 * Math.PI) / 5, // Top Right (Data)
  -Math.PI / 2 + (4 * Math.PI) / 5, // Bottom Right (Systems)
  -Math.PI / 2 + (6 * Math.PI) / 5, // Bottom Left (UX)
  -Math.PI / 2 + (8 * Math.PI) / 5  // Top Left (Agile)
];

const CENTER = { x: 50, y: 50 };
const MAX_RADIUS = 38;

function getPoint(score: number, index: number) {
  const norm = Math.min(100, Math.max(10, score)) / 100;
  const r = norm * MAX_RADIUS;
  const angle = ANGLES[index];
  return {
    x: CENTER.x + r * Math.cos(angle),
    y: CENTER.y + r * Math.sin(angle)
  };
}

function buildPolygonPoints(scores: SkillScores): string {
  const keys: CoreAxis[] = ['logic', 'data', 'systems', 'ux', 'agile'];
  return keys
    .map((k, i) => {
      const pt = getPoint(scores[k] ?? 50, i);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');
}

export const SkillRadar: React.FC<SkillRadarProps> = ({
  currentScores,
  targetScores,
  onOpenDiagnostic
}) => {
  const [hoveredAxis, setHoveredAxis] = useState<CoreAxis | null>(null);

  const targetPoints = buildPolygonPoints(targetScores);
  const currentPoints = buildPolygonPoints(currentScores);

  return (
    <div className="bg-white/80 dark:bg-[#0c1e16]/80 rounded-2xl p-5 border border-[#bfc9c3]/40 dark:border-[#1e4d3a]/60 shadow-sm backdrop-blur-xs">
      {/* Radar Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#003527] dark:bg-[#52b788]" />
          <h3 className="font-literata font-bold text-base text-[#003527] dark:text-white">
            Skill Radar
          </h3>
        </div>

        {onOpenDiagnostic && (
          <button
            onClick={onOpenDiagnostic}
            className="text-xs text-[#003527] dark:text-[#52b788] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Diagnostic</span>
          </button>
        )}
      </div>

      <p className="text-xs text-[#404944] dark:text-gray-400 mb-4 leading-relaxed">
        Visualizing real-time competency gaps against your benchmark architecture profile.
      </p>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-square max-w-[260px] mx-auto select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Concentric Guide Pentagons */}
          {[0.25, 0.5, 0.75, 1.0].map((level, lIdx) => {
            const levelPoints = ANGLES.map(angle => {
              const r = level * MAX_RADIUS;
              return `${(CENTER.x + r * Math.cos(angle)).toFixed(1)},${(CENTER.y + r * Math.sin(angle)).toFixed(1)}`;
            }).join(' ');

            return (
              <polygon
                key={lIdx}
                points={levelPoints}
                fill="none"
                stroke="currentColor"
                className="text-[#bfc9c3]/50 dark:text-[#1e4d3a]/60"
                strokeWidth="0.5"
                strokeDasharray={level === 1.0 ? 'none' : '1,1'}
              />
            );
          })}

          {/* Radial Axis Lines */}
          {ANGLES.map((angle, idx) => {
            const x2 = CENTER.x + MAX_RADIUS * Math.cos(angle);
            const y2 = CENTER.y + MAX_RADIUS * Math.sin(angle);
            return (
              <line
                key={idx}
                x1={CENTER.x}
                y1={CENTER.y}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                className="text-[#bfc9c3]/50 dark:text-[#1e4d3a]/60"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Target Profile Polygon (Dashed outline) */}
          <polygon
            points={targetPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="2,1.5"
            className="transition-all duration-500 opacity-80"
          />

          {/* Current Mastery Polygon (Organic Emerald fill) */}
          <polygon
            points={currentPoints}
            fill="#52b788"
            fillOpacity="0.25"
            stroke="#003527"
            strokeWidth="1.6"
            className="transition-all duration-500"
          />

          {/* Interactive Vertex Dots */}
          {(['logic', 'data', 'systems', 'ux', 'agile'] as CoreAxis[]).map((k, i) => {
            const curPt = getPoint(currentScores[k] ?? 50, i);
            const tgtPt = getPoint(targetScores[k] ?? 70, i);
            const isHovered = hoveredAxis === k;

            return (
              <g key={String(k)}>
                {/* Target marker */}
                <circle
                  cx={tgtPt.x}
                  cy={tgtPt.y}
                  r={isHovered ? 3.5 : 2.5}
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth="1"
                  className="transition-all duration-200"
                />
                {/* Current marker */}
                <circle
                  cx={curPt.x}
                  cy={curPt.y}
                  r={isHovered ? 4 : 3}
                  fill="#003527"
                  stroke="#fff"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredAxis(k)}
                  onMouseLeave={() => setHoveredAxis(null)}
                />
              </g>
            );
          })}

          {/* Axis Text Labels */}
          {AXIS_CONFIG.map(({ key, label, x, y, textAnchor }) => {
            const isHovered = hoveredAxis === key;
            return (
              <text
                key={String(key)}
                x={x}
                y={y}
                textAnchor={textAnchor}
                fontSize={isHovered ? '4.5' : '3.8'}
                fontWeight={isHovered ? '700' : '600'}
                fill={isHovered ? '#003527' : '#707974'}
                className="cursor-pointer transition-all duration-150 select-none"
                onMouseEnter={() => setHoveredAxis(key)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend & Breakdown */}
      <div className="mt-5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-[#f59e0b]" />
            <span className="font-semibold text-gray-600 dark:text-gray-300">Target Benchmark</span>
          </div>
          <span className="text-gray-500 font-mono">Avg: 80%</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#52b788]" />
            <span className="font-semibold text-gray-600 dark:text-gray-300">Current Assessment</span>
          </div>
          <span className="text-[#003527] dark:text-[#a7f3d0] font-mono font-bold">Avg: 55%</span>
        </div>
      </div>

      {/* Hovered Axis Details or Quick Insight */}
      <div className="mt-4 pt-4 border-t border-[#bfc9c3]/30 dark:border-[#1e4d3a]/60">
        {hoveredAxis ? (
          <div className="bg-white/80 dark:bg-[#13281f]/60 p-2.5 rounded-xl border border-gray-200 dark:border-[#1e4d3a] text-xs animate-in fade-in duration-200">
            <div className="flex justify-between items-center font-bold text-[#003527] dark:text-[#a7f3d0] capitalize mb-1">
              <span>{hoveredAxis} Dimension</span>
              <span className="text-amber-600 dark:text-amber-400">
                {currentScores[hoveredAxis]}% / {targetScores[hoveredAxis]}%
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#07130e] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#003527] dark:bg-[#52b788] h-full rounded-full transition-all"
                style={{ width: `${currentScores[hoveredAxis]}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-3.5 h-3.5 shrink-0 text-[#003527] dark:text-[#52b788]" />
            <span>Hover on axes to view specific competency gaps</span>
          </div>
        )}
      </div>
    </div>
  );
};
