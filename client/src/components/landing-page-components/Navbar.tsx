import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ecaiLogo from '../../assets/ecai.png';
import { navLinks } from '../../data/landingPageData';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
    darkMode: boolean;
    toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleTheme }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${darkMode ? 'bg-zinc-950/80 border-white/5' : 'bg-white/80 border-zinc-200'} backdrop-blur-md border-b`}>
            <div className='max-w-7xl mx-auto px-6 lg:px-8'>
                <div className='flex items-center justify-between h-20'>
                    {/* Logo */}
                    <div className='flex items-center gap-3 cursor-pointer group'>
                        <div className="relative">
                            <div className={`absolute inset-0 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${darkMode ? 'bg-indigo-500' : 'bg-indigo-400'}`}></div>
                            <img src={ecaiLogo} alt="Educat-AI" className='relative h-10 w-auto' />
                        </div>
                        <span className={`font-bold text-xl tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                            Educat<span className="text-indigo-500">AI</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className='hidden md:flex items-center space-x-8'>
                        {navLinks.map((item) => (
                            <a key={item.name} href={item.link} className={`text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-indigo-600'}`}>
                                {item.name}
                            </a>
                        ))}
                    </div>

                    {/* Right Side: Theme Toggle & CTA */}
                    <div className='flex items-center gap-4'>
                        <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />

                        <div className='hidden md:flex items-center gap-4'>
                            <Link to="/login" className={`text-sm font-medium transition-colors ${darkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-indigo-600'}`}>
                                Log In
                            </Link>
                            <Link to="/register" className={`relative group px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 hover:scale-105 shadow-xl ${darkMode ? 'bg-white text-zinc-950 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                                <span className={`absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300 ${darkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`}></span>
                                <span className="relative">Get Started</span>
                            </Link>
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
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className={`px-6 pt-2 pb-6 space-y-4 border-t ${darkMode ? 'bg-zinc-950/95 border-white/5' : 'bg-white/95 border-zinc-200'}`}>
                    {navLinks.map((item) => (
                        <a
                            key={item.name}
                            href={item.link}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-base font-medium py-2 transition-colors ${darkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-indigo-600'}`}
                        >
                            {item.name}
                        </a>
                    ))}
                    <div className="pt-4 flex flex-col gap-3">
                        <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-center text-base font-medium transition-colors ${darkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-indigo-600'}`}
                        >
                            Log In
                        </Link>
                        <Link
                            to="/register"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block text-center px-5 py-3 rounded-xl font-semibold text-base transition-all duration-300 shadow-md ${darkMode ? 'bg-white text-zinc-950 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
