import React from 'react';
import type { ReactNode } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';
import BackgroundGradients from '../landing-page-components/BackgroundGradients';
import ThemeToggle from '../landing-page-components/ThemeToggle';
import LoginVisual from './LoginVisual';
import RegisterVisual from './RegisterVisual';
import ecaiLogo from '../../assets/ecai.png';
import { Link } from 'react-router-dom';

interface SplitAuthLayoutProps {
    children: ReactNode;
    variant?: 'login' | 'register';
}

const SplitAuthLayout: React.FC<SplitAuthLayoutProps> = ({ children, variant = 'login' }) => {
    const { darkMode, toggleTheme } = useThemeContext();

    return (
        <div className={`min-h-screen font-sans transition-all duration-700 ease-in-out relative overflow-x-hidden flex items-center justify-center p-4 md:p-8 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
            <BackgroundGradients />

            {/* Theme Toggle - Fixed Position */}
            <div className="fixed top-6 right-6 z-50 animate-fade-in animation-delay-500 opacity-0">
                <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
            </div>

            {/* 3D Visual Layer - Fixed in Background */}
            <div className="fixed inset-0 z-0 hidden lg:flex items-center justify-center pointer-events-none opacity-0 lg:opacity-100 transform scale-75 lg:scale-100 transition-all duration-700">
                {/* Offset slightly to right on desktop for balance, centered on mobile */}
                <div className={`transition-all duration-1000 ${variant === 'login' ? 'lg:translate-x-72' : 'lg:-translate-x-72'}`}>
                    {variant === 'login' ? <LoginVisual /> : <RegisterVisual />}
                </div>
            </div>

            {/* Form Container */}
            <div className={`relative z-10 w-full max-w-md animate-scale-in transition-all duration-1000 ${variant === 'login' ? 'lg:-translate-x-72' : 'lg:translate-x-72'}`}>
                <div className={`rounded-3xl shadow-2xl backdrop-blur-3xl border p-6 md:p-10 transition-all duration-500 ${darkMode ? 'bg-zinc-900/80 border-white/10 shadow-black/50' : 'bg-white/80 border-white/50 shadow-xl'}`}>

                    {/* Header Logo */}
                    <div className="mb-8 text-center">
                        <Link to="/" className='inline-flex items-center gap-3 cursor-pointer group'>
                            <div className="relative">
                                <div className={`absolute inset-0 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${darkMode ? 'bg-indigo-500' : 'bg-indigo-400'}`}></div>
                                <img src={ecaiLogo} alt="Educat-AI" className='relative h-10 w-auto' />
                            </div>
                            <span className={`font-bold text-2xl tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                                Educat<span className="text-indigo-500">AI</span>
                            </span>
                        </Link>
                    </div>

                    {children}

                    {/* Footer */}
                    <div className={`mt-8 text-center text-xs ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        &copy;{new Date().getFullYear()} EducatAI
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitAuthLayout;
