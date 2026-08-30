'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Calendar,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  Award
} from 'lucide-react';
import './Analytics9.css';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  details: string;
}

export interface Analytics9Props {
  currentStreak?: number;
  longestStreak?: number;
  totalSessions?: number;
  data?: DayActivity[];
  className?: string;
}

export const Analytics9: React.FC<Analytics9Props> = ({
  currentStreak = 14,
  longestStreak = 28,
  totalSessions = 142,
  data,
  className = ''
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Generate 24 weeks (168 days) of activity if not provided
  const activityData: DayActivity[] = useMemo(() => {
    if (data && data.length > 0) return data;

    const days: DayActivity[] = [];
    const today = new Date();
    const totalDays = 168; // 24 weeks

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Simulated pattern with high recent density
      const rand = Math.random();
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      let count = 0;
      let details = 'No study activity recorded';

      if (i < 14) {
        // Active streak for the last 14 days
        level = (Math.floor(Math.random() * 3) + 2) as any;
        count = level * 2;
        details = `${count} sessions: Milestone labs & Skill-Checks`;
      } else if (rand > 0.4) {
        level = (Math.floor(Math.random() * 4) + 1) as any;
        count = level * 2;
        details = `${count} sessions: RFC reviews & AI Guide mentoring`;
      }

      days.push({
        date: dateStr,
        count,
        level,
        details
      });
    }
    return days;
  }, [data]);

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      const next = Math.min(activityData.length - 1, idx + 7);
      setFocusedIndex(next);
      setHoveredDay(activityData[next]);
    } else if (e.key === 'ArrowLeft') {
      const prev = Math.max(0, idx - 7);
      setFocusedIndex(prev);
      setHoveredDay(activityData[prev]);
    } else if (e.key === 'ArrowDown') {
      const down = Math.min(activityData.length - 1, idx + 1);
      setFocusedIndex(down);
      setHoveredDay(activityData[down]);
    } else if (e.key === 'ArrowUp') {
      const up = Math.max(0, idx - 1);
      setFocusedIndex(up);
      setHoveredDay(activityData[up]);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`analytics9-container space-y-6 ${className}`}>
      
      {/* Header with Streak Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
              Daily Learning Streak & Activity Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keyboard-navigable activity matrix measuring consecutive days of architecture mastery.
          </p>
        </div>

        {/* Streak Metric Chips */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Current Streak</p>
              <p className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200">{currentStreak} Days</p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Best Streak</p>
              <p className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-200">{longestStreak} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Area */}
      <div className="relative">
        <div className="flex gap-2 items-start">
          {/* Day of Week Column */}
          <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 py-1 h-[142px] shrink-0">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* 24-Week Grid */}
          <div
            tabIndex={0}
            className="activity-heatmap-grid flex-1"
            aria-label="Activity heatmap"
          >
            {activityData.map((day, idx) => {
              const isHovered = hoveredDay?.date === day.date;
              const isFocused = focusedIndex === idx;

              return (
                <div key={day.date} className="relative">
                  <button
                    type="button"
                    tabIndex={0}
                    onFocus={() => { setFocusedIndex(idx); setHoveredDay(day); }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    className={`heatmap-day-cell lvl-${day.level}`}
                    aria-label={`${day.date}: ${day.details}`}
                  />

                  {/* Day Tooltip */}
                  {isHovered && (
                    <div className="heatmap-day-tooltip">
                      <p className="font-bold text-slate-100 dark:text-slate-900">{day.date}</p>
                      <p className="text-[10px] text-emerald-300 dark:text-emerald-700 font-normal">{day.details}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Intensity Legend */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-3">
        <div className="flex items-center gap-1 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Total completed sessions: <strong className="text-slate-900 dark:text-white">{totalSessions}</strong></span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Less</span>
          <div className="heatmap-day-cell lvl-0" />
          <div className="heatmap-day-cell lvl-1" />
          <div className="heatmap-day-cell lvl-2" />
          <div className="heatmap-day-cell lvl-3" />
          <div className="heatmap-day-cell lvl-4" />
          <span>More</span>
        </div>
      </div>

    </div>
  );
};

export default Analytics9;

