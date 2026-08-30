import React from 'react';
import { TrellisLogo } from './TrellisLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Compass,
  BookOpen,
  Brain,
  MessageSquare,
  LogIn,
  LogOut,
  Sparkles,
  User
} from 'lucide-react';
import GooeyNav from './GooeyNav';

export type ActiveTab = 'landing' | 'roadmap' | 'resources' | 'practice' | 'chat' | 'profile' | 'auth' | 'onboarding';

interface HeaderProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const isLanding = currentTab === 'landing' || currentTab === 'auth' || currentTab === 'onboarding' || !isAuthenticated || !user?.onboarded;

  return (
    <header className="fixed top-0 w-full z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <TrellisLogo
            size="md"
            onClick={() => onSelectTab(isAuthenticated ? 'roadmap' : 'landing')}
            className="hover:opacity-90 transition-opacity cursor-pointer"
          />

          {/* SaaS Navigation Links (ONLY SHOWN FOR AUTHENTICATED PLATFORM USERS) */}
          {!isLanding && (
            <div className="hidden md:block">
              <GooeyNav
                items={[
                  { label: 'Roadmap', icon: <Compass className="w-3.5 h-3.5" />, onClick: () => onSelectTab('roadmap') },
                  { label: 'Resources', icon: <BookOpen className="w-3.5 h-3.5" />, onClick: () => onSelectTab('resources') },
                  { label: 'Skill-Check', icon: <Brain className="w-3.5 h-3.5" />, onClick: () => onSelectTab('practice') },
                  { label: 'AI Guide', icon: <MessageSquare className="w-3.5 h-3.5" />, onClick: () => onSelectTab('chat') }
                ]}
                activeIndex={['roadmap', 'resources', 'practice', 'chat'].indexOf(currentTab) >= 0 ? ['roadmap', 'resources', 'practice', 'chat'].indexOf(currentTab) : 0}
              />
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Landing Mode: Sign In + Get Started */}
          {isLanding ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onSelectTab('auth')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => onSelectTab('auth')}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </button>
            </div>
          ) : (
            /* Authenticated Mode: Profile + Sign Out */
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectTab('profile')}
                className={`p-1.5 pl-3 pr-2.5 rounded-full border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                  currentTab === 'profile'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="hidden sm:inline font-medium truncate max-w-[110px]">
                  {user?.name || 'Learner'}
                </span>
                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  {user?.avatar && user.avatar.startsWith('/') ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  logout();
                  onSelectTab('landing');
                }}
                title="Sign Out"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (ONLY SHOWN FOR AUTHENTICATED USERS, NEVER ON LANDING) */}
      {!isLanding && (
        <div className="md:hidden flex border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 px-3 py-2 justify-around text-xs font-medium">
          <button
            onClick={() => onSelectTab('roadmap')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              currentTab === 'roadmap'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>
          <button
            onClick={() => onSelectTab('resources')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              currentTab === 'resources'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resources</span>
          </button>
          <button
            onClick={() => onSelectTab('practice')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              currentTab === 'practice'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Skill-Check</span>
          </button>
          <button
            onClick={() => onSelectTab('chat')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              currentTab === 'chat'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Guide</span>
          </button>
        </div>
      )}
    </header>
  );
};
