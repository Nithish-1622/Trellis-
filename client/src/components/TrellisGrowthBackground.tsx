import React, { useEffect, useRef } from 'react';

interface TrellisGrowthBackgroundProps {
  opacity?: number;
}

interface Slat {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

interface Leaf {
  x: number;
  y: number;
  angle: number;
  size: number;
  color: string;
  stemT: number;
  flutterPhase: number;
}

interface VineSegment {
  startX: number;
  startY: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  endX: number;
  endY: number;
}

interface Vine {
  segments: VineSegment[];
  leaves: Leaf[];
  color: string;
  phaseOffset: number;
}

interface Spore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const TrellisGrowthBackground: React.FC<TrellisGrowthBackgroundProps> = ({
  opacity = 0.85
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildScene();
    };

    window.addEventListener('resize', handleResize);

    // 1. Build Wooden Lattice
    let slats: Slat[] = [];
    const spacing = 110;

    // 2. Build Vines & Leaves
    let vines: Vine[] = [];
    let spores: Spore[] = [];

    function buildScene() {
      slats = [];
      vines = [];
      spores = [];

      // Slats (\ direction)
      for (let offset = -height; offset <= width + height; offset += spacing) {
        slats.push({
          x1: offset,
          y1: 0,
          x2: offset + height,
          y2: height,
          width: 8
        });
      }
      // Slats (/ direction)
      for (let offset = -height; offset <= width + height; offset += spacing) {
        slats.push({
          x1: offset + height,
          y1: 0,
          x2: offset,
          y2: height,
          width: 8
        });
      }

      // Procedural climbing vines
      const vineColors = ['#059669', '#10b981', '#047857', '#065f46', '#34d399'];
      const leafColors = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#a7f3d0'];

      const numVines = Math.max(4, Math.floor(width / 260));
      for (let i = 0; i < numVines; i++) {
        const rootX = (width / (numVines + 1)) * (i + 1) + (Math.random() - 0.5) * 60;
        let curX = rootX;
        let curY = height + 20;

        const segments: VineSegment[] = [];
        const leaves: Leaf[] = [];
        const numSegments = 10;
        const totalHeight = height * 0.95;
        const segHeight = totalHeight / numSegments;

        for (let s = 0; s < numSegments; s++) {
          const targetY = curY - segHeight;
          const sway = Math.sin((s / numSegments) * Math.PI * 2.5 + i) * 75;
          const targetX = curX + sway + (Math.random() - 0.5) * 30;

          const cp1x = curX + (targetX - curX) * 0.3 + (Math.random() - 0.5) * 40;
          const cp1y = curY - segHeight * 0.35;
          const cp2x = curX + (targetX - curX) * 0.7 + (Math.random() - 0.5) * 40;
          const cp2y = curY - segHeight * 0.7;

          segments.push({
            startX: curX,
            startY: curY,
            cp1x,
            cp1y,
            cp2x,
            cp2y,
            endX: targetX,
            endY: targetY
          });

          // Leaves on this segment
          const numLeaves = 2 + Math.floor(Math.random() * 2);
          for (let l = 0; l < numLeaves; l++) {
            const t = (s + (l + 1) / (numLeaves + 1)) / numSegments;
            const side = l % 2 === 0 ? 1 : -1;
            const leafAngle = side * (0.4 + Math.random() * 0.6) - Math.PI / 2;
            leaves.push({
              x: cp1x + (cp2x - cp1x) * (l / numLeaves),
              y: cp1y + (cp2y - cp1y) * (l / numLeaves),
              angle: leafAngle,
              size: 14 + Math.random() * 12,
              color: leafColors[Math.floor(Math.random() * leafColors.length)],
              stemT: t,
              flutterPhase: Math.random() * Math.PI * 2
            });
          }

          curX = targetX;
          curY = targetY;
        }

        vines.push({
          segments,
          leaves,
          color: vineColors[i % vineColors.length],
          phaseOffset: i * 0.18
        });
      }

      // Glowing sunlight pollen
      for (let p = 0; p < 35; p++) {
        spores.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.2 - Math.random() * 0.3,
          size: 1.5 + Math.random() * 2.5,
          alpha: 0.2 + Math.random() * 0.5,
          color: Math.random() > 0.4 ? '#fef08a' : '#6ee7b7'
        });
      }
    }

    buildScene();

    // Smooth looping growth animation timer
    let time = 0;

    const render = () => {
      time += 0.006; // Calm, continuous progression

      // Growth cycle: smooth sinusoidal loop between 0.3 (starting canopy) and 1.0 (full lush bloom)
      // Cycle period is around ~25 seconds
      const growthProgress = 0.55 + 0.45 * Math.sin(time);

      ctx.clearRect(0, 0, width, height);

      // Check dark mode
      const isDark = document.documentElement.classList.contains('dark');

      // ── Draw Trellis Framework ───────────────────────────────────────────
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(203, 213, 225, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const s of slats) {
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
      }
      ctx.stroke();
      ctx.restore();

      // ── Draw Climbing Vines (Looping growth) ──────────────────────────────
      for (const v of vines) {
        const effectiveGrowth = Math.min(1.0, Math.max(0.1, growthProgress + v.phaseOffset * 0.15));
        const numActiveSegments = Math.ceil(v.segments.length * effectiveGrowth);

        ctx.save();
        ctx.strokeStyle = isDark ? v.color : v.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = opacity;

        ctx.beginPath();
        for (let i = 0; i < numActiveSegments && i < v.segments.length; i++) {
          const seg = v.segments[i];
          if (i === 0) ctx.moveTo(seg.startX, seg.startY);
          ctx.bezierCurveTo(seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.endX, seg.endY);
        }
        ctx.stroke();

        // Draw leaves on active segments
        for (const leaf of v.leaves) {
          if (leaf.stemT > effectiveGrowth) continue;

          // Gentle breeze sway
          const sway = Math.sin(time * 2 + leaf.flutterPhase) * 0.15;
          const currentAngle = leaf.angle + sway;
          const scale = Math.min(1, (effectiveGrowth - leaf.stemT) * 4);

          ctx.save();
          ctx.translate(leaf.x, leaf.y);
          ctx.rotate(currentAngle);
          ctx.scale(scale, scale);

          ctx.fillStyle = leaf.color;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(leaf.size * 0.5, -leaf.size * 0.4, leaf.size, 0);
          ctx.quadraticCurveTo(leaf.size * 0.5, leaf.size * 0.4, 0, 0);
          ctx.fill();

          ctx.restore();
        }

        ctx.restore();
      }

      // ── Draw Ambient Pollen / Spores ─────────────────────────────────────
      ctx.save();
      for (const sp of spores) {
        sp.y += sp.vy;
        sp.x += sp.vx + Math.sin(time + sp.size) * 0.2;

        if (sp.y < -10) sp.y = height + 10;
        if (sp.x < -10) sp.x = width + 10;
        if (sp.x > width + 10) sp.x = -10;

        ctx.globalAlpha = sp.alpha * opacity;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 trellis-growth-canvas"
      style={{ opacity }}
    />
  );
};
