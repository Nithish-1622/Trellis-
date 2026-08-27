import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../contexts/ThemeContext';

export interface Question {
    id: number;
    text: string;
    keyword: string; // Added keyword for display
    options: string[];
}

export const questions: Question[] = [
    {
        id: 1,
        text: "What field interests you the most?",
        keyword: "Interest",
        options: ["Software Development", "Data Science", "Design", "Product Management", "Marketing"]
    },
    {
        id: 2,
        text: "How do you prefer to solve problems?",
        keyword: "Work Style",
        options: ["Analyzing data", "Writing code", "Visualizing solutions", "Leading teams", "Communicating ideas"]
    },
    {
        id: 3,
        text: "What is your preferred work environment?",
        keyword: "Environment",
        options: ["Remote", "Office", "Hybrid", "Outdoor"]
    },
    {
        id: 4,
        text: "What are your strongest skills?",
        keyword: "Top Skill",
        options: ["Logic & Math", "Creativity", "Communication", "Organization", "Leadership"]
    },
    {
        id: 5,
        text: "What is your long-term career goal?",
        keyword: "Goal",
        options: ["Founder/Entrepreneur", "Technical Expert", "Corporate Leader", "Freelancer", "Researcher"]
    }
];

const OnboardingForm: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode } = useThemeContext();
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const handleOptionSelect = (questionId: number, option: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct a more useful object for the profile to display
        const profileData = questions.map(q => ({
            id: q.id,
            question: q.text,
            answer: answers[q.id]
        }));

        localStorage.setItem('userProfileData', JSON.stringify(profileData));
        console.log("Submitted answers:", profileData);

        navigate('/profile');
    };

    const isComplete = questions.every(q => answers[q.id]);

    return (
        <div className={`rounded-2xl shadow-xl backdrop-blur-md border p-8 animate-scale-in animation-delay-200 opacity-0 ${darkMode ? 'bg-zinc-900/50 border-white/10' : 'bg-white/80 border-zinc-200'}`}>
            <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Let's get to know you</h2>
                <p className={`mt-2 text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Help us customize your career path</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {questions.map((q, index) => (
                    <div key={q.id} className="animate-fade-in-up" style={{ animationDelay: `${300 + index * 100}ms` }}>
                        <label className={`block text-lg font-medium mb-4 ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                            {index + 1}. {q.text}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleOptionSelect(q.id, option)}
                                    className={`px-4 py-3 rounded-xl border text-left transition-all duration-200 
                                        ${answers[q.id] === option
                                            ? 'bg-indigo-500 border-indigo-500 text-white ring-2 ring-indigo-500/20'
                                            : darkMode
                                                ? 'bg-zinc-950/50 border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800'
                                                : 'bg-white border-zinc-200 hover:border-indigo-500/50 hover:bg-zinc-50'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="pt-4 animate-fade-in-up" style={{ animationDelay: `${800}ms` }}>
                    <button
                        type="submit"
                        disabled={!isComplete}
                        className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg 
                            ${isComplete
                                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 cursor-pointer'
                                : 'bg-zinc-500 cursor-not-allowed opacity-50'
                            }`}
                    >
                        Complete Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OnboardingForm;
