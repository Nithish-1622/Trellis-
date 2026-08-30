'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Wifi, Sparkles, ShieldCheck, Award } from 'lucide-react';
import './CreditCard.css';

export interface CreditCardProps {
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  issuer?: string;
  theme?: 'emerald' | 'obsidian' | 'gold' | 'violet';
  trackTitle?: string;
  levelBadge?: string;
  className?: string;
  onClick?: () => void;
}

export const CreditCard: React.FC<CreditCardProps> = ({
  cardNumber = '8829 •••• •••• 2026',
  cardHolder = 'ELENA ROSTOVA',
  expiryDate = '12/28',
  issuer = 'TRELLIS ARCHITECT PASS',
  theme = 'emerald',
  trackTitle = 'Senior Staff Systems Architect',
  levelBadge = 'VERIFIED CREDENTIAL',
  className = '',
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coordinate motion values (-0.5 to 0.5 range)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for 3D rotation
  const springConfig = { damping: 20, stiffness: 260, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [16, -16]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), springConfig);
  const scale = useSpring(isHovered ? 1.04 : 1, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);

    // Update CSS custom properties for glare and shimmer
    const glareX = ((e.clientX - rect.left) / rect.width) * 100;
    const glareY = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--glare-x', `${glareX}%`);
    cardRef.current.style.setProperty('--glare-y', `${glareY}%`);
    cardRef.current.style.setProperty('--shimmer-x', `${x * 40}%`);
    cardRef.current.style.setProperty('--shimmer-y', `${y * 40}%`);
    cardRef.current.style.setProperty('--glare-opacity', '1');
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    if (cardRef.current) {
      cardRef.current.style.setProperty('--glare-opacity', '0');
    }
  };

  return (
    <div className={`card-perspective-container ${className}`} onClick={onClick}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: 'preserve-3d'
        }}
        className={`interactive-3d-card card-theme-${theme} flex flex-col justify-between`}
      >
        {/* Holographic Shimmer Foil */}
        <div className="card-shimmer-foil" />

        {/* Dynamic Glare Overlay */}
        <div className="card-glare-overlay" />

        {/* Top Header: Issuer, Contactless & Verified Badge */}
        <div className="card-layer-badge flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest font-bold text-white/80 uppercase">
              {issuer}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[9px] font-bold text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{levelBadge}</span>
            </span>
            <Wifi className="w-4 h-4 text-white/70 rotate-90" />
          </div>
        </div>

        {/* Middle Layer: Metallic Chip & Track Sub-title */}
        <div className="card-layer-chip flex items-center justify-between my-auto z-10">
          <div className="metallic-chip" />
          <div className="text-right">
            <span className="text-[10px] font-semibold text-white/60 block uppercase tracking-wider">
              Specialty Track
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              {trackTitle}
            </span>
          </div>
        </div>

        {/* Bottom Layer: Embossed Number, Cardholder Name & Expiry */}
        <div className="card-layer-text space-y-2 z-10">
          <div className="embossed-number">
            {cardNumber}
          </div>

          <div className="flex items-center justify-between text-white/90">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/50 block font-mono">
                Architect / Learner
              </span>
              <span className="text-xs font-bold font-mono tracking-wider">
                {cardHolder}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-white/50 block font-mono">
                Valid Thru
              </span>
              <span className="text-xs font-bold font-mono tracking-wider">
                {expiryDate}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreditCard;

