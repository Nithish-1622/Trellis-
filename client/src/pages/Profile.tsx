import React, { useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import BackgroundGradients from '../components/landing-page-components/BackgroundGradients';
import ProfileNavbar from '../components/profile-components/ProfileNavbar';
import ProfileHeader from '../components/profile-components/ProfileHeader';
import DashboardOverview from '../components/profile-components/DashboardOverview';
import CourseExplorer from '../components/profile-components/CourseExplorer';
import ProfileSettings from '../components/profile-components/ProfileSettings';

import { useAuth } from '../contexts/AuthContext';
import { getMemorySummary } from '../services/agentService';

const Profile: React.FC = () => {
    const { darkMode, toggleTheme } = useThemeContext();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'settings'>('overview');

    // Profile State (Shared across Navbar, Header, Settings)
    const [name, setName] = useState(user?.name || 'John Doe');
    const [email, setEmail] = useState(user?.email || 'john@example.com');
    const [bio, setBio] = useState('Passionate learner exploring the world of technology.');

    // Dynamic Stats State
    const [stats, setStats] = useState<{
        skillsCount: number;
        milestonesCompleted: number;
        applicationsTracked: number;
        currentFocus: string | null;
    }>({
        skillsCount: 0,
        milestonesCompleted: 0,
        applicationsTracked: 0,
        currentFocus: null
    });

    React.useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);

            // Fetch stats
            getMemorySummary(user.$id).then(data => {
                setStats({
                    skillsCount: data.skills?.length || 0,
                    milestonesCompleted: data.completed_milestones || 0,
                    applicationsTracked: data.total_applications || 0,
                    currentFocus: data.current_focus // Allow null
                });
                if (data.resume_filename) {
                    setResumeName(data.resume_filename);
                }
            }).catch(err => console.error("Failed to fetch profile stats:", err));
        }
    }, [user]);

    const [photo, setPhoto] = useState<string | null>(null);
    const [resumeName, setResumeName] = useState<string | null>(null);

    const getInitials = (n: string) => {
        return n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className={`min-h-screen font-sans transition-all duration-700 ease-in-out relative flex flex-col ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
            <BackgroundGradients />

            <ProfileNavbar
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                photo={photo}
                name={name}
                getInitials={getInitials}
            />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-24 md:py-28 relative z-10">
                <ProfileHeader
                    darkMode={darkMode}
                    name={name}
                    photo={photo}
                    getInitials={getInitials}
                    stats={stats}
                />

                {/* Content Tabs */}
                {activeTab === 'overview' && (
                    <DashboardOverview
                        darkMode={darkMode}
                        resumeName={resumeName}
                        setResumeName={setResumeName}
                    />
                )}

                {activeTab === 'courses' && <CourseExplorer darkMode={darkMode} />}

                {activeTab === 'settings' && (
                    <ProfileSettings
                        darkMode={darkMode}
                        name={name} setName={setName}
                        email={email} setEmail={setEmail}
                        bio={bio} setBio={setBio}
                        photo={photo} setPhoto={setPhoto}
                        resumeName={resumeName} setResumeName={setResumeName}
                        getInitials={getInitials}
                    />
                )}
            </main>

            {/* Floating Action Buttons Stack */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3 items-end">
                {/* Mint Skills Button - Global */}
                <Link to="/nft" className={`group relative flex items-center gap-3 pl-5 pr-5 py-1.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-zinc-900/80 border-zinc-700 text-white hover:bg-zinc-800' : 'bg-white/80 border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}>
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-sm font-bold tracking-wide">Mint Skills</span>
                        <span className="text-[10px] text-indigo-500 font-medium">Web3 Verified</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20 group-hover:shadow-indigo-500/50 transition-shadow">
                        <span className="text-xl">💎</span>
                    </div>
                </Link>

                {/* Practice Interview Button */}
                <Link to="/practice" className={`group relative flex items-center gap-3 pl-5 pr-5 py-1.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-zinc-900/80 border-zinc-700 text-white hover:bg-zinc-800' : 'bg-white/80 border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}>
                    <span className="text-sm font-bold tracking-wide">Practice Interview</span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20 group-hover:shadow-emerald-500/50 transition-shadow">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                </Link>

                {/* Chat Button */}
                <Link to="/chat" className={`group relative flex items-center gap-3 pl-5 pr-5 py-1.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-zinc-900/80 border-zinc-700 text-white hover:bg-zinc-800' : 'bg-white/80 border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}>
                    <span className="text-sm font-bold tracking-wide">Educat-AI</span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20 group-hover:shadow-indigo-500/50 transition-shadow">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                </Link>
            </div>
        </div>
    );
}

export default Profile;
