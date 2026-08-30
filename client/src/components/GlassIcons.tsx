'use client';

import React from 'react';
import './GlassIcons.css';

const gradientMapping: Record<string, string> = {
  blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
  purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
  red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
  indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
  orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
  green: 'linear-gradient(hsl(150, 90%, 40%), hsl(160, 90%, 35%))',
  emerald: 'linear-gradient(hsl(160, 84%, 39%), hsl(165, 80%, 30%))',
  teal: 'linear-gradient(hsl(180, 80%, 40%), hsl(195, 80%, 35%))'
};

export interface GlassIconItem {
  icon: React.ReactNode;
  color: string;
  label: string;
  customClass?: string;
  onClick?: () => void;
}

export interface GlassIconsProps {
  items: GlassIconItem[];
  className?: string;
}

export const GlassIcons: React.FC<GlassIconsProps> = ({ items, className }) => {
  const getBackgroundStyle = (color: string) => {
    if (gradientMapping[color]) {
      return { background: gradientMapping[color] };
    }
    return { background: color };
  };

  return (
    <div className={`icon-btns ${className || ''}`}>
      {items.map((item, index) => (
        <button
          key={index}
          className={`icon-btn ${item.customClass || ''}`}
          aria-label={item.label}
          type="button"
          onClick={item.onClick}
        >
          <span className="icon-btn__back" style={getBackgroundStyle(item.color)} />
          <span className="icon-btn__front">
            <span className="icon-btn__icon" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span className="icon-btn__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default GlassIcons;

