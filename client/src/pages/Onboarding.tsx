import React from 'react';
import { Link } from 'react-router-dom';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import ThemeToggle from '../components/landing-page-components/ThemeToggle';
import { useThemeContext } from '../hooks/useThemeContext';
import trellisLogo from '../assets/trellis.png';

const Onboarding: React.FC = () => {
    const { darkMode, toggleTheme } = useThemeContext();

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
            <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        <img src={trellisLogo} alt="" className="h-8 w-auto" />
                        <span className="text-lg font-bold tracking-tight">Trellis</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-xs text-zinc-600 dark:text-zinc-400 sm:inline">Progress saves when you continue</span>
                        <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
                    </div>
                </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
                <OnboardingWizard />
            </main>
        </div>
    );
};

export default Onboarding;
