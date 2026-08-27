import React, { useEffect, useState, useRef } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';

const Assistant3DCard: React.FC = () => {
    const { darkMode } = useThemeContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.matchMedia("(max-width: 768px)").matches) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                setMousePosition({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
            }
        };

        const currentContainer = containerRef.current;
        currentContainer?.addEventListener('mousemove', handleMouseMove);
        return () => {
            currentContainer?.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const resetPosition = () => setMousePosition({ x: 0, y: 0 });

    return (
        <div className="perspective-1000 w-full max-w-sm mx-auto mb-8 flex flex-col items-center justify-center">
            {/* 3D Container with Tilt */}
            <div
                ref={containerRef}
                onMouseLeave={resetPosition}
                className="relative w-64 h-64 transform-3d transition-transform duration-200 ease-out cursor-pointer select-none flex items-center justify-center"
                style={{
                    transform: `rotateY(${mousePosition.x * 15}deg) rotateX(${mousePosition.y * -15}deg)`
                }}
            >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[80px] animate-pulse-slow"></div>

                {/* The Core Structure */}
                <div className="relative w-40 h-40 transform-3d animate-float">

                    {/* Inner Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-[0_0_50px_rgba(99,102,241,0.8)] animate-pulse z-20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-400 rounded-full blur-md z-20 mix-blend-overlay"></div>

                    {/* Ring 1 - Vertical Spin */}
                    <div className="absolute inset-0 border-2 border-indigo-400/50 rounded-full animate-spin-slow-x shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-200 rounded-full shadow-[0_0_10px_white]"></div>
                    </div>

                    {/* Ring 2 - Horizontal Spin */}
                    <div className="absolute inset-2 border-2 border-purple-400/50 rounded-full animate-spin-slow-y shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-200 rounded-full shadow-[0_0_10px_white]"></div>
                    </div>

                    {/* Ring 3 - Diagonal Spin */}
                    <div className="absolute inset-4 border border-emerald-400/40 rounded-full animate-spin-slow-z shadow-[0_0_15px_rgba(52,211,153,0.3)]"></div>
                </div>

                {/* Floating "Data" Particles */}
                <div className="absolute top-10 right-10 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute bottom-12 left-10 w-1 h-1 bg-purple-300 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
            </div>

            {/* Status Text & Greeting */}
            <div className="mt-6 text-center transform-3d translate-z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>CORE ONLINE</span>
                </div>
                <h2 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-text-shimmer bg-[length:200%_auto]`}>
                    Your AI Companion
                </h2>
            </div>

            <style>{`
                @keyframes spin-x {
                    0% { transform: rotateX(0deg) rotateY(0deg); }
                    100% { transform: rotateX(360deg) rotateY(20deg); }
                }
                @keyframes spin-y {
                    0% { transform: rotateY(0deg) rotateZ(0deg); }
                    100% { transform: rotateY(360deg) rotateZ(20deg); }
                }
                @keyframes spin-z {
                    0% { transform: rotateZ(0deg) rotateX(0deg); }
                    100% { transform: rotateZ(360deg) rotateX(20deg); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-10px) scale(1.05); }
                }
                @keyframes text-shimmer {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                
                .animate-spin-slow-x { animation: spin-x 8s linear infinite; }
                .animate-spin-slow-y { animation: spin-y 12s linear infinite; }
                .animate-spin-slow-z { animation: spin-z 15s linear infinite; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-text-shimmer { animation: text-shimmer 5s linear infinite; }
                .perspective-1000 { perspective: 1000px; }
                .transform-3d { transform-style: preserve-3d; }
                .translate-z-10 { transform: translateZ(10px); }
            `}</style>
        </div>
    );
};

export default Assistant3DCard;
