import React from 'react';

interface SproutLoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SproutLoader: React.FC<SproutLoaderProps> = ({
  label = 'Cultivating your learning path...',
  size = 'md'
}) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div className={`relative ${dimensions[size]} flex items-center justify-center`}>
        {/* Lattice frame background circle */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#52b788]/40 animate-spin [animation-duration:8s]" />

        {/* Growing Sprout SVG Animation */}
        <svg viewBox="0 0 100 100" className="w-full h-full text-[#1b4332] dark:text-[#52b788]">
          {/* Soil Mound */}
          <path
            d="M20 85 Q50 78 80 85"
            stroke="#8b5e34"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Stem Drawing */}
          <path
            d="M50 82 Q48 55 52 35"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            className="path-line"
          />

          {/* Left Leaf Unfurling */}
          <g className="animate-in fade-in zoom-in duration-700 delay-300">
            <path
              d="M50 50 C38 46 28 32 34 22 C46 26 50 42 50 50 Z"
              fill="#2d6a4f"
              stroke="#52b788"
              strokeWidth="1.5"
            />
          </g>

          {/* Right Leaf Unfurling */}
          <g className="animate-in fade-in zoom-in duration-700 delay-500">
            <path
              d="M51 40 C63 36 74 22 68 12 C56 16 51 32 51 40 Z"
              fill="#52b788"
              stroke="#a7f3d0"
              strokeWidth="1.5"
            />
          </g>

          {/* Golden Sprout Bud Top */}
          <circle cx="52" cy="28" r="4" fill="#f59e0b" className="animate-pulse" />
        </svg>
      </div>
      {label && (
        <p className="text-xs font-semibold text-[#003527] dark:text-[#a7f3d0] animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};
