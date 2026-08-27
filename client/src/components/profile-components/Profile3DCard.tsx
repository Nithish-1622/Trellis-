import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';

interface Profile3DCardProps {
    name: string;
    photo: string | null;
    role?: string;
    level?: string;
    getInitials: (name: string) => string;
}

const Profile3DCard: React.FC<Profile3DCardProps> = ({ name, photo, role = "Computer Science Student", level = "Level 4", getInitials }) => {
    const { darkMode } = useThemeContext();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Only enable 3D tilt interaction on desktop
        if (window.matchMedia("(max-width: 768px)").matches) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = document.getElementById('profile-3d-card')?.getBoundingClientRect();
            if (rect) {
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                setMousePosition({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
            }
        };

        const cardElement = document.getElementById('profile-3d-card');
        cardElement?.addEventListener('mousemove', handleMouseMove);

        return () => {
            cardElement?.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const resetPosition = () => setMousePosition({ x: 0, y: 0 });

    return (
        <div className="perspective-1000 w-full max-w-[380px] aspect-[1.6]">
            <div
                id="profile-3d-card"
                onMouseLeave={resetPosition}
                className="relative w-full h-full transform-3d transition-transform duration-200 ease-out cursor-pointer select-none"
                style={{
                    transform: `rotateY(${mousePosition.x * 15}deg) rotateX(${mousePosition.y * -15}deg)`
                }}
            >
                {/* Card Background & Border */}
                <div className={`absolute inset-0 rounded-2xl border backdrop-blur-xl overflow-hidden ${darkMode ? 'bg-zinc-900/40 border-indigo-500/30' : 'bg-white/40 border-indigo-200'} shadow-xl`}>

                    {/* Holographic Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent z-0"></div>

                    {/* Floating Decorative Elements */}
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl z-0"></div>
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl z-0"></div>

                    {/* Content Container */}
                    <div className="relative z-10 flex flex-col h-full p-4 sm:p-6 justify-between">

                        {/* Header: Chip & Logo */}
                        <div className="flex justify-between items-start transform-3d translate-z-10">
                            {/* Chip Image */}
                            <div className="w-12 h-10 rounded-lg bg-gradient-to-r from-yellow-200 to-yellow-500 shadow-sm flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 border border-yellow-600/20 rounded-lg"></div>
                                {/* Chip Lines */}
                                <div className="w-8 h-[1px] bg-yellow-700/30 mb-1"></div>
                                <div className="w-8 h-[1px] bg-yellow-700/30 mb-1"></div>
                                <div className="w-8 h-[1px] bg-yellow-700/30"></div>
                            </div>

                            {/* Brand Logo/Name */}
                            <div className={`font-bold italic opacity-80 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>EducatAI</div>
                        </div>

                        {/* Main Identity Section */}
                        <div className="flex items-center gap-3 sm:gap-4 transform-3d translate-z-20">
                            {/* Photo */}
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full p-1 border shadow-lg ${darkMode ? 'bg-zinc-800 border-indigo-500/50' : 'bg-white border-indigo-200'}`}>
                                {photo ? (
                                    <img src={photo} alt="User" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                                        {getInitials(name)}
                                    </div>
                                )}
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-base sm:text-lg font-bold tracking-tight truncate ${darkMode ? 'text-white' : 'text-zinc-800'}`}>{name}</h3>
                                <p className={`text-[10px] sm:text-xs font-mono uppercase tracking-wider ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>ID: 8824-29X</p>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="flex justify-between items-end transform-3d translate-z-10">
                            <div>
                                <div className={`text-[10px] uppercase font-semibold ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Status / Role</div>
                                <div className={`text-xs font-medium truncate max-w-[140px] sm:max-w-none ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{role} • <span className="text-emerald-500">Active</span></div>
                            </div>

                            {/* Level Badge */}
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${darkMode ? 'bg-zinc-800/80 border-zinc-700 text-indigo-300' : 'bg-white/80 border-zinc-200 text-indigo-700'} shadow-sm`}>
                                {level}
                            </div>
                        </div>

                    </div>

                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none mix-blend-overlay"></div>
                </div>
            </div>
        </div>
    );
};

export default Profile3DCard;
