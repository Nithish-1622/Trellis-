import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode } = useThemeContext();
    const { register, loginWithGoogle, loginWithGithub, loginWithLinkedin, error } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registerError, setRegisterError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setRegisterError(null);
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const pass = formData.get('password') as string;
        const confirmPass = formData.get('confirmPassword') as string;

        if (pass !== confirmPass) {
            setRegisterError("Passwords do not match!");
            return;
        }

        try {
            await register(email, pass, name);
            navigate('/onboarding');
        } catch (err: any) {
            console.error(err);
            setRegisterError(err.message || "Failed to create account");
        }
    };

    return (
        <div className={`w-full animate-scale-in animation-delay-200 opacity-0`}>
            <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Create an Account</h2>
                <p className={`mt-2 text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Start your personalized learning journey</p>
                {(error || registerError) && (
                    <p className="mt-2 text-sm text-red-500">{error || registerError}</p>
                )}
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
                <div className="animate-fade-in-up animation-delay-300 opacity-0">
                    <label htmlFor="name" className={`block text-sm font-medium mb-2 text-left ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500/20 focus:scale-[1.01] ${darkMode ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-indigo-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-indigo-500'}`}
                        placeholder="John Doe"
                    />
                </div>

                <div className="animate-fade-in-up animation-delay-400 opacity-0">
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 text-left ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500/20 focus:scale-[1.01] ${darkMode ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-indigo-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-indigo-500'}`}
                        placeholder="you@example.com"
                    />
                </div>

                <div className="animate-fade-in-up animation-delay-500 opacity-0">
                    <label htmlFor="password" className={`block text-sm font-medium mb-2 text-left ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500/20 focus:scale-[1.01] ${darkMode ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-indigo-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-indigo-500'}`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${darkMode ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="animate-fade-in-up animation-delay-600 opacity-0">
                    <label htmlFor="confirm-password" className={`block text-sm font-medium mb-2 text-left ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirm-password"
                            name="confirmPassword"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-500/20 focus:scale-[1.01] ${darkMode ? 'bg-zinc-950/50 text-white' : 'bg-zinc-50 text-zinc-900'} ${confirmPassword && password !== confirmPassword ? 'border-red-500 focus:border-red-500' : (darkMode ? 'border-zinc-800 focus:border-indigo-500' : 'border-zinc-300 focus:border-indigo-500')}`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${darkMode ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
                        >
                            {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-2 animate-fade-in-up animation-delay-700 opacity-0">
                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                    >
                        Create Account
                    </button>
                </div>
            </form>

            <div className="my-6 flex items-center gap-4 animate-fade-in opacity-0 animation-delay-700">
                <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                <span className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Or continue with</span>
                <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
            </div>

            <div className="grid grid-cols-3 gap-2 animate-fade-in-up animation-delay-700 opacity-0">
                <button onClick={loginWithGoogle} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] ${darkMode ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    <span className="text-sm font-medium">Google</span>
                </button>
                <button onClick={loginWithGithub} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] ${darkMode ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                    <span className="text-sm font-medium">GitHub</span>
                </button>
                <button onClick={loginWithLinkedin} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] ${darkMode ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0077B5" />
                    </svg>
                    <span className="text-sm font-medium">LinkedIn</span>
                </button>
            </div>

            <div className="mt-8 text-center animate-fade-in opacity-0 animation-delay-700">
                <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Already have an account?{' '}
                    <a href="/login" className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">Log in</a>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
