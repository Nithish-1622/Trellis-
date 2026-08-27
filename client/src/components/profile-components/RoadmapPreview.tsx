import React from 'react';
import RoadmapPath from '../roadmap-components/RoadmapPath';
import { Link } from 'react-router-dom';

interface RoadmapNode {
    id: string;
    title: string;
    status: 'completed' | 'current' | 'locked';
    description: string;
    position: { x: number; y: number };
}

interface RoadmapPreviewProps {
    darkMode: boolean;
}

const RoadmapPreview: React.FC<RoadmapPreviewProps> = ({ darkMode }) => {

    const nodes: RoadmapNode[] = [
        {
            id: '1',
            title: 'Python Basics',
            status: 'completed',
            description: 'Mastering syntax, loops, and functions.',
            position: { x: 50, y: 10 },
        },
        {
            id: '2',
            title: 'Data Structures',
            status: 'completed',
            description: 'Lists, dictionaries, sets, and tuples.',
            position: { x: 50, y: 30 },
        },
        {
            id: '3',
            title: 'Calculus for ML',
            status: 'completed',
            description: 'Derivatives, gradients, and optimization.',
            position: { x: 50, y: 50 },
        },
        {
            id: '4',
            title: 'Intro to AI',
            status: 'current',
            description: 'History, agents, and basic search algorithms.',
            position: { x: 50, y: 70 },
        },
        {
            id: '5',
            title: 'Neural Networks',
            status: 'locked',
            description: 'Perceptrons, backpropagation, and layers.',
            position: { x: 20, y: 90 },
        },
        {
            id: '6',
            title: 'Computer Vision',
            status: 'locked',
            description: 'CNNs, image processing, and detection.',
            position: { x: 80, y: 90 },
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Your Roadmap</h2>
                <Link to="/roadmap" className="text-indigo-500 hover:text-indigo-600 font-semibold text-sm">View Full Roadmap &rarr;</Link>
            </div>
            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <RoadmapPath nodes={nodes} darkMode={darkMode} />
            </div>
        </div>
    );
};

export default RoadmapPreview;
