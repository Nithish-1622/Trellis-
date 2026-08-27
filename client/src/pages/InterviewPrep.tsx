import React, { useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { startInterview, submitInterviewAnswer, getInterviewReport } from '../services/agentService';
import BackgroundGradients from '../components/landing-page-components/BackgroundGradients';

const InterviewPrep: React.FC = () => {
    const { darkMode } = useThemeContext();
    const { user } = useAuth();

    // Stages: 'setup', 'interview', 'report'
    const [stage, setStage] = useState<'setup' | 'interview' | 'report'>('setup');

    // Setup State
    const [targetRole, setTargetRole] = useState(user?.target_role || "Software Engineer");
    const [focusArea, setFocusArea] = useState("React & System Design");
    const [isLoading, setIsLoading] = useState(false);

    // Interview State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [userAnswer, setUserAnswer] = useState("");
    const [lastFeedback, setLastFeedback] = useState<{ score: number, feedback: string } | null>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const MAX_QUESTIONS = 5;

    // Report State
    const [report, setReport] = useState<any>(null);

    const handleStart = async () => {
        setIsLoading(true);
        try {
            const data = await startInterview(user.$id, targetRole, focusArea);
            setSessionId(data.session_id);
            setCurrentQuestion(data.question);
            setStage('interview');
            setQuestionCount(1);
        } catch (error) {
            console.error(error);
            alert("Failed to start interview.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!userAnswer.trim()) return;
        setIsLoading(true);
        try {
            const data = await submitInterviewAnswer(user.$id, sessionId!, userAnswer);

            // Update feedback from previous turn
            if (data.previous_feedback) {
                setLastFeedback({
                    score: data.previous_score || 0,
                    feedback: data.previous_feedback
                });
            }

            if (data.state === 'completed') {
                await fetchReport(data.session_id);
            } else {
                setCurrentQuestion(data.question);
                setUserAnswer("");
                setQuestionCount(prev => prev + 1);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to submit answer.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReport = async (sid: string) => {
        setIsLoading(true);
        try {
            const data = await getInterviewReport(sid);
            setReport(data);
            setStage('report');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen font-sans relative flex flex-col ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
            <BackgroundGradients />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-24 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        AI Mock Interviewer
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Master your technical interviews with real-time feedback.
                    </p>
                </div>

                {/* STAGE: SETUP */}
                {stage === 'setup' && (
                    <div className={`max-w-xl mx-auto p-8 rounded-3xl border backdrop-blur-sm ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Target Role</label>
                                <input
                                    type="text"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-zinc-950 bg-opacity-50 border-zinc-700' : 'bg-white border-zinc-300'}`}
                                    placeholder="e.g. Senior Frontend Engineer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Focus Topic</label>
                                <input
                                    type="text"
                                    value={focusArea}
                                    onChange={(e) => setFocusArea(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-zinc-950 bg-opacity-50 border-zinc-700' : 'bg-white border-zinc-300'}`}
                                    placeholder="e.g. React Performance, System Design"
                                />
                            </div>
                            <button
                                onClick={handleStart}
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {isLoading ? "Initializing AI..." : "Start Interview Session"}
                            </button>
                        </div>
                    </div>
                )}

                {/* STAGE: INTERVIEW */}
                {stage === 'interview' && (
                    <div className="grid gap-8">
                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(questionCount / MAX_QUESTIONS) * 100}%` }}
                            />
                        </div>
                        <div className="text-right text-sm text-zinc-500">Question {questionCount} of {MAX_QUESTIONS}</div>

                        {/* AI Question Card */}
                        <div className={`p-8 rounded-3xl border shadow-xl ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-100'}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0">AI</div>
                                <div>
                                    <h3 className="text-xl font-medium leading-relaxed">{currentQuestion}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Feedback from previous answer */}
                        {lastFeedback && (
                            <div className={`p-6 rounded-2xl border-l-4 ${lastFeedback.score >= 70 ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold uppercase tracking-wider opacity-70">Previous Answer Feedback</span>
                                    <span className="font-bold text-lg">{lastFeedback.score}/100</span>
                                </div>
                                <p className="text-sm opacity-90">{lastFeedback.feedback}</p>
                            </div>
                        )}

                        {/* User Answer Area */}
                        <div className={`p-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20`}>
                            <textarea
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                className={`w-full h-40 p-6 rounded-[22px] outline-none resize-none text-lg ${darkMode ? 'bg-zinc-950 text-white placeholder-zinc-600' : 'bg-white text-zinc-900 placeholder-zinc-400'}`}
                                placeholder="Type your answer here..."
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={isLoading || !userAnswer.trim()}
                                className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Analyzing..." : "Submit Answer"}
                            </button>
                        </div>
                    </div>
                )}

                {/* STAGE: REPORT */}
                {stage === 'report' && report && (
                    <div className="space-y-8 animate-fade-in-up">
                        <div className={`text-center p-10 rounded-3xl border ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                            <h2 className="text-2xl font-bold mb-2">Interview Completed!</h2>
                            <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 mb-4">
                                {report.overall_score}
                            </div>
                            <p className="text-sm uppercase tracking-widest opacity-60">Overall Score</p>
                            <p className="mt-6 max-w-2xl mx-auto opacity-80 leading-relaxed">
                                {report.summary}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className={`p-8 rounded-3xl border border-green-500/20 bg-green-500/5`}>
                                <h3 className="text-green-500 font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Strengths
                                </h3>
                                <ul className="space-y-2">
                                    {report.strengths.map((s: string, i: number) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-green-500">•</span>
                                            <span className="opacity-90">{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className={`p-8 rounded-3xl border border-orange-500/20 bg-orange-500/5`}>
                                <h3 className="text-orange-500 font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Areas for Improvement
                                </h3>
                                <ul className="space-y-2">
                                    {report.improvements.map((s: string, i: number) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-orange-500">•</span>
                                            <span className="opacity-90">{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => setStage('setup')}
                                className={`px-8 py-3 rounded-full border transition-all ${darkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'}`}
                            >
                                Start New Session
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InterviewPrep;
