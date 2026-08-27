import React, { useState, useEffect } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import RoadmapNavbar from '../components/roadmap-components/RoadmapNavbar';
import Roadmap3D from '../components/roadmap-components/Roadmap3D';
import RoadmapPath from '../components/roadmap-components/RoadmapPath';
import { getCurrentRoadmap, regenerateRoadmap } from '../services/agentService';

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

const Roadmap: React.FC = () => {
    const { darkMode, toggleTheme } = useThemeContext();
    const { user } = useAuth();
    const [nodes, setNodes] = useState<RoadmapNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoadmap = async () => {
        if (!user?.$id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getCurrentRoadmap(user.$id);
            if (data && data.milestones) {
                // Map backend data to RoadmapNode
                const mappedNodes: RoadmapNode[] = data.milestones.map((step: any, index: number) => ({
                    id: (index + 1).toString(),
                    title: step.title,
                    status: step.status?.toLowerCase() || (index === 0 ? 'current' : 'locked'),
                    description: step.description,
                    position: { x: (index % 2 === 0 ? 50 : (index % 4 === 1 ? 20 : 80)), y: 10 + (index * 20) }, // Simple zigzag layout logic
                    details: {
                        topics: step.skills_to_learn || [],
                        estimatedDuration: `${step.estimated_hours || 20} hours`,
                        skillsGained: step.skills_to_learn || []
                    }
                }));
                setNodes(mappedNodes);
            } else {
                // If no roadmap exists, maybe trigger generation or show empty
                setNodes([]); // Or fallbackNodes if you prefer
            }
        } catch (err) {
            console.error("Failed to fetch roadmap:", err);
            setError("Could not load your roadmap.");
            // setNodes(fallbackNodes); // Optional fallback
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        if (!user?.$id) return;
        setIsRegenerating(true);
        try {
            await regenerateRoadmap(user.$id);
            await fetchRoadmap(); // Refetch after geneation
        } catch (err) {
            console.error("Failed to regenerate roadmap:", err);
            setError("Failed to generate new roadmap.");
        } finally {
            setIsRegenerating(false);
        }
    };

    useEffect(() => {
        if (user?.$id) {
            fetchRoadmap();
        }
    }, [user?.$id]);

    return (
        <div className={`min-h-screen font-sans transition-all duration-700 ease-in-out ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
            <RoadmapNavbar darkMode={darkMode} toggleTheme={toggleTheme} />

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 relative">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Learning Journey</h1>
                    <p className={`text-lg ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Track your progress and see what's next on your path to mastery.</p>

                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating || loading}
                        className={`mt-6 px-6 py-2 rounded-full font-medium transition-all ${isRegenerating ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'} ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200'} shadow-lg`}
                    >
                        {isRegenerating ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Regenerating with AI...
                            </span>
                        ) : 'Regenerate Roadmap'}
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">
                        <p>{error}</p>
                        <button onClick={fetchRoadmap} className="mt-4 text-indigo-500 hover:underline">Try Again</button>
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl mb-4">No roadmap found.</p>
                        <button onClick={handleRegenerate} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all">
                            Generate My Roadmap
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop 3D Map */}
                        <div className="hidden lg:block mb-12">
                            <Roadmap3D nodes={nodes} />
                        </div>

                        {/* Mobile/Tablet List View */}
                        <div className="lg:hidden">
                            <RoadmapPath nodes={nodes} darkMode={darkMode} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Roadmap;
