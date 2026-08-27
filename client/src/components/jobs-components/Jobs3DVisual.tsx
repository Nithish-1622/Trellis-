import React, { useEffect, useState } from 'react';

interface Jobs3DVisualProps {
    darkMode: boolean;
}

const Jobs3DVisual: React.FC<Jobs3DVisualProps> = ({ darkMode }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="relative w-full h-[400px] flex items-center justify-center perspective-1000 overflow-visible">
            {/* 3D Scene Container */}
            <div
                className="relative w-64 h-64 transform-style-3d transition-transform duration-200 ease-out"
                style={{
                    transform: `rotateX(${-10 + mousePos.y}deg) rotateY(${mousePos.x}deg)`
                }}
            >
                {/* Central Core */}
                <div className="absolute inset-0 m-auto w-32 h-32 transform-style-3d animate-float-slow">
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${darkMode ? 'bg-indigo-500' : 'bg-indigo-400'}`}></div>
                    <div className={`relative w-full h-full rounded-full border-4 shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center backdrop-blur-md overflow-hidden ${darkMode ? 'bg-zinc-900/80 border-indigo-500/50' : 'bg-white/80 border-indigo-400/50'}`}>
                        <div className="text-4xl">💼</div>
                    </div>
                </div>

                {/* Orbiting Ring 1 */}
                <div className="absolute inset-0 m-auto w-48 h-48 border border-dashed rounded-full animate-spin-slow-reverse opacity-40 transform-style-3d border-indigo-500">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-lg flex items-center justify-center text-white text-xs font-bold animate-counter-spin">
                        AI
                    </div>
                </div>

                <div className="absolute inset-0 m-auto w-64 h-64 border border-dashed rounded-full animate-spin-slow opacity-30 transform-style-3d border-purple-500">
                    <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg shadow-lg flex items-center justify-center text-white text-xs font-bold animate-counter-spin-fast">
                        UI
                    </div>
                </div>

                {/* Floating Elements (Parallax) */}
                <div className="absolute top-0 right-0 transform translate-z-20 animate-float" style={{ transform: 'translateZ(40px)' }}>
                    <div className={`px-4 py-2 rounded-xl border shadow-xl backdrop-blur-md ${darkMode ? 'bg-zinc-800/90 border-zinc-700 text-white' : 'bg-white/90 border-zinc-200 text-zinc-800'}`}>
                        <span className="text-xs font-bold text-emerald-500">98% Match</span>
                        <div className="text-xs opacity-70">Senior Engineer</div>
                    </div>
                </div>

                <div className="absolute bottom-10 -left-10 transform translate-z-30 animate-float-delayed" style={{ transform: 'translateZ(60px)' }}>
                    <div className={`px-4 py-2 rounded-xl border shadow-xl backdrop-blur-md ${darkMode ? 'bg-zinc-800/90 border-zinc-700 text-white' : 'bg-white/90 border-zinc-200 text-zinc-800'}`}>
                        <span className="text-xs font-bold text-indigo-500">New Role</span>
                        <div className="text-xs opacity-70">Remote • $180k</div>
                    </div>
                </div>

            </div>

            {/* Floor Reflection */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-10 bg-indigo-500/20 blur-3xl rounded-full transform rotateX(60deg)"></div>
        </div>
    );
};

export default Jobs3DVisual;
