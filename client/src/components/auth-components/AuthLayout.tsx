import React from 'react';
import type { ReactNode } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';
import BackgroundGradients from '../landing-page-components/BackgroundGradients';
import ThemeToggle from '../landing-page-components/ThemeToggle';
import ecaiLogo from '../../assets/ecai.png';

interface AuthLayoutProps {
    children: ReactNode;
    maxWidth?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    maxWidth = 'max-w-md'
}) => {
    const { darkMode, toggleTheme } = useThemeContext();

    return (
        <div className={`min-h-screen font-sans transition-all duration-700 ease-in-out relative overflow-hidden flex items-center justify-center ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
            <BackgroundGradients />

            {/* Theme Toggle - Fixed Position */}
            <div className="fixed top-4 right-4 z-50 animate-fade-in animation-delay-500 opacity-0">
                <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
            </div>

            <div className={`relative z-10 w-full ${maxWidth} px-6 py-12 md:px-8`}>
                {/* Logo */}
                <div className="flex justify-center mb-8 animate-fade-in-up opacity-0">
                    <a href="/" className='flex items-center gap-3 cursor-pointer group'>
                        <div className="relative">
                            <div className={`absolute inset-0 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${darkMode ? 'bg-indigo-500' : 'bg-indigo-400'}`}></div>
                            <img src={ecaiLogo} alt="Educat-AI" className='relative h-10 w-auto' />
                        </div>
                        <span className={`font-bold text-2xl tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                            Educat<span className="text-indigo-500">AI</span>
                        </span>
                    </a>
                </div>

                {/* Card Content */}
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
