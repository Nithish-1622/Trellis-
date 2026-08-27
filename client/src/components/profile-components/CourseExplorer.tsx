import React, { useState, useEffect } from 'react';
import { getLearningResources } from '../../services/agentService';

interface Course {
    id: string; // Changed to string as it might be a URL or generated ID
    title: string;
    description: string;
    level: string;
    duration: string;
    tags: string[];
    image: string;
    progress?: number;
    url?: string;
    type?: string;
}

interface CourseExplorerProps {
    darkMode: boolean;
}

const CourseExplorer: React.FC<CourseExplorerProps> = ({ darkMode }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [skill, setSkill] = useState("Artificial Intelligence"); // Default skill
    const [level, setLevel] = useState("beginner");

    // Course images mapping based on keywords (simple placeholder logic)
    const getImageForCourse = (title: string, type: string) => {
        const t = title.toLowerCase();
        if (type === 'video') return "https://images.unsplash.com/photo-1492619882492-866d4d623756?auto=format&fit=crop&q=80&w=600";
        if (t.includes('web') || t.includes('react')) return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600";
        if (t.includes('data') || t.includes('python')) return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600";
        if (t.includes('design') || t.includes('ui')) return "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=600";
        if (t.includes('manager') || t.includes('product')) return "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600";
        return "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600";
    };

    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getLearningResources(skill, level);
            if (data && data.resources) {
                const mappedCourses: Course[] = data.resources.map((res: any, index: number) => ({
                    id: res.url || index.toString(),
                    title: res.title,
                    description: res.description || `Learn ${skill} with this comprehensive ${res.type}.`,
                    level: res.difficulty || level,
                    duration: res.duration || "Self-paced",
                    tags: [res.type, res.platform || "Online"],
                    image: getImageForCourse(res.title, res.type),
                    url: res.url,
                    type: res.type
                }));
                setCourses(mappedCourses);
            } else {
                setCourses([]);
            }
        } catch (err: any) {
            console.error("Error fetching courses:", err);
            setError("Failed to load learning resources. Please try again.");
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce fetching or just fetch on mount/change
        const timer = setTimeout(() => {
            fetchCourses();
        }, 500);
        return () => clearTimeout(timer);
    }, [skill, level]);

    const handleEnroll = (url?: string) => {
        if (url) window.open(url, '_blank');
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Explore Learning Resources</h2>
                    <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Curated courses, tutorials, and projects for your growth.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        placeholder="Search skill (e.g. React, Python)"
                        className={`px-4 py-2 rounded-lg text-sm border outline-none min-w-[200px] transition-colors focus:ring-2 focus:ring-indigo-500/50 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'}`}
                    />
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className={`px-4 py-2 rounded-lg text-sm border outline-none cursor-pointer ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : error ? (
                <div className="text-center py-10 text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
                    {error}
                </div>
            ) : courses.length === 0 ? (
                <div className={`text-center py-20 rounded-xl border border-dashed ${darkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-300 text-zinc-500'}`}>
                    <p>No resources found for "{skill}". Try a different keyword.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, i) => (
                        <div key={i} className={`flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-indigo-200'}`}>
                            <div className="h-40 overflow-hidden relative group">
                                <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-white text-xs font-medium px-2 py-1 bg-white/20 backdrop-blur-md rounded-md border border-white/10">{course.type?.toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {course.level}
                                    </span>
                                    <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{course.duration}</span>
                                </div>
                                <h3 className={`text-lg font-bold mb-2 leading-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{course.title}</h3>
                                <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{course.description}</p>

                                <div className="mt-auto flex gap-2">
                                    {course.tags.slice(0, 2).map((tag, idx) => (
                                        <span key={idx} className={`text-[10px] px-2 py-1 rounded border ${darkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-500'}`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-5">
                                    <button
                                        onClick={() => handleEnroll(course.url)}
                                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                    >
                                        Start Learning
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}


        </div>
    );
};

export default CourseExplorer;
