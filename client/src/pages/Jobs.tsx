import React, { useState, useEffect } from 'react';
import { useThemeContext } from '../hooks/useThemeContext';
import { useAuth } from '../hooks/useAuth';
import BackgroundGradients from '../components/landing-page-components/BackgroundGradients';
import Jobs3DVisual from '../components/jobs-components/Jobs3DVisual';
import { getRecommendedJobs } from '../services/careerService';
import type { SalaryRange } from '../services/careerService';

const logoColors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-indigo-500 to-blue-500',
    'from-red-500 to-orange-500',
    'from-violet-500 to-purple-500',
    'from-orange-400 to-amber-500',
    'from-slate-500 to-zinc-500',
    'from-pink-500 to-rose-500',
    'from-blue-400 to-green-400',
    'from-green-500 to-emerald-500',
    'from-rose-500 to-pink-500',
];

const getLogoColor = (index: number) => logoColors[index % logoColors.length];

const formatSalary = (salaryRange?: SalaryRange) => {
    if (!salaryRange || (!salaryRange.min && !salaryRange.max)) return 'Competitive';
    const formatK = (num: number) => `$${Math.round(num / 1000)}k`;
    if (salaryRange.min && salaryRange.max) {
        return `${formatK(salaryRange.min)} - ${formatK(salaryRange.max)}`;
    }
    return formatK(salaryRange.min || salaryRange.max || 0);
};

const formatJobType = (jobType?: string): Job['type'] => {
    if (jobType === 'INTERN' || jobType === 'Internship') return 'Internship';
    if (jobType === 'CONTRACTOR' || jobType === 'Contract') return 'Contract';
    return 'Full-time';
};

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
    url?: string;
}

const Jobs: React.FC = () => {
    const { darkMode } = useThemeContext();
    const { user } = useAuth();
    const [filter, setFilter] = useState('Recommended');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    useEffect(() => {
        const fetchJobs = async () => {
            if (!user?.$id) return;

            try {
                setLoading(true);
                const data = await getRecommendedJobs();
                // Map API response to Job interface
                const mappedJobs: Job[] = data.items.map((job, index) => ({
                    id: job.id || index.toString(),
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    type: formatJobType(job.job_type),
                    salary: formatSalary(job.salary_range),
                    tags: (job.required_skills || []).slice(0, 3), // Take top 3 skills
                    posted: formatDate(job.posted_date),
                    matchScore: Math.round(job.match_score),
                    logoColor: getLogoColor(index),
                    url: job.url
                }));

                setJobs(mappedJobs);
            } catch (err: unknown) {
                console.error('Error fetching jobs:', err);
                setError('Failed to load job recommendations');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [user?.$id]);

    // Simple filtering logic (client-side for now)
    const filteredJobs = jobs.filter(job => {
        if (filter === 'Recommended') return true;
        if (filter === 'Newest') return job.posted.includes('Today') || job.posted.includes('hour') || job.posted.includes('mins');
        if (filter === 'Remote') return job.location.toLowerCase().includes('remote');
        if (filter === 'Internships') return job.type === 'Internship';
        return true;
    });

    return (
        <div className="relative flex flex-col font-sans">
            <BackgroundGradients />
            <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-12 md:px-6">
                {/* Header Section with 3D Visual */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
                    <div className="text-left md:w-1/2 animate-fade-in-up">
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Find your next <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                Breakthrough Role
                            </span>
                        </h1>
                        <p className={`text-lg max-w-xl leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            AI-powered matching based on your unique skill profile. We've curated these opportunities just for you.
                        </p>
                    </div>

                    <div className="w-full md:w-1/2 h-[400px] flex items-center justify-center animate-fade-in">
                        <Jobs3DVisual darkMode={darkMode} />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 animate-fade-in-up">
                    {['Recommended', 'Newest', 'Remote', 'Internships'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${filter === f
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : (darkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200')
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Loading / Error States */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {error && (
                    <div className="text-center py-10 text-red-500">
                        {error}
                    </div>
                )}

                {/* Jobs List */}
                {!loading && !error && (
                    <div className="space-y-4">
                        {filteredJobs.length === 0 ? (
                            <div className={`text-center py-10 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                No jobs found for this filter.
                            </div>
                        ) : (
                            filteredJobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${darkMode
                                        ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                                        : 'bg-white border-zinc-200 hover:border-indigo-200 hover:shadow-indigo-500/5'
                                        } animate-fade-in-up`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${job.logoColor} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                                                {job.company.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-bold mb-1 group-hover:text-indigo-500 transition-colors ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                    {job.url ? (
                                                        <a href={job.url} target="_blank" rel="noopener noreferrer">{job.title}</a>
                                                    ) : job.title}
                                                </h3>
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
                                                <span className={`text-sm font-semibold ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{job.posted}</span>
                                            </div>
                                            {job.url ? (
                                                <a href={job.url} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 shadow-lg shadow-indigo-600/20 text-center">
                                                    Apply Now
                                                </a>
                                            ) : (
                                                <button className="w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                                                    Apply Now
                                                </button>
                                            )}
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
                            )))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Jobs;
