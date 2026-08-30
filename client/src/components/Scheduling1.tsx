'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
  Layers,
  Brain,
  CheckCircle2,
  Filter,
  Tag,
  BookOpen
} from 'lucide-react';
import './Scheduling1.css';

export interface ScheduleEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string;
  duration: string;
  type: 'milestone' | 'rfc' | 'quiz' | 'mentor';
  domain: string;
  completed?: boolean;
}

export interface Scheduling1Props {
  initialDate?: Date;
  events?: ScheduleEvent[];
  onAddEvent?: (event: Omit<ScheduleEvent, 'id'>) => void;
  onToggleComplete?: (id: string) => void;
  className?: string;
}

export const Scheduling1: React.FC<Scheduling1Props> = ({
  initialDate = new Date(),
  events: customEvents,
  onAddEvent,
  onToggleComplete,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'milestone' | 'rfc' | 'quiz' | 'mentor'>('milestone');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newDuration, setNewDuration] = useState('45 min');

  const defaultEvents: ScheduleEvent[] = [
    {
      id: 'ev-1',
      date: new Date().toISOString().split('T')[0],
      title: 'Mastering Transactional Outbox Pattern in Go',
      time: '09:30 AM',
      duration: '45 min',
      type: 'milestone',
      domain: 'Distributed Systems',
      completed: true
    },
    {
      id: 'ev-2',
      date: new Date().toISOString().split('T')[0],
      title: 'RFC-44 Deep-Dive: Multi-Region Event Choreography',
      time: '02:00 PM',
      duration: '60 min',
      type: 'rfc',
      domain: 'Software Architecture',
      completed: false
    },
    {
      id: 'ev-3',
      date: new Date().toISOString().split('T')[0],
      title: 'Adaptive Skill-Check: Kafka Log Partitions & Rebalance',
      time: '05:30 PM',
      duration: '20 min',
      type: 'quiz',
      domain: 'Data Engineering',
      completed: false
    },
    {
      id: 'ev-4',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      title: 'Trellis AI Mentor Session: Raft vs Paxos Trade-offs',
      time: '11:00 AM',
      duration: '30 min',
      type: 'mentor',
      domain: 'Distributed Systems',
      completed: false
    },
    {
      id: 'ev-5',
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      title: 'Kubernetes Multi-Cluster Service Mesh Hands-on Lab',
      time: '04:00 PM',
      duration: '90 min',
      type: 'milestone',
      domain: 'Cloud & DevOps',
      completed: false
    }
  ];

  const [eventList, setEventList] = useState<ScheduleEvent[]>(customEvents || defaultEvents);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const dayEvents = eventList.filter(ev => {
    const matchesDate = ev.date === selectedDateStr;
    const matchesFilter =
      selectedFilter === 'All' ||
      (selectedFilter === 'Milestones' && ev.type === 'milestone') ||
      (selectedFilter === 'RFCs' && ev.type === 'rfc') ||
      (selectedFilter === 'Skill-Checks' && ev.type === 'quiz') ||
      (selectedFilter === 'AI Mentor' && ev.type === 'mentor');

    return matchesDate && matchesFilter;
  });

  const getDayDotColors = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const evs = eventList.filter(e => e.date === dateStr);
    return evs.map(e => {
      if (e.type === 'milestone') return 'green';
      if (e.type === 'rfc') return 'amber';
      if (e.type === 'quiz') return 'purple';
      return 'blue';
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEv: ScheduleEvent = {
      id: `ev-${Date.now()}`,
      date: selectedDateStr,
      title: newTitle,
      time: newTime,
      duration: newDuration,
      type: newType,
      domain: newType === 'milestone' ? 'Distributed Systems' : 'Software Architecture',
      completed: false
    };

    setEventList(prev => [...prev, newEv]);
    onAddEvent?.(newEv);
    setNewTitle('');
    setIsAddingEvent(false);
  };

  const toggleEventCheck = (id: string) => {
    setEventList(prev =>
      prev.map(e => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
    onToggleComplete?.(id);
  };

  return (
    <div className={`scheduling1-container ${className}`}>
      
      {/* Top Header Bar */}
      <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
              Study Calendar & Lab Scheduler
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
              Adaptive Schedule
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize milestone study blocks, RFC review sessions, and adaptive skill-check drills.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingEvent(!isAddingEvent)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAddingEvent ? 'Close Form' : 'Schedule Study Session'}</span>
        </button>
      </div>

      {/* Main Grid: Month Calendar (Left) + Day Agenda (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        
        {/* Left Column: Month Calendar View */}
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="font-literata text-lg font-bold text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="scheduling-calendar-grid mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="scheduling-calendar-grid">
            {/* Prev month fill days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`prev-${i}`} className="calendar-day-cell other-month">
                {prevMonthTotalDays - firstDayIndex + i + 1}
              </div>
            ))}

            {/* Current month days */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNumber = i + 1;
              const isSelected = selectedDay === dayNumber;
              const isToday =
                new Date().getDate() === dayNumber &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              const dotColors = getDayDotColors(dayNumber);

              return (
                <button
                  key={dayNumber}
                  type="button"
                  onClick={() => setSelectedDay(dayNumber)}
                  className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                >
                  <span>{dayNumber}</span>
                  {dotColors.length > 0 && (
                    <div className="event-dots-row">
                      {dotColors.slice(0, 3).map((col, cIdx) => (
                        <div key={cIdx} className={`event-dot ${col}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Event Dots Legend */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>RFC Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Skill-Check</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>AI Mentor</span>
            </div>
          </div>
        </div>

        {/* Right Column: Scrollable Day Agenda & Filter */}
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Agenda Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-literata text-lg font-bold text-slate-900 dark:text-white">
                  Agenda for {monthNames[month]} {selectedDay}, {year}
                </h3>
                <span className="text-xs text-slate-500">
                  {dayEvents.length} scheduled session{dayEvents.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['All', 'Milestones', 'RFCs', 'Skill-Checks', 'AI Mentor'].map(filt => (
                  <button
                    key={filt}
                    type="button"
                    onClick={() => setSelectedFilter(filt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedFilter === filt
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {filt}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Add Session Form */}
            <AnimatePresence>
              {isAddingEvent && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateEvent}
                  className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Add Session to {monthNames[month]} {selectedDay}
                  </span>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Study Raft Consensus leader election..."
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                      className="px-2.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="milestone">Milestone Lab</option>
                      <option value="rfc">RFC Review</option>
                      <option value="quiz">Skill-Check</option>
                      <option value="mentor">AI Mentor</option>
                    </select>
                    <input
                      type="text"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="px-2.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newDuration}
                      onChange={e => setNewDuration(e.target.value)}
                      placeholder="45 min"
                      className="px-2.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                    >
                      Save Session
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Scrollable Events List */}
            <div className="agenda-scroll-container space-y-2.5 pr-1">
              {dayEvents.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No sessions scheduled for this day
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Click "Schedule Study Session" to block out time on your calendar.
                  </p>
                </div>
              ) : (
                dayEvents.map(event => (
                  <div key={event.id} className="agenda-item-card flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          event.type === 'milestone'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : event.type === 'rfc'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                            : event.type === 'quiz'
                            ? 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {event.type.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {event.time} • {event.duration}
                        </span>
                      </div>

                      <h4 className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug truncate ${event.completed ? 'line-through text-slate-400' : ''}`}>
                        {event.title}
                      </h4>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{event.domain}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleEventCheck(event.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        event.completed
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 border-emerald-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-500'
                      }`}
                      title={event.completed ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scheduling1;

