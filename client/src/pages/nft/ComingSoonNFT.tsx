import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';

import BackgroundGradients from '../../components/landing-page-components/BackgroundGradients';

const ComingSoonNFT: React.FC = () => {
    const { darkMode } = useThemeContext();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center overflow-hidden relative ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
            <BackgroundGradients />

            {/* 3D Chain Component (CSS-only for performance) */}
            {/* 3D Floating Token/Card Component */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 perspective-1000 z-10 transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateY(${mousePos.x * 10}deg) rotateX(${-mousePos.y * 10}deg)`
                }}
            >
                <div className="w-full h-full relative preserve-3d animate-float-slow">
                    {/* The Card/Token Itself */}
                    <div className={`absolute inset-0 rounded-3xl border-2 backdrop-blur-xl flex items-center justify-center transform-3d ${darkMode ? 'bg-zinc-900/60 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.3)]' : 'bg-white/60 border-indigo-200 shadow-2xl'}`}>
                        {/* Inner Content */}
                        <div className="text-center transform-3d translate-z-10">
                            <div className="text-6xl mb-4">💎</div>
                            <div className={`text-xl font-bold tracking-widest ${darkMode ? 'text-white' : 'text-zinc-900'}`}>SKILL NFT</div>
                            <div className="text-xs uppercase tracking-widest mt-2 text-indigo-500">Verified On-Chain</div>
                        </div>

                        {/* Decorative Corners */}
                        <div className="absolute top-4 left-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <div className="absolute bottom-4 left-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <div className="absolute bottom-4 right-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
                    </div>

                    {/* Glowing Back Layer for Depth */}
                    <div className={`absolute inset-0 rounded-3xl transform-3d -translate-z-4 scale-95 opacity-50 blur-xl ${darkMode ? 'bg-indigo-600' : 'bg-indigo-300'}`}></div>
                </div>
            </div>

            {/* Text Content */}
            <div className="text-center z-10 relative px-6 animate-fade-in-up">
                <div className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-500 text-sm font-bold tracking-widest uppercase mb-6">
                    Web3 Integration
                </div>

                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x mb-6 pb-2">
                    Coming Soon
                </h1>

                <p className={`text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    We are building the infrastructure to mint your verified skills as immutable NFTs on the blockchain. Prove your mastery forever.
                </p>

                <Link to="/profile" className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 ${darkMode ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                    <svg className="w-5 h-5 mr-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    Back to Profile
                </Link>
            </div>

            {/* CSS for 3D helpers */}
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .transform-3d { transform-style: preserve-3d; }
                .translate-z-10 { transform: translateZ(40px); }
                .-translate-z-4 { transform: translateZ(-20px); }
                
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotateX(0deg); }
                    50% { transform: translateY(-20px) rotateX(2deg); }
                }
                .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
            `}</style>
        </div >
    );
};

export default ComingSoonNFT;
