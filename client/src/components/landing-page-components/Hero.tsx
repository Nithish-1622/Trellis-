import React from 'react';
import { Link } from 'react-router-dom';

interface HeroProps {
    darkMode: boolean;
}

const Hero: React.FC<HeroProps> = ({ darkMode }) => {


    return (
        <section className='relative pt-32 pb-20 lg:pt-48 lg:pb-32'>
            <div className='max-w-7xl mx-auto px-6 lg:px-8 relative z-10'>
                <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>

                    {/* Left Content */}
                    <div className='max-w-2xl flex flex-col items-center text-center lg:items-start lg:text-left'>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border animate-fade-in-up ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            AI-Powered Architecture
                        </div>

                        <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8 animate-fade-in-up animation-delay-100 opacity-0 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                            Your career, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-500 to-indigo-400 animate-gradient-x bg-300%">
                                engineered by AI.
                            </span>
                        </h1>

                        <p className={`text-lg sm:text-xl leading-relaxed mb-10 max-w-lg animate-fade-in-up animation-delay-200 opacity-0 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            Stop guessing. EducatAI analyzes your profile and architecturalizes a verified, precision-engineered roadmap for your professional growth.
                        </p>

                        <div className='flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-300 opacity-0 w-full sm:w-auto px-4 sm:px-0'>
                            <Link to="/register" className={`inline-flex justify-center items-center px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/25 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'}`}>
                                Start Free Trial
                                <svg className="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                            </Link>
                            <a href="#features" className={`inline-flex justify-center items-center px-8 py-4 rounded-xl text-lg font-medium border transition-all hover:-translate-y-1 ${darkMode ? 'text-white border-white/10 hover:bg-white/5 backdrop-blur-sm' : 'text-zinc-700 border-zinc-200 hover:bg-zinc-50'}`}>
                                View Demo
                            </a>
                        </div>
                    </div>

                    {/* Right Visual - 3D Dashboard Mockup */}
                    <div className='relative w-full perspective-3000 animate-fade-in-up animation-delay-400 opacity-0 hidden lg:block'>
                        <div className={`relative rounded-xl border p-2 shadow-2xl transition-transform duration-700 hover:rotate-0 rotate-y-[-6deg] rotate-x-[3deg] transform-3d ${darkMode ? 'bg-zinc-900/80 border-white/10 shadow-indigo-500/10' : 'bg-white/90 border-zinc-200 shadow-xl'}`}>
                            {/* Window UI */}
                            <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
                                {/* Header */}
                                <div className={`flex items-center gap-2 px-4 py-3 border-b ${darkMode ? 'border-white/5 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'}`}>
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    </div>
                                    <div className={`ml-4 text-xs font-mono opacity-50 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>educat-ai.app/roadmap</div>
                                </div>
                                {/* Dashboard Content */}
                                <div className="p-6 grid grid-cols-12 gap-6 h-[400px]">
                                    {/* Sidebar */}
                                    <div className="col-span-3 space-y-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`h-8 rounded-lg w-full ${darkMode ? 'bg-white/5' : 'bg-zinc-200'}`}></div>
                                        ))}
                                    </div>
                                    {/* Main Area */}
                                    <div className="col-span-9 space-y-6">
                                        <div className="flex gap-4">
                                            <div className={`h-24 w-1/3 rounded-xl ${darkMode ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-100'}`}></div>
                                            <div className={`h-24 w-1/3 rounded-xl ${darkMode ? 'bg-green-500/10 border border-white/5' : 'bg-white border border-zinc-200'}`}></div>
                                            <div className={`h-24 w-1/3 rounded-xl ${darkMode ? 'bg-violet-500/10 border border-white/5' : 'bg-white border border-zinc-200'}`}></div>
                                        </div>
                                        <div className={`h-48 rounded-xl w-full p-4 space-y-3 ${darkMode ? 'bg-zinc-900 border border-white/5' : 'bg-white border border-zinc-200'}`}>
                                            <div className="flex items-end gap-2 h-full pb-2">
                                                {[40, 70, 45, 90, 60, 80, 50, 75].map((h, i) => (
                                                    <div key={i} className={`w-full rounded-t-sm transition-all duration-1000 ${darkMode ? 'bg-indigo-500/60' : 'bg-indigo-400'}`} style={{ height: `${h}%`, opacity: 0.5 + (i * 0.05) }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements for depth */}
                        <div className={`absolute -right-6 top-20 p-4 rounded-xl border shadow-xl animate-float-slow backdrop-blur-md ${darkMode ? 'bg-zinc-900/80 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                                <div>
                                    <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Skill Acquired</div>
                                    <div className="text-xs text-zinc-500">React Native</div>
                                </div>
                            </div>
                        </div>

                        <div className={`absolute -left-4 bottom-32 p-4 rounded-xl border shadow-xl animate-float-delayed backdrop-blur-md ${darkMode ? 'bg-zinc-900/80 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500">AI</div>
                                <div>
                                    <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>New Path Unlocked</div>
                                    <div className="text-xs text-zinc-500">Senior Architect</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
