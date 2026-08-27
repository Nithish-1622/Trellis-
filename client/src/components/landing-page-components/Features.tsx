import React from 'react';
import { features } from '../../data/landingPageData';
import ScrollReveal from './ScrollReveal';

interface FeaturesProps {
    darkMode: boolean;
}


const Features: React.FC<FeaturesProps> = ({ darkMode }) => {
    return (
        <section id="features" className='py-16 md:py-32 relative'>
            <div className='max-w-7xl mx-auto px-6 lg:px-8'>
                <ScrollReveal animation="fade-in-up">
                    <div className='mb-20 text-center'>
                        <h2 className={`text-3xl lg:text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>The future of <br className="hidden md:block" /> professional growth.</h2>
                        <div className="w-24 h-1.5 bg-indigo-500 rounded-full mx-auto"></div>
                    </div>
                </ScrollReveal>

                <div className='grid md:grid-cols-3 gap-8'>
                    {features.map((feature, i) => (
                        <ScrollReveal key={i} animation="fade-in-up" delay={i * 100} className="h-full">
                            <div
                                className={`group p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 h-full flex flex-col items-center text-center ${darkMode ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10' : 'bg-white border-zinc-100 shadow-xl shadow-zinc-200/40 hover:shadow-2xl hover:shadow-zinc-200/50'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {feature.icon}
                                </div>
                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{feature.title}</h3>
                                <p className={`leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{feature.desc}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
