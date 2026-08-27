import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';

interface RoadmapNode {
    id: string;
    title: string;
    status: 'completed' | 'current' | 'locked';
    description: string;
    position: { x: number; y: number };
    performance?: { score: number; grade: string; summary: string };
    details?: {
        topics: string[];
        estimatedDuration: string;
        skillsGained: string[];
    };
}

interface Roadmap3DProps {
    nodes: RoadmapNode[];
}

const Roadmap3D: React.FC<Roadmap3DProps> = ({ nodes }) => {
    const { darkMode } = useThemeContext();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Track mouse for subtle parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="relative w-full min-h-screen flex justify-center perspective-2000 overflow-x-hidden">

            {/* --- CENTER: 3D ROADMAP --- */}
            <div
                className="w-full max-w-4xl px-6 relative z-10 pb-64 transform-style-3d transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateX(10deg) rotateY(${mousePos.x * 0.2}deg)`,
                }}
            >
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-transparent"></div>

                <div className="space-y-24 mt-20 relative transform-style-3d">
                    {nodes.map((node, index) => {
                        const isEven = index % 2 === 0;
                        const isCompleted = node.status === 'completed';
                        const isCurrent = node.status === 'current';
                        const isHovered = hoveredNode === node.id;

                        // 3D Pop Effect
                        const zTranslate = isHovered ? '30px' : '0px';
                        const scale = isHovered ? 1.05 : 1;

                        return (
                            <div
                                key={node.id}
                                className={`relative flex items-center justify-center transform-style-3d transition-all duration-500 ease-out`}
                                style={{
                                    transform: `translateZ(${zTranslate}) scale(${scale})`,
                                }}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                {/* Connector Line to Main Spine */}
                                <div className={`absolute top-1/2 left-1/2 w-[50%] h-0.5 -translate-y-1/2 transform-style-3d -z-10
                                    ${isEven ? '-translate-x-full origin-right' : 'origin-left'}
                                    ${darkMode ? 'bg-zinc-800' : 'bg-zinc-300'}
                                    group-hover:bg-indigo-500 transition-colors duration-300
                                `}></div>

                                {/* Content Card */}
                                <div className={`w-[45%] transform-style-3d
                                    ${isEven ? '-mr-[50%]' : '-ml-[50%]'}
                                `}>
                                    <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden backdrop-blur-sm
                                        ${isCompleted
                                            ? (darkMode ? 'bg-zinc-900/90 border-indigo-500/40' : 'bg-white/90 border-indigo-200')
                                            : isCurrent
                                                ? (darkMode ? 'bg-zinc-800 border-indigo-500 ring-2 ring-indigo-500/50' : 'bg-white border-indigo-500 ring-2 ring-indigo-500/30')
                                                : (darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                                        }
                                        transition-all duration-300 group hover:shadow-2xl hover:shadow-indigo-500/20
                                    `}>
                                        {/* 3D Layer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded
                                                ${isCompleted ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-500/20 text-zinc-500'}
                                            `}>
                                                Step 0{index + 1}
                                            </span>
                                            {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>}
                                        </div>

                                        <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{node.title}</h3>
                                        <div className="relative group/card-content">
                                            {/* Description container with smoother height transition */}
                                            <div className={`transition-all duration-300 ease-in-out ${isHovered ? 'max-h-48' : 'max-h-12 overflow-hidden'}`}>
                                                <p className={`text-sm leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                    {node.description}
                                                </p>
                                            </div>

                                            {/* Skills section - Animate opacity/transform instead of layout */}
                                            <div className={`
                                                mt-4 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700
                                                transition-all duration-300 ease-out origin-top
                                                ${isHovered
                                                    ? 'opacity-100 translate-y-0 scale-100 max-h-40'
                                                    : 'opacity-0 -translate-y-2 scale-95 max-h-0 overflow-hidden'
                                                }
                                            `}>
                                                {node.details && (
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Skills to gain:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {node.details.skillsGained.slice(0, 4).map((skill, i) => (
                                                                <span key={i} className={`text-[10px] px-2 py-1 rounded font-medium ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Central Node marker */}
                                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 z-20 shadow-[0_0_15px_rgba(99,102,241,0.5)]
                                    ${isCompleted ? 'bg-indigo-500 border-indigo-900' : 'bg-zinc-900 border-zinc-700'}
                                `}></div>

                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default Roadmap3D;
