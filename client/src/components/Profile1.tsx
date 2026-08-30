'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  ShieldCheck,
  MapPin,
  Calendar,
  ExternalLink,
  Share2,
  Edit3,
  Flame,
  CheckCircle2,
  Award,
  Sparkles,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import CreditCard from './CreditCard';
import './Profile1.css';

export interface Profile1Props {
  name?: string;
  role?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedDate?: string;
  streakDays?: number;
  milestonesMastered?: number;
  overallProgress?: number;
  onEditProfile?: () => void;
  onViewSchedule?: () => void;
  className?: string;
}

export const Profile1: React.FC<Profile1Props> = ({
  name = 'Elena Rostova',
  role = 'Senior Staff Systems Architect',
  email = 'elena@scalemesh.io',
  avatar = '/avatars/Artboards_Diversity_Avatars_by_Netguru-01.svg',
  bio = 'Architecting high-throughput distributed event backbones, transactional outbox sagas, and zero-trust service mesh topologies on living Trellis lattices.',
  location = 'San Francisco, CA • Remote',
  joinedDate = 'Joined February 2026',
  streakDays = 14,
  milestonesMastered = 6,
  overallProgress = 68,
  onEditProfile,
  onViewSchedule,
  className = ''
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSharePass = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`profile1-card ${className}`}>
      
      {/* Cover Banner */}
      <div className="profile1-banner flex items-end justify-between p-6">
        <div className="flex items-center gap-2 relative z-10">
          <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Cryptographically Verified Profile</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-200/90 relative z-10">
          <span>TRELLIS ID #TRL-8829</span>
        </div>
      </div>

      {/* Main Profile Body */}
      <div className="p-6 sm:p-8 space-y-8">
        
        {/* Top Info Row + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          
          <div className="space-y-4">
            {/* Avatar & Verification */}
            <div className="flex items-end gap-4">
              <div className="profile1-avatar-wrapper">
                {avatar && (avatar.startsWith('/') || avatar.startsWith('http')) ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {name}
                  </h1>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {role}
                </p>
              </div>
            </div>

            {/* Bio Text */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {bio}
            </p>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{location}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{joinedDate}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSharePass}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Pass</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Combined 3D Credit Card & Stat Metrics Row */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Quick Stats Grid */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Live Telemetry
              </span>
              <h3 className="font-literata text-lg font-bold text-slate-900 dark:text-white">
                Architect Growth Benchmarks
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="profile1-stat-pill space-y-1">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <Flame className="w-4 h-4" />
                  <span className="font-mono text-sm font-bold">{streakDays}d</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Streak</p>
              </div>

              <div className="profile1-stat-pill space-y-1">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Layers className="w-4 h-4" />
                  <span className="font-mono text-sm font-bold">{milestonesMastered}</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Mastered</p>
              </div>

              <div className="profile1-stat-pill space-y-1">
                <div className="flex items-center justify-center gap-1 text-blue-500">
                  <Award className="w-4 h-4" />
                  <span className="font-mono text-sm font-bold">{overallProgress}%</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Progress</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Your 3D Architect Pass contains cryptographic proof of milestone masteries and live 6-axis competency telemetry.
              </span>
            </div>
          </div>

          {/* Right: Embedded Interactive 3D Credit Card */}
          <div className="lg:col-span-6 flex justify-center">
            <CreditCard
              cardHolder={name.toUpperCase()}
              trackTitle={role}
              cardNumber="8829 •••• •••• 2026"
              expiryDate="12/28"
              theme="emerald"
              issuer="TRELLIS ARCHITECT PASS"
              levelBadge="VERIFIED CREDENTIAL"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile1;

