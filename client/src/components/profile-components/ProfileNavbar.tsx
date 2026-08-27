import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../landing-page-components/ThemeToggle';
import ecaiLogo from '../../assets/ecai.png';

interface ProfileNavbarProps {
    darkMode: boolean;
    toggleTheme: () => void;
    activeTab: 'overview' | 'courses' | 'settings';
    setActiveTab: (tab: 'overview' | 'courses' | 'settings') => void;
    photo: string | null;
    name: string;
    getInitials: (name: string) => string;
}

const ProfileNavbar: React.FC<ProfileNavbarProps> = ({
    darkMode,
    toggleTheme,
    activeTab,
    setActiveTab,
    photo,
    name,
    getInitials
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${darkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-zinc-200'}`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer">
                    <img src={ecaiLogo} alt="Educat-AI" className="h-8 w-auto" />
                    <span className={`font-bold text-xl tracking-tight hidden sm:block ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                        Educat<span className="text-indigo-500">AI</span>
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-1">
                        {['overview', 'courses'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 
                                    ${activeTab === tab
                                        ? (darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900')
                                        : (darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900')
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
                    <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/10 hidden md:flex hover:ring-indigo-400 transition-all duration-200"
                        >
                            {photo ? <img src={photo} alt="Profile" className="h-full w-full rounded-full object-cover" /> : getInitials(name)}
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 border transition-all duration-200 animate-fade-in-up ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                                <button
                                    onClick={() => {
                                        setActiveTab('settings');
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${darkMode ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                                    Settings
                                </button>
                                <div className={`h-px mx-1 my-1 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}></div>
                                <button
                                    onClick={handleLogout}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${darkMode ? 'text-red-400 hover:bg-zinc-800' : 'text-red-500 hover:bg-zinc-50'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className='md:hidden p-2 rounded-lg transition-colors'
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={darkMode ? "white" : "black"} className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={darkMode ? "white" : "black"} className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className={`px-6 pt-2 pb-6 space-y-4 border-t ${darkMode ? 'bg-zinc-950/95 border-white/5' : 'bg-white/95 border-zinc-200'}`}>
                    {['overview', 'courses', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab as any);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`block w-full text-left text-base font-medium py-2 transition-colors capitalize ${activeTab === tab
                                ? (darkMode ? 'text-white' : 'text-zinc-900')
                                : (darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-indigo-600')}`}
                        >
                            {tab}
                        </button>
                    ))}
                    <div className={`h-px w-full ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                    <button
                        onClick={handleLogout}
                        className={`block w-full text-left text-base font-medium py-2 transition-colors text-red-500 hover:text-red-600`}
                    >
                        Log out
                    </button>
                </div>
            </div>
        </nav >
    );
};

export default ProfileNavbar;
