import React, { useState } from 'react';
import ScrollReveal from './ScrollReveal';

interface InteractiveRoadmapProps {
    darkMode: boolean;
}

const steps = [
    {
        id: 1,
        title: 'Input Goals',
        icon: '🎯',
        desc: 'Define your career aspirations and current skill level.',
        details: 'Our AI analyzes millions of job descriptions to understand exactly what the market demands for your dream role.'
    },
    {
        id: 2,
        title: 'AI Analysis',
        icon: '🧠',
        desc: 'Our engine constructs a personalized graph.',
        details: 'We identify skill gaps and create a bridging strategy using optimal learning resources tailored to your style.'
    },
    {
        id: 3,
        title: 'Generate Path',
        icon: '🗺️',
        desc: 'Receive a step-by-step verifiable roadmap.',
        details: 'Your roadmap is dynamic. As you verify skills on-chain, the AI adapts future nodes to keep you on the fastest track.'
    },
    {
        id: 4,
        title: 'Earn & Verify',
        icon: '🏆',
        desc: 'Complete milestones and mint proof of skill.',
        details: 'Turn your learning into a verifiable on-chain resume that employers trust more than a PDF.'
    }
];

const InteractiveRoadmap: React.FC<InteractiveRoadmapProps> = ({ darkMode }) => {
    const [activeStep, setActiveStep] = useState(1);

    return (
        <section className={`py-20 relative border-y ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className='max-w-7xl mx-auto px-6 lg:px-8'>
                <ScrollReveal animation="fade-in-up">
                    <div className='text-center mb-16'>
                        <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                            How <span className="text-indigo-500">EducatAI</span> Works
                        </h2>
                        <p className={`max-w-2xl mx-auto text-lg ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            A continuous loop of improvements for your career.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Steps Navigation */}
                <div className='relative mb-12'>
                    {/* Connecting Line */}
                    <div className='absolute top-1/2 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 hidden md:block rounded-full'></div>
                    <div
                        className='absolute top-1/2 left-0 h-1 bg-indigo-500 transition-all duration-500 ease-in-out -translate-y-1/2 hidden md:block rounded-full'
                        style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>

                    <div className='grid grid-cols-1 md:grid-cols-4 gap-8 relative'>
                        {steps.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveStep(step.id)}
                                className={`group relative flex flex-col items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${activeStep === step.id ? 'scale-105' : 'hover:-translate-y-1'}`}
                            >
                                <div
                                    className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all duration-500 ${activeStep >= step.id
                                        ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                                        : darkMode
                                            ? 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                                            : 'bg-white text-zinc-400 border border-zinc-200 group-hover:border-indigo-200 group-hover:text-indigo-500'
                                        }`}
                                >
                                    {step.icon}
                                    {activeStep === step.id && (
                                        <span className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-pulse"></span>
                                    )}
                                </div>
                                <h3 className={`font-bold transition-colors ${activeStep === step.id ? (darkMode ? 'text-white' : 'text-zinc-900') : (darkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-indigo-600')}`}>
                                    {step.title}
                                </h3>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Content Card */}
                <div className='max-w-4xl mx-auto'>
                    <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 transition-all duration-500 border shadow-2xl ${darkMode ? 'bg-zinc-950 border-white/10 shadow-black/50' : 'bg-white border-zinc-100 shadow-zinc-200/50'}`}>
                        {/* Background blobs */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className={`inline-block px-4 py-1 rounded-full text-xs font-bold mb-6 tracking-wide uppercase ${darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                                    Step 0{activeStep}
                                </div>
                                <h3 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                                    {steps[activeStep - 1].title}
                                </h3>
                                <p className={`text-lg leading-relaxed mb-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                    {steps[activeStep - 1].desc}
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    {steps[activeStep - 1].details}
                                </p>
                            </div>

                            {/* Visual Representation */}
                            <div className={`aspect-video rounded-2xl flex items-center justify-center p-8 border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                                {/* Simple animated visual depending on step */}
                                {activeStep === 1 && (
                                    <div className="flex gap-2">
                                        <div className="w-4 h-16 bg-indigo-500 rounded-full animate-pulse"></div>
                                        <div className="w-4 h-24 bg-indigo-400 rounded-full animate-pulse animation-delay-200"></div>
                                        <div className="w-4 h-12 bg-indigo-600 rounded-full animate-pulse animation-delay-400"></div>
                                    </div>
                                )}
                                {activeStep === 2 && (
                                    <div className="relative w-32 h-32">
                                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-spin-slow"></div>
                                        <div className="absolute inset-4 border-4 border-violet-500/40 rounded-full animate-spin-reverse"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-4xl">🧠</div>
                                    </div>
                                )}
                                {activeStep === 3 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                        <div className="w-12 h-1 bg-indigo-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                        <div className="w-12 h-1 bg-indigo-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></div>
                                    </div>
                                )}
                                {activeStep === 4 && (
                                    <div className="text-center">
                                        <div className="text-5xl mb-2 animate-bounce">📜</div>
                                        <div className="text-xs font-mono bg-zinc-800 text-green-400 px-2 py-1 rounded">0x71...A39</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InteractiveRoadmap;
