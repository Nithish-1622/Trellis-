import React, { useState, useRef } from 'react';
import { RoadmapNode, ResourceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SkillRadarSvg } from './SkillRadarSvg';
import { StemProgressBar } from './StemProgressBar';
import CreditCard from './CreditCard';
import Analytics9 from './Analytics9';
import Scheduling1 from './Scheduling1';
import {
  Compass,
  BookOpen,
  Settings,
  Sparkles,
  CheckCircle2,
  Lock,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Bookmark,
  FileText,
  Upload,
  User,
  Sun,
  Moon,
  LogOut,
  Target,
  Trophy,
  ArrowRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfileViewProps {
  nodes: RoadmapNode[];
  resources: ResourceItem[];
  onSelectNode: (node: RoadmapNode) => void;
  onOpenWhyThis: (node: RoadmapNode) => void;
  onNodeFeedback: (nodeId: string, action: 'up' | 'down' | 'regen') => void;
  onToggleBookmark: (resId: string) => void;
  onResourceFeedback: (resId: string, action: 'up' | 'down' | 'regen') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  nodes,
  resources,
  onSelectNode,
  onOpenWhyThis,
  onNodeFeedback,
  onToggleBookmark,
  onResourceFeedback
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'resources' | 'settings'>('overview');

  // Resume upload state
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [resumeParsed, setResumeParsed] = useState<boolean>(!!user?.resumeUploaded);
  const [uploadedFileName, setUploadedFileName] = useState<string>(user?.resumeFileName || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings form states
  const [displayName, setDisplayName] = useState(user?.name || 'Architect Learner');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🌿');
  const [hoursPerWeek, setHoursPerWeek] = useState(user?.weeklyHourBudget || 6);
  const [learningStyle, setLearningStyle] = useState(user?.learningStyle || 'Hands-on Projects');
  const [difficulty, setDifficulty] = useState(user?.difficultyPreference || 'Accelerated');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Calculated metrics
  const doneNodes = nodes.filter(n => n.status === 'done');
  const inProgressNode = nodes.find(n => n.status === 'in-progress') || nodes[0];
  const overallProgress = Math.round((doneNodes.length / nodes.length) * 100);

  const currentSkills = user?.skills || {
    programming: 75,
    dataMath: 62,
    design: 68,
    communication: 80,
    leadership: 70,
    research: 60
  };

  const targetSkills = {
    programming: 90,
    dataMath: 85,
    design: 80,
    communication: 85,
    leadership: 80,
    research: 75
  };

  const handleResumeFile = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setIsUploadingResume(true);

    setTimeout(() => {
      setIsUploadingResume(false);
      setResumeParsed(true);

      updateProfile({
        resumeUploaded: true,
        resumeFileName: file.name,
        skills: {
          programming: 88,
          dataMath: 78,
          design: 75,
          communication: 85,
          leadership: 82,
          research: 72
        }
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#059669']
      });
    }, 1500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: displayName,
      avatar: selectedAvatar,
      weeklyHourBudget: hoursPerWeek,
      learningStyle: learningStyle as any,
      difficultyPreference: difficulty as any
    });

    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Profile Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-md">
            {user?.avatar && user.avatar.startsWith('/') ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {user?.name || 'Architect Learner'}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Senior Track
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user?.email || 'architect@trellis.grow'} • {user?.weeklyHourBudget || 6} hrs/week budget
            </p>
          </div>
        </div>

        {/* 4 Tab Navigation Buttons */}
        <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative z-10 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Study Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Saved Resources</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: SVG 6-Axis Skill Radar */}
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Competency Geometry
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-500">
                    Target: Senior Staff Architect
                  </span>
                </div>
                <h2 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
                  Trellis Skill Radar
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Green polygon represents your current growth; amber ring marks your target canopy goal.
                </p>
              </div>

              <div className="py-2 flex items-center justify-center">
                <SkillRadarSvg currentSkills={currentSkills} targetSkills={targetSkills} size={290} />
              </div>
            </div>

            {/* Right: Milestone Progress & Next Action */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Roadmap Progress
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {doneNodes.length} / {nodes.length} Milestones
                  </span>
                </div>

                <StemProgressBar
                  progress={overallProgress}
                  height={10}
                  label="Mastery Progress"
                />

                {inProgressNode && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Active Milestone:
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {inProgressNode.title}
                    </h4>
                    <button
                      onClick={() => onSelectNode(inProgressNode)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Continue Active Node</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Resume Fast-Track Signal Box */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Skill Inference Signal
                  </span>
                  <Upload className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="font-literata font-bold text-sm text-slate-900 dark:text-white">
                  Fast-Track Skills via Resume
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload your CV or LinkedIn export to instantly infer starting proficiency levels.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleResumeFile(file);
                  }}
                />

                {resumeParsed ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Resume parsed: Fast-tracked +18 pts across systems & data!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingResume}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploadingResume ? (
                      <span className="animate-pulse">Parsing & calibrating skills...</span>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{uploadedFileName || 'Drop PDF / Click to Upload'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* 3D Interactive Architect Credential Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-md">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Digital Pass & Verification
              </span>
              <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
                Trellis Architect Credential Pass
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Interactive 3D credential pass with real-time parallax tilt, holographic foil, and metallic EMV chip. Hover and tilt with your cursor to inspect cryptographic verification.
              </p>
            </div>

            <div className="flex justify-center w-full md:w-auto">
              <CreditCard
                cardHolder={user?.name ? user.name.toUpperCase() : 'ELENA ROSTOVA'}
                trackTitle={user?.targetRole || 'Senior Staff Systems Architect'}
                cardNumber="8829 •••• •••• 2026"
                expiryDate="12/28"
                theme="emerald"
                issuer="TRELLIS ARCHITECT PASS"
                levelBadge="VERIFIED CREDENTIAL"
              />
            </div>
          </div>

          {/* Analytics 9: Daily Streak & Activity Heatmap */}
          <Analytics9 currentStreak={14} longestStreak={28} totalSessions={142} />

          {/* Miniature Roadmap & Resource Preview */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-literata text-lg font-bold text-slate-900 dark:text-white">
                Roadmap Path Milestones
              </h3>
              <span className="text-xs text-slate-500">
                Visualizing progression sequence
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {nodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => onSelectNode(n)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 text-left transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {n.type}
                      </span>
                      <span>
                        {n.status === 'done' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                        ) : n.status === 'in-progress' ? (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        ) : n.status === 'available' ? (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                      {n.title}
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-2 block">
                    {n.progress}% Progress
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDY SCHEDULE & LABS (Scheduling 1) ── */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Scheduling1 />
        </div>
      )}

      {/* ── TAB 3: AI RESOURCES EMBEDDED ── */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
                AI-Curated Architecture Resources
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Courses, sandboxes, and deep dives recommended based on your skill radar gaps.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              {resources.length} Tailored Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map(item => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {item.type} • {item.level}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-500">
                      {item.matchScore}% Match
                    </span>
                  </div>

                  <h3 className="font-literata text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    By {item.provider} • {item.duration}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{item.whyThis}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onResourceFeedback(item.id, 'up')}
                      className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        item.feedback === 'up'
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onResourceFeedback(item.id, 'down')}
                      className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        item.feedback === 'down'
                          ? 'bg-rose-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onResourceFeedback(item.id, 'regen')}
                      className="p-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 transition-all text-xs cursor-pointer"
                      title="Regenerate alternative"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onToggleBookmark(item.id)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      item.bookmarked
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{item.bookmarked ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="font-literata text-2xl font-bold text-slate-900 dark:text-white">
              Learner Preferences & Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize your display name, learning cadence, and platform theme.
            </p>
          </div>

          {settingsSavedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full max-w-md p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Diversity Avatar Icon (Netguru Pack)
              </label>
              <div className="flex flex-wrap gap-2.5 max-w-lg">
                {[
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-01.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-02.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-03.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-04.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-05.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-06.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-07.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-08.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-09.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-10.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-11.svg',
                  '/avatars/Artboards_Diversity_Avatars_by_Netguru-12.svg'
                ].map(avatarPath => (
                  <button
                    key={avatarPath}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarPath)}
                    className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white dark:bg-slate-800 cursor-pointer ${
                      selectedAvatar === avatarPath
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={avatarPath} alt="Avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Weekly Time Budget: {hoursPerWeek} Hours / Week
              </label>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={hoursPerWeek}
                onChange={e => setHoursPerWeek(parseInt(e.target.value, 10))}
                className="w-full max-w-md h-2 rounded-lg bg-slate-200 dark:bg-slate-700 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Preferred Learning Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-md">
                {['Hands-on Projects', 'Deep Theoretical RFCs', 'Balanced'].map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setLearningStyle(style)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      learningStyle === style
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Color Theme
              </label>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Save Preferences
              </button>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
