import React from 'react';
import Profile3DCard from './Profile3DCard';

interface ProfileHeaderProps {
    darkMode: boolean;
    name: string;
    photo: string | null;
    getInitials: (name: string) => string;
    stats: {
        skillsCount: number;
        milestonesCompleted: number;
        applicationsTracked: number;
        currentFocus: string | null;
    };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ darkMode, name, photo, getInitials, stats }) => {
    return (
        <div className="mb-12 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-10">
            {/* Left Column: Text & Stats */}
            <div className="w-full lg:w-1/2 space-y-8 animate-fade-in-up flex flex-col items-center lg:items-center">
                <div className="text-center">
                    <h1 className={`text-3xl md:text-5xl font-bold mb-3 tracking-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                        Welcome back, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                            {name}
                        </span>
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-zinc-400' : 'text-zinc-600'} max-w-md mx-auto`}>
                        {stats.currentFocus ? (
                            <>
                                Your learning journey is on track. You're currently focusing on <span className="font-semibold text-indigo-500">{stats.currentFocus}</span>.
                            </>
                        ) : (
                            "Upload your resume to unlock your personalized career path."
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 w-full">
                    <div className={`flex-1 min-w-[140px] px-6 py-4 rounded-2xl border transition-transform hover:scale-105 ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} backdrop-blur-sm shadow-sm flex flex-col items-center`}>
                        <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{stats.skillsCount}</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold mt-1 ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Skills Identified</div>
                    </div>
                    <div className={`flex-1 min-w-[140px] px-6 py-4 rounded-2xl border transition-transform hover:scale-105 ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} backdrop-blur-sm shadow-sm flex flex-col items-center`}>
                        <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{stats.milestonesCompleted}</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold mt-1 ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Milestones Done</div>
                    </div>
                    <div className={`flex-1 min-w-[140px] px-6 py-4 rounded-2xl border transition-transform hover:scale-105 ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} backdrop-blur-sm shadow-sm flex flex-col items-center`}>
                        <div className={`text-3xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.applicationsTracked}</div>
                        <div className={`text-xs uppercase tracking-wider font-semibold mt-1 ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Jobs Applied</div>
                    </div>
                </div>
            </div>

            {/* Right Column: 3D Identity Card */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end animate-float-slow p-4">
                <Profile3DCard
                    name={name}
                    photo={photo}
                    getInitials={getInitials}
                    role={stats.currentFocus || "Awaiting Assignment"}
                    level={`Level ${Math.floor(stats.skillsCount / 5) + 1}`}
                />
            </div>
        </div>
    );
};

export default ProfileHeader;
