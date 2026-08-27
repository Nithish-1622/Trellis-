import React from 'react';
import ThemeToggle from '../landing-page-components/ThemeToggle';

interface RoadmapNavbarProps {
    darkMode: boolean;
    toggleTheme: () => void;
}

const RoadmapNavbar: React.FC<RoadmapNavbarProps> = ({ darkMode, toggleTheme }) => {
    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${darkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <a href="/profile" className="flex items-center gap-2 group">
                        <div className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-zinc-900 group-hover:bg-zinc-800' : 'bg-zinc-100 group-hover:bg-zinc-200'}`}>
                            <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        <span className="font-bold text-lg">Back to Profile</span>
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                        AI Engineer Path
                    </span>
                    <div className="hidden md:block w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>
                    <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
                </div>
            </div>
        </nav>
    );
};

export default RoadmapNavbar;
