import React from 'react';
import ScrollReveal from './ScrollReveal';

interface CallToActionProps {
    darkMode: boolean;
}

const CallToAction: React.FC<CallToActionProps> = ({ darkMode }) => {
    return (
        <section className="py-12 md:py-24 relative overflow-hidden">
            <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
                <ScrollReveal animation="scale-in">
                    <div className={`rounded-3xl p-8 md:p-20 relative overflow-hidden border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-2xl`}>
                        {/* Background decoration */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                            <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] bg-indigo-500/20 blur-[120px] rounded-full mix-blend-multiply filter"></div>
                            <div className="absolute -bottom-[50%] -right-[20%] w-[80%] h-[150%] bg-purple-500/20 blur-[120px] rounded-full mix-blend-multiply filter"></div>
                        </div>

                        <div className="relative z-10">
                            <h2 className={`text-4xl md:text-6xl font-black tracking-tight mb-8 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                                Ready to Shape Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Future Career?</span>
                            </h2>
                            <p className={`text-xl mb-10 max-w-2xl mx-auto ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                Join Educat-AI today and experience the personalized learning journey that adapts to your goals and pace.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="/register"
                                    className="px-8 py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-1 w-full sm:w-auto"
                                >
                                    Get Started for Free
                                </a>
                                <a
                                    href="/login"
                                    className={`px-8 py-4 rounded-xl font-bold border transition-all duration-300 w-full sm:w-auto ${darkMode ? 'border-zinc-700 hover:bg-zinc-800 text-white' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-900'}`}
                                >
                                    Learn More
                                </a>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default CallToAction;
