import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';

const LoginVisual: React.FC = () => {
    const { darkMode } = useThemeContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center perspective-3000">
            {/* Background Effects */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 mix-blend-screen transition-colors duration-700 ${darkMode ? 'bg-indigo-600/30' : 'bg-indigo-300'}`}></div>

            {/* Floating Portal System */}
            <div
                className="relative w-[500px] h-[500px] transform-3d transition-transform duration-100 ease-out flex items-center justify-center"
                style={{
                    transform: `rotateY(${mousePosition.x * -12}deg) rotateX(${mousePosition.y * 12}deg)`
                }}
            >
                {/* Outer Ring */}
                <div className={`absolute inset-0 rounded-full border-[1px] transform-3d animate-spin-slow ${darkMode ? 'border-indigo-500/20' : 'border-indigo-400/30'}`} style={{ transform: 'rotateX(70deg)' }}></div>
                <div className={`absolute inset-0 rounded-full border-[1px] transform-3d animate-spin-reverse ${darkMode ? 'border-violet-500/20' : 'border-violet-400/30'}`} style={{ transform: 'rotateY(70deg)' }}></div>

                {/* Middle Rotating Elements */}
                <div className={`absolute inset-12 rounded-full border-2 border-dashed transform-3d animate-spin-slow ${darkMode ? 'border-indigo-400/30' : 'border-indigo-500/30'}`}></div>

                {/* Central Core Sphere */}
                <div className="relative transform-3d animate-float-slow">
                    {/* Glowing Core */}
                    <div className={`w-32 h-32 rounded-full blur-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-indigo-500/40' : 'bg-indigo-400/40'} animate-pulse-slow`}></div>

                    {/* Solid Core */}
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm ${darkMode ? 'bg-zinc-900/40 border-indigo-500/30' : 'bg-white/40 border-indigo-200'} shadow-indigo-500/20`}>
                        <svg className={`w-10 h-10 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                {/* Floating Satellites */}
                <div className={`hidden md:block absolute -right-8 top-10 p-3 rounded-2xl border backdrop-blur-md transform-3d translate-z-20 animate-float-delayed ${darkMode ? 'bg-zinc-900/80 border-white/5 shadow-black/50' : 'bg-white/80 border-zinc-200 shadow-xl'}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className={`text-[10px] font-mono font-bold ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>SECURE_GATEWAY</span>
                    </div>
                </div>

                <div className={`hidden md:flex absolute -left-4 bottom-20 w-12 h-12 rounded-xl border backdrop-blur-md items-center justify-center transform-3d translate-z-[-20px] animate-float-slow ${darkMode ? 'bg-zinc-900/80 border-white/5' : 'bg-white/80 border-zinc-200'}`}>
                    <span className="text-xl">🔑</span>
                </div>

            </div>
        </div>
    );
};

export default LoginVisual;
