import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';

const AuthVisual: React.FC = () => {
    const { darkMode } = useThemeContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse position from -1 to 1
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center perspective-3000 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-40 mix-blend-multiply transition-colors duration-700 ${darkMode ? 'bg-indigo-500/30' : 'bg-indigo-300'}`}></div>
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-40 mix-blend-multiply transition-colors duration-700 ${darkMode ? 'bg-violet-500/30' : 'bg-blue-300'}`}></div>

            {/* 3D Floating Elements Container */}
            <div
                className="relative w-[320px] h-[480px] transform-3d transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateY(${mousePosition.x * -10}deg) rotateX(${mousePosition.y * 10}deg)`
                }}
            >
                {/* Main Glass Card */}
                <div className={`absolute inset-0 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col items-center justify-between p-8 transform-3d transition-all duration-700 ${darkMode ? 'bg-zinc-900/40 border-white/10 shadow-black/40' : 'bg-white/40 border-white/40 shadow-xl'}`}>

                    {/* Card Top - Chip Icon */}
                    <div className="w-full flex justify-between items-start transform-3d translate-z-10">
                        <div className={`w-12 h-10 rounded-lg border flex items-center justify-center ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-100 border-amber-200'}`}>
                            <div className="w-8 h-6 border-2 border-amber-500/40 rounded bg-transparent relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/20 to-transparent"></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-mono font-bold tracking-widest uppercase ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Educat Access</div>
                            <div className={`text-[10px] font-mono opacity-50 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>VERIFIED v3.0</div>
                        </div>
                    </div>

                    {/* Card Center - Dynamic Visualization */}
                    <div className="relative w-40 h-40 transform-3d translate-z-20">
                        {/* Rotating Rings */}
                        <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-spin-slow ${darkMode ? 'border-indigo-500/30' : 'border-indigo-400/40'}`}></div>
                        <div className={`absolute inset-4 rounded-full border-2 border-dashed animate-spin-reverse ${darkMode ? 'border-violet-500/30' : 'border-violet-400/40'}`}></div>

                        {/* Central Core */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-20 h-20 rounded-full blur-xl animate-pulse-slow ${darkMode ? 'bg-indigo-500/50' : 'bg-indigo-400/50'}`}></div>
                            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border ${darkMode ? 'bg-zinc-800/80 border-white/10 text-white' : 'bg-white/90 border-zinc-200 text-indigo-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Card Bottom - Code */}
                    <div className="w-full transform-3d translate-z-10">
                        <div className={`h-1.5 w-full rounded-full overflow-hidden mb-2 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                            <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse"></div>
                        </div>
                        <div className={`flex justify-between text-[10px] font-mono ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            <span>ID: 8AF-99X</span>
                            <span>AUTH_REQ</span>
                        </div>
                    </div>
                </div>

                {/* Floating Decoration Behind */}
                <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-2xl border transform-3d translate-z-[-20px] animate-float-delayed ${darkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white/60 border-zinc-200'} backdrop-blur-sm flex items-center justify-center`}>
                    <span className="text-2xl">🚀</span>
                </div>

                <div className={`absolute -left-6 top-12 w-20 h-20 rounded-2xl border transform-3d translate-z-[30px] animate-float-slow ${darkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white/60 border-zinc-200'} backdrop-blur-sm flex items-center justify-center`}>
                    <span className="text-2xl">✨</span>
                </div>
            </div>
        </div>
    );
};

export default AuthVisual;
