import React from 'react';

interface RoadmapNode {
    id: string;
    title: string;
    status: 'completed' | 'current' | 'locked';
    description: string;
    position: { x: number; y: number };
}

interface RoadmapPathProps {
    nodes: RoadmapNode[];
    darkMode: boolean;
}

const RoadmapPath: React.FC<RoadmapPathProps> = ({ nodes, darkMode }) => {
    return (
        <div className="relative max-w-3xl mx-auto">
            {/* Connection Line */}
            <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                <div className="absolute top-0 left-0 w-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ height: '65%' }}></div>
            </div>

            <div className="space-y-12 relative z-10">
                {nodes.map((node, index) => (
                    <div
                        key={node.id}
                        className={`flex items-center gap-8 flex-row`}
                    >
                        {/* Left Side (for alignment on desktop) */}
                        <div className="flex-1 hidden md:block text-right">
                            {index % 2 === 0 && (
                                <div className={`inline-block p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl ${node.status === 'current'
                                    ? (darkMode ? 'bg-zinc-900 border-indigo-500 shadow-indigo-500/10' : 'bg-white border-indigo-500 shadow-indigo-500/10')
                                    : (darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200')
                                    }`}>
                                    <h3 className={`font-bold mb-1 ${node.status === 'current' ? 'text-indigo-500' : ''}`}>{node.title}</h3>
                                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{node.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Center Node */}
                        <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-4 shrink-0 transition-transform hover:scale-110 z-20 ${node.status === 'completed' ? 'bg-indigo-500 border-indigo-500 text-white' :
                            node.status === 'current' ? 'bg-white dark:bg-zinc-900 border-indigo-500 text-indigo-500 ring-4 ring-indigo-500/20' :
                                (darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-600' : 'bg-zinc-100 border-zinc-300 text-zinc-400')
                            }`}>
                            {node.status === 'completed' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <span className="font-bold text-sm">{index + 1}</span>
                            )}
                        </div>

                        {/* Right Side */}
                        <div className="flex-1 md:text-left">
                            {index % 2 !== 0 ? (
                                <div className={`inline-block p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl ${node.status === 'current'
                                    ? (darkMode ? 'bg-zinc-900 border-indigo-500 shadow-indigo-500/10' : 'bg-white border-indigo-500 shadow-indigo-500/10')
                                    : (darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200')
                                    }`}>
                                    <h3 className={`font-bold mb-1 ${node.status === 'current' ? 'text-indigo-500' : ''}`}>{node.title}</h3>
                                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{node.description}</p>
                                </div>
                            ) : (
                                /* Mobile Only Content for Even Nodes */
                                <div className={`md:hidden inline-block p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl ${node.status === 'current'
                                    ? (darkMode ? 'bg-zinc-900 border-indigo-500 shadow-indigo-500/10' : 'bg-white border-indigo-500 shadow-indigo-500/10')
                                    : (darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200')
                                    }`}>
                                    <h3 className={`font-bold mb-1 ${node.status === 'current' ? 'text-indigo-500' : ''}`}>{node.title}</h3>
                                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{node.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoadmapPath;
