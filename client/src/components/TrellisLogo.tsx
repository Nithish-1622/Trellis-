import React from 'react';

interface TrellisLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
  onClick?: () => void;
}

export const TrellisLogo: React.FC<TrellisLogoProps> = ({
  size = 'md',
  showText = true,
  layout = 'horizontal',
  className = '',
  onClick
}) => {
  const iconDimensions = {
    sm: { w: 28, h: 28 },
    md: { w: 36, h: 36 },
    lg: { w: 48, h: 48 },
    xl: { w: 64, h: 64 },
    '2xl': { w: 96, h: 96 }
  }[size];

  const textClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl'
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex ${layout === 'vertical' ? 'flex-col items-center gap-2.5' : 'items-center gap-3'} select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
      } ${className}`}
    >
      <img
        src="/favicon.svg"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== window.location.origin + '/apple-touch-icon.png') {
            target.src = '/apple-touch-icon.png';
          }
        }}
        alt="Trellis"
        width={iconDimensions.w}
        height={iconDimensions.h}
        className="shrink-0 object-contain rounded-xl shadow-xs"
        style={{
          width: `${iconDimensions.w}px`,
          height: `${iconDimensions.h}px`
        }}
      />

      {showText && (
        <span
          className={`font-literata font-bold text-slate-800 dark:text-white tracking-tight ${textClasses}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          Trellis
        </span>
      )}
    </div>
  );
};

export default TrellisLogo;
