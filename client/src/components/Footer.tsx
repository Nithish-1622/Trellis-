import React from 'react';
import { TrellisLogo } from './TrellisLogo';

interface FooterProps {
  onSelectTab?: (tab: 'landing' | 'roadmap' | 'resources' | 'profile') => void;
  onOpenDiagnostic?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenDiagnostic }) => {
  return (
    <footer className="w-full py-12 px-4 md:px-8 max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 bg-transparent border-t border-slate-200 dark:border-slate-800 transition-all duration-300 mt-16">
      <div className="col-span-1 md:col-span-1">
        <TrellisLogo
          size="sm"
          showText={true}
          onClick={() => onSelectTab && onSelectTab('landing')}
        />
        <p className="mt-3 font-sans text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          © {new Date().getFullYear()} Trellis Adaptive Learning Platform.
        </p>
      </div>

      <div className="col-span-1 md:col-span-3 flex flex-wrap justify-start md:justify-end gap-6 items-center font-sans text-xs">
        <button
          onClick={() => onSelectTab && onSelectTab('landing')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          Overview & Methodology
        </button>
        <button
          onClick={() => onSelectTab && onSelectTab('roadmap')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          Adaptive Roadmap
        </button>
        <button
          onClick={() => onSelectTab && onSelectTab('resources')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          Architecture Library
        </button>
        <button
          onClick={() => onOpenDiagnostic && onOpenDiagnostic()}
          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline transition-colors cursor-pointer"
        >
          Skill Diagnostic
        </button>
      </div>
    </footer>
  );
};
