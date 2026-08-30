import React, { useState } from 'react';

interface SkillValues {
  programming?: number;
  dataMath?: number;
  design?: number;
  communication?: number;
  leadership?: number;
  research?: number;
  systems?: number;
  data?: number;
  logic?: number;
  ux?: number;
  agile?: number;
  [key: string]: number | undefined;
}

interface SkillRadarSvgProps {
  currentSkills?: SkillValues;
  targetSkills?: SkillValues;
  current?: SkillValues;
  target?: SkillValues;
  size?: number;
  showLegend?: boolean;
}

const DEFAULT_CURRENT: SkillValues = {
  programming: 75,
  dataMath: 62,
  design: 70,
  communication: 82,
  leadership: 68,
  research: 58
};

const DEFAULT_TARGET: SkillValues = {
  programming: 90,
  dataMath: 85,
  design: 80,
  communication: 85,
  leadership: 80,
  research: 75
};

export const SkillRadarSvg: React.FC<SkillRadarSvgProps> = ({
  currentSkills,
  targetSkills,
  current,
  target,
  size = 300,
  showLegend = false
}) => {
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);

  const cur = currentSkills || current || DEFAULT_CURRENT;
  const tgt = targetSkills || target || DEFAULT_TARGET;

  const axes: { key: string; label: string; icon: string }[] = [
    { key: 'programming', label: 'Programming', icon: '💻' },
    { key: 'dataMath', label: 'Data & Math', icon: '📐' },
    { key: 'design', label: 'Design', icon: '🎨' },
    { key: 'communication', label: 'Communication', icon: '💬' },
    { key: 'leadership', label: 'Leadership', icon: '👑' },
    { key: 'research', label: 'Research', icon: '🔬' }
  ];

  const totalAxes = axes.length;
  const center = size / 2;
  const radius = size * 0.36;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const clampedValue = Math.max(10, Math.min(100, value));
    const dist = (clampedValue / 100) * radius;
    return {
      x: center + dist * Math.cos(angle),
      y: center + dist * Math.sin(angle)
    };
  };

  const getAxisEnd = (index: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const dist = radius + 24;
    return {
      x: center + dist * Math.cos(angle),
      y: center + dist * Math.sin(angle)
    };
  };

  const buildPolygonString = (skillsObj: SkillValues) => {
    return axes
      .map((axis, i) => {
        const val = skillsObj[axis.key] ?? 60;
        const coords = getCoordinates(i, val);
        return `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
      })
      .join(' ');
  };

  const currentPoints = buildPolygonString(cur);
  const targetPoints = buildPolygonString(tgt);

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background Concentric Webs */}
        {gridLevels.map((lvl, lIdx) => {
          const points = axes
            .map((_, i) => {
              const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
              const dist = radius * lvl;
              return `${(center + dist * Math.cos(angle)).toFixed(1)},${(center + dist * Math.sin(angle)).toFixed(1)}`;
            })
            .join(' ');

          return (
            <polygon
              key={`grid-${lIdx}`}
              points={points}
              fill="none"
              stroke="currentColor"
              className="text-gray-200 dark:text-[#1e4d3a]/60"
              strokeWidth={lvl === 1.0 ? '1.5' : '0.8'}
              strokeDasharray={lvl === 1.0 ? 'none' : '3,3'}
            />
          );
        })}

        {/* Axis Spokes */}
        {axes.map((_, idx) => {
          const end = getAxisEnd(idx);
          return (
            <line
              key={`spoke-${idx}`}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="currentColor"
              className="text-gray-200 dark:text-[#1e4d3a]/60"
              strokeWidth="1"
            />
          );
        })}

        {/* Target Benchmark Profile Polygon */}
        <polygon
          points={targetPoints}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.8"
          strokeDasharray="4,3"
          className="transition-all duration-300 opacity-80"
        />

        {/* Current Skills Polygon */}
        <polygon
          points={currentPoints}
          fill="#52b788"
          fillOpacity="0.25"
          stroke="#2d6a4f"
          strokeWidth="2.2"
          className="transition-all duration-300"
        />

        {/* Target Dots */}
        {axes.map((axis, i) => {
          const val = tgt[axis.key] ?? 75;
          const coords = getCoordinates(i, val);
          return (
            <circle
              key={`tgt-dot-${i}`}
              cx={coords.x}
              cy={coords.y}
              r={3}
              fill="#f59e0b"
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}

        {/* Current Dots */}
        {axes.map((axis, i) => {
          const val = cur[axis.key] ?? 60;
          const coords = getCoordinates(i, val);
          const isHovered = hoveredAxis === axis.key;
          return (
            <circle
              key={`cur-dot-${i}`}
              cx={coords.x}
              cy={coords.y}
              r={isHovered ? 5.5 : 4}
              fill="#003527"
              stroke="#52b788"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredAxis(axis.key)}
              onMouseLeave={() => setHoveredAxis(null)}
            />
          );
        })}

        {/* Labels & Icons */}
        {axes.map((axis, i) => {
          const coords = getLabelCoordinates(i);
          const isHovered = hoveredAxis === axis.key;
          return (
            <g
              key={`lbl-${axis.key}`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredAxis(axis.key)}
              onMouseLeave={() => setHoveredAxis(null)}
            >
              <text
                x={coords.x}
                y={coords.y - 2}
                textAnchor="middle"
                fontSize="11"
                className={`font-literata font-bold transition-all ${
                  isHovered
                    ? 'fill-[#003527] dark:fill-[#a7f3d0] font-black scale-105'
                    : 'fill-gray-600 dark:fill-gray-300'
                }`}
              >
                {axis.label}
              </text>
              <text
                x={coords.x}
                y={coords.y + 11}
                textAnchor="middle"
                fontSize="9"
                className="fill-gray-400 dark:fill-gray-500 font-mono"
              >
                {cur[axis.key] ?? 50}%
              </text>
            </g>
          );
        })}
      </svg>

      {showLegend && (
        <div className="flex items-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#52b788]" />
            <span className="text-gray-700 dark:text-gray-300 font-semibold">Your Mastery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-[#f59e0b]" />
            <span className="text-gray-700 dark:text-gray-300 font-semibold">Target Profile</span>
          </div>
        </div>
      )}
    </div>
  );
};
