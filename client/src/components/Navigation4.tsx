'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import './Navigation4.css';

export interface Nav4ItemConfig {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

export interface Navigation4Props {
  items: Nav4ItemConfig[];
  baseItemSize?: number;
  magnification?: number;
  distance?: number;
  className?: string;
}

export const Navigation4: React.FC<Navigation4Props> = ({
  items,
  baseItemSize = 42,
  magnification = 58,
  distance = 120,
  className = ''
}) => {
  const mouseY = useMotionValue(Infinity);
  const springConfig = { mass: 0.1, stiffness: 220, damping: 15 };

  return (
    <aside
      className={`nav4-rail-container ${className}`}
      aria-label="Platform navigation rail"
    >
      <nav
        onMouseMove={e => mouseY.set(e.clientY)}
        onMouseLeave={() => mouseY.set(Infinity)}
        className="nav4-rail-panel"
      >
        {items.map((item, idx) => (
          <Nav4Button
            key={idx}
            item={item}
            mouseY={mouseY}
            baseItemSize={baseItemSize}
            magnification={magnification}
            distance={distance}
            springConfig={springConfig}
          />
        ))}
      </nav>
    </aside>
  );
};

function Nav4Button({
  item,
  mouseY,
  baseItemSize,
  magnification,
  distance,
  springConfig
}: {
  item: Nav4ItemConfig;
  mouseY: any;
  baseItemSize: number;
  magnification: number;
  distance: number;
  springConfig: any;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distanceCalc = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: baseItemSize };
    return val - bounds.y - bounds.height / 2;
  });

  const targetSize = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );

  const size = useSpring(targetSize, springConfig);

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        ref={ref}
        type="button"
        onClick={item.onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width: size, height: size }}
        className={`nav4-item ${item.isActive ? 'active' : ''}`}
        aria-label={item.label}
      >
        <div className="flex items-center justify-center pointer-events-none">
          {item.icon}
        </div>
      </motion.button>

      {/* Floating Side Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="nav4-tooltip"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Navigation4;

