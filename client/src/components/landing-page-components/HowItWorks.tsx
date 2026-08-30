import React from 'react';
import { howItWorksSteps, badges } from '../../data/landingPageData';
import ScrollReveal from './ScrollReveal';

interface HowItWorksProps {
    darkMode: boolean;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ darkMode }) => {
    return (
        <section id="how-it-works" className={`py-16 md:py-32 ${darkMode ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
            <div className='max-w-7xl mx-auto px-6 lg:px-8'>
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <ScrollReveal animation="slide-in-left" className="order-2 lg:order-1 relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-[2rem] blur-xl opacity-30"></div>
                        <div className={`relative border rounded-[2rem] p-8 md:p-12 space-y-8 ${darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200 shadow-xl'}`}>
                            {howItWorksSteps.map((item, i) => (
                                <div key={i} className="flex items-start gap-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 shadow-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
                                        {item.step}
                                    </div>
                                    <div>
                                        <h4 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{item.title}</h4>
                                        <p className={`${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>

                    <ScrollReveal animation="slide-in-right" delay={200} className="order-1 lg:order-2 text-center md:text-left lg:text-center">
                        <h2 className={`text-3xl lg:text-5xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Intelligence meets <br /> infrastructure.</h2>
                        <p className={`text-lg leading-relaxed mb-8 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            Traditional learning platforms are disconnected from industry needs. We bridge the gap by combining real-time market data with your personal capabilities.
                        </p>
                        <div className="flex gap-4 justify-center md:justify-start lg:justify-center">
                            {badges.map((badge) => (
                                <div key={badge} className={`px-6 py-3 rounded-xl border text-sm font-medium ${darkMode ? 'bg-white/[0.05] border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm'}`}>
                                    {badge}
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
