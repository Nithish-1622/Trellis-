'use client';

import React, { useState } from 'react';
import './GooeyNav.css';

export interface GooeyNavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  initialActiveIndex?: number;
  activeIndex?: number;
  onSelectIndex?: (index: number) => void;
  className?: string;
}

export const GooeyNav: React.FC<GooeyNavProps> = ({
  items,
  initialActiveIndex = 0,
  activeIndex: controlledActiveIndex,
  onSelectIndex,
  className = ''
}) => {
  const [internalActiveIndex, setInternalActiveIndex] = useState(initialActiveIndex);
  const activeIndex = controlledActiveIndex !== undefined ? controlledActiveIndex : internalActiveIndex;

  const handleClick = (index: number) => {
    if (controlledActiveIndex === undefined) {
      setInternalActiveIndex(index);
    }
    onSelectIndex?.(index);
    items[index]?.onClick?.();
  };

  return (
    <div className={`gooey-nav-container ${className}`}>
      <nav>
        <ul>
          {items.map((item, index) => {
            const isActive = activeIndex === index;

            return (
              <li key={index} className={isActive ? 'active' : ''}>
                <button
                  type="button"
                  onClick={() => handleClick(index)}
                >
                  {item.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default GooeyNav;
