import { questions } from '../onboarding-components/OnboardingForm';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileSettingsProps {
    darkMode: boolean;
    name: string;
    setName: (name: string) => void;
    email: string;
    setEmail: (email: string) => void;
    bio: string;
    setBio: (bio: string) => void;
    photo: string | null;
    setPhoto: (photo: string | null) => void;
    resumeName: string | null;
    setResumeName: (name: string | null) => void;
    getInitials: (name: string) => string;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
    darkMode,
    name, setName,
    email, setEmail,
    bio, setBio,
    photo, setPhoto,
    getInitials
}) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    // Preferences State
    const [preferenceData, setPreferenceData] = useState<Array<{ id: number, answer: string }>>(() => {
        try {
            const stored = localStorage.getItem('userProfileData');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const handlePreferenceChange = (id: number, value: string) => {
        const newData = preferenceData.map(item =>
            item.id === id ? { ...item, answer: value } : item
        );
        setPreferenceData(newData);
    };

    const handleSave = () => {
        setIsSaving(true);

        // Save preferences
        const fullDataToSave = preferenceData.map(item => {
            const q = questions.find(q => q.id === item.id);
            return {
                id: item.id,
                question: q?.text || "",
                answer: item.answer
            };
        });
        localStorage.setItem('userProfileData', JSON.stringify(fullDataToSave));

        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            alert('Profile updated successfully!');
        }, 1000);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className={`rounded-3xl p-6 md:p-8 border ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <h2 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Profile Settings</h2>

                <div className="space-y-8">
                    {/* Photo Upload Section */}
                    <div className="flex items-center gap-6 pb-8 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                        <div className="relative group">
                            <div className={`h-24 w-24 rounded-full overflow-hidden ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'} flex items-center justify-center`}>
                                {photo ? <img src={photo} className="h-full w-full object-cover" /> : (
                                    <span className={`text-2xl font-bold ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>{getInitials(name)}</span>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <span className="text-xs font-medium">Change</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                        <div>
                            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Profile Photo</h3>
                            <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Recommended: Square JPG, PNG. Max 1MB.</p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-zinc-950/50 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-zinc-950/50 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-zinc-950/50 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Career Profile Preferences */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Career Preferences</label>
                    </div>

                    <div className={`rounded-xl border p-6 ${darkMode ? 'bg-zinc-950/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {preferenceData.map((item) => {
                                const relatedQuestion = questions.find(q => q.id === item.id);
                                return (
                                    <div key={item.id}>
                                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            {relatedQuestion?.keyword || "Question"}
                                        </p>
                                        <select
                                            value={item.answer}
                                            onChange={(e) => handlePreferenceChange(item.id, e.target.value)}
                                            className={`w-full p-3 rounded-lg text-sm border outline-none appearance-none cursor-pointer transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-indigo-500'}`}
                                        >
                                            {relatedQuestion?.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}

                            {preferenceData.length === 0 && (
                                <div className={`col-span-full text-center py-4 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                    No preferences set from onboarding.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className={`mt-12 pt-8 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Account Actions</h3>
                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${darkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50/50'}`}>
                        <div>
                            <div className={`font-medium ${darkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>Sign out</div>
                            <div className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Securely log out of your account on this device.</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all duration-300 ${darkMode
                                ? 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                                : 'border-zinc-200 hover:border-zinc-300 hover:bg-white text-zinc-600 hover:text-zinc-900 hover:shadow-sm'}`}
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div >
    );
};

export default ProfileSettings;
