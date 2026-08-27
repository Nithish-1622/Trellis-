import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { parseResume } from '../../services/agentService';
import { storage } from '../../lib/appwrite';
// import { questions } from '../onboarding-components/OnboardingForm'; // Unused now

interface DashboardOverviewProps {
    darkMode: boolean;
    resumeName: string | null;
    setResumeName: (name: string | null) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ darkMode, resumeName, setResumeName }) => {
    const { user } = useAuth();

    return (
        <div className="animate-fade-in-up space-y-12 relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob pointer-events-none z-0"></div>
            <div className="absolute top-40 left-0 -ml-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob animation-delay-2000 pointer-events-none z-0"></div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">

                {/* Resume Upload Card */}
                <div className={`md:col-span-3 min-h-[400px] rounded-3xl p-12 border flex flex-col items-center justify-center gap-8 text-center transition-all hover:shadow-xl ${darkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-indigo-100'}`}>
                    <div className="flex flex-col items-center">
                        <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${darkMode ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Resume & CV</h3>
                        <p className={`text-lg max-w-lg mx-auto leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {resumeName ? (
                                <span>Currently uploaded: <span className="font-semibold text-indigo-500">{resumeName}</span>. <br />Ready for job applications.</span>
                            ) : (
                                'Upload your resume to unlock personalized job recommendations and career path adjustments.'
                            )}
                        </p>
                    </div>

                    <label className={`group cursor-pointer px-8 py-4 rounded-xl font-bold text-lg border transition-all flex items-center gap-3 hover:-translate-y-1 shadow-lg shadow-indigo-500/20 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent' : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'}`}>
                        <svg className="w-6 h-6 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>{resumeName ? 'Update Resume' : 'Upload New Resume'}</span>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    setResumeName(file.name);

                                    if (user && user.$id) {
                                        try {
                                            console.log("Uploading to Appwrite Storage...");
                                            try {
                                                const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;
                                                const uploadedFile = await storage.createFile(
                                                    bucketId,
                                                    'unique()',
                                                    file
                                                );
                                                console.log("File uploaded:", uploadedFile);

                                                console.log("Parsing resume with file ID...");
                                                const parsedData = await parseResume(user.$id, file, uploadedFile.$id);
                                                console.log("Parsed Resume Data:", parsedData);
                                            } catch (uploadError) {
                                                console.error("Appwrite upload failed:", uploadError);
                                                // Fallback to just parsing without ID if upload fails (or config missing)
                                                console.log("Falling back to parse only...");
                                                await parseResume(user.$id, file);
                                            }
                                        } catch (error) {
                                            console.error("Error parsing resume:", error);
                                        }
                                    } else {
                                        console.warn("User ID not available, skipping resume parsing.");
                                    }
                                }
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* Content Revealed After Upload */}
            {resumeName && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    {/* Jobs Card */}
                    <Link to="/jobs" className={`group relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-64 overflow-hidden ${darkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10' : 'bg-white border-zinc-200 hover:border-indigo-500 hover:shadow-indigo-500/10'}`}>
                        <div className="relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${darkMode ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Recommended Jobs</h3>
                            <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                View personalized job matches based on your resume and skills.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-indigo-500 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                            <span>Explore Opportunities</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                        <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${darkMode ? 'bg-indigo-500' : 'bg-indigo-400'}`}></div>
                    </Link>

                    {/* Roadmap Card */}
                    <Link to="/roadmap" className={`group relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-64 overflow-hidden ${darkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 hover:shadow-purple-500/10' : 'bg-white border-zinc-200 hover:border-purple-500 hover:shadow-purple-500/10'}`}>
                        <div className="relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${darkMode ? 'bg-zinc-800 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" /></svg>
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Learning Roadmap</h3>
                            <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                Track your progress and master new skills with your personalized path.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-purple-500 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                            <span>Continue Learning</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                        <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${darkMode ? 'bg-purple-500' : 'bg-purple-400'}`}></div>
                    </Link>

                    {/* Practice Interview Card */}
                    <Link to="/practice" className={`group relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between h-64 overflow-hidden ${darkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50 hover:shadow-emerald-500/10' : 'bg-white border-zinc-200 hover:border-emerald-500 hover:shadow-emerald-500/10'}`}>
                        <div className="relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${darkMode ? 'bg-zinc-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Practice Interview</h3>
                            <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                Master your technical interviews with AI-powered mock sessions and feedback.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-emerald-500 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                            <span>Start Practicing</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                        <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${darkMode ? 'bg-emerald-500' : 'bg-emerald-400'}`}></div>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default DashboardOverview;
