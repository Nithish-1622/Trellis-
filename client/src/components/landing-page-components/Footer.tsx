import React from 'react';
import ecaiLogo from '../../assets/ecai.png';

interface FooterProps {
    darkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ darkMode }) => {
    return (
        <footer className={`pt-12 pb-8 relative overflow-hidden ${darkMode ? 'border-t border-white/5 bg-zinc-950' : 'border-t border-zinc-200 bg-zinc-50'}`}>
            <div className='max-w-7xl mx-auto px-6 lg:px-8'>
                <div className={`flex flex-col md:flex-row justify-between items-center`}>
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <img src={ecaiLogo} alt="Logo" className="h-8 w-auto grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                        <span className={`font-bold text-lg tracking-tight ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Educat<span className="text-indigo-500">AI</span></span>
                    </div>

                    <div className="flex gap-6 mb-4 md:mb-0">
                        {['Privacy', 'Terms', 'Twitter', 'GitHub'].map(link => (
                            <a key={link} href="#" className={`text-sm transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-indigo-600'}`}>
                                {link}
                            </a>
                        ))}
                    </div>

                    <div className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        &copy;{new Date().getFullYear()} EducatAI
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
