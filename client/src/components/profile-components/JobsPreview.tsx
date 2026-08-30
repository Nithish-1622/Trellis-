import React from 'react';
import { Link } from 'react-router-dom';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    type: 'Full-time' | 'Contract' | 'Internship';
    salary: string;
    tags: string[];
    posted: string;
    matchScore: number;
    logoColor: string;
}

interface JobsPreviewProps {
    darkMode: boolean;
}

const JobsPreview: React.FC<JobsPreviewProps> = ({ darkMode }) => {

    // Condensed data for preview
    const jobs: Job[] = [
        {
            id: '1',
            title: 'Senior AI Engineer',
            company: 'NeuroTech Solutions',
            location: 'San Francisco, CA (Remote)',
            type: 'Full-time',
            salary: '$160k - $210k',
            tags: ['Python', 'PyTorch', 'System Design'],
            posted: '2 days ago',
            matchScore: 98,
            logoColor: 'from-blue-500 to-cyan-500'
        },
        {
            id: '2',
            title: 'Machine Learning Researcher',
            company: 'DeepMind',
            location: 'London, UK',
            type: 'Full-time',
            salary: '$180k - $250k',
            tags: ['TensorFlow', 'Research', 'Math'],
            posted: '5 hours ago',
            matchScore: 95,
            logoColor: 'from-purple-500 to-pink-500'
        },
        {
            id: '3',
            title: 'AI Product Manager',
            company: 'OpenAI',
            location: 'San Francisco, CA',
            type: 'Full-time',
            salary: '$190k - $240k',
            tags: ['Product', 'Strategy', 'LLMs'],
            posted: '1 day ago',
            matchScore: 92,
            logoColor: 'from-emerald-500 to-teal-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Recommended Jobs</h2>
                <Link to="/jobs" className="text-indigo-500 hover:text-indigo-600 font-semibold text-sm">View All Jobs &rarr;</Link>
            </div>

            <div className="space-y-4">
                {jobs.map((job) => (
                    <div
                        key={job.id}
                        className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${darkMode
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                            : 'bg-white border-zinc-200 hover:border-indigo-200 hover:shadow-indigo-500/5'
                            }`}
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${job.logoColor} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                                    {job.company.charAt(0)}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 group-hover:text-indigo-500 transition-colors ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{job.title}</h3>
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className={`font-medium ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{job.company}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                                        <span className={`${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{job.location}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        {job.matchScore}% Match
                                    </span>
                                </div>
                                <button className="w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                                    Apply Now
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {job.tags.map((tag, i) => (
                                <span key={i} className={`px-3 py-1 rounded-lg text-xs font-medium border ${darkMode
                                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                                    : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                                    }`}>
                                    {tag}
                                </span>
                            ))}
                            <span className={`ml-auto font-mono font-medium ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                {job.salary}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobsPreview;
