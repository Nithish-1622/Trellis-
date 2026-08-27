import React, { useState, useEffect, useRef } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import BackgroundGradients from '../components/landing-page-components/BackgroundGradients';
import Assistant3DCard from '../components/chat-components/Assistant3DCard';
import { sendMessageToAgent } from '../services/agentService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const Chat: React.FC = () => {
    const { darkMode } = useThemeContext();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! I\'m Educat-AI, your personal career mentor. I can help you find jobs, plan your roadmap, or answer career questions. How can I help you today?',
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            if (!user?.$id) {
                throw new Error("User ID not found");
            }
            const aiText = await sendMessageToAgent(user.$id, userMessage.text);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: aiText,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting to the server right now. Please check your connection and try again.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={`fixed inset-0 flex flex-col font-sans overflow-hidden ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
            <BackgroundGradients />

            {/* Navbar - Fixed Top */}
            <div className={`relative z-50 border-b backdrop-blur-xl transition-colors duration-300 ${darkMode
                ? 'bg-zinc-950/80 border-white/5'
                : 'bg-white/80 border-zinc-200'
                }`}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/profile"
                            className={`p-2 -ml-2 rounded-xl transition-all duration-200 group ${darkMode
                                ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
                                : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                                }`}
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className={`text-base font-bold leading-none ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                    Educat<span className="text-indigo-500">AI</span> Assistant
                                </h1>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area - Scrollable */}
            <div className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
                <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 min-h-full">
                    {/* 3D Assistant Card */}
                    <div className="mt-4 mb-8">
                        <Assistant3DCard />
                    </div>

                    {/* Welcome/Date Separator */}
                    <div className="flex justify-center">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${darkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-100 text-zinc-500'}`}>
                            Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-md ${message.sender === 'ai'
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                                }`}>
                                {message.sender === 'ai' ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`max-w-[80%] md:max-w-[70%] space-y-1`}>
                                <div className={`p-4 rounded-2xl shadow-sm leading-relaxed text-[15px] ${message.sender === 'user'
                                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm'
                                    : darkMode
                                        ? 'bg-zinc-800/80 border border-white/5 text-zinc-200 backdrop-blur-md rounded-tl-sm'
                                        : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-sm shadow-zinc-200/50'
                                    }`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                                            ul: ({ children }: any) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                            ol: ({ children }: any) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                            li: ({ children }: any) => <li className="mb-1">{children}</li>,
                                            a: ({ href, children }: any) => (
                                                <a href={href} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${message.sender === 'user' ? 'text-white' : 'text-indigo-500 hover:text-indigo-400'}`}>
                                                    {children}
                                                </a>
                                            ),
                                            h1: ({ children }: any) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                                            h2: ({ children }: any) => <h2 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                                            h3: ({ children }: any) => <h3 className="text-sm font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
                                            blockquote: ({ children }: any) => <blockquote className={`border-l-4 pl-3 italic mb-2 ${message.sender === 'user' ? 'border-indigo-400' : 'border-zinc-300 dark:border-zinc-600'}`}>{children}</blockquote>,
                                            code: ({ children, className }: any) => {
                                                // Basic check for inline code vs block code could be done here if needed
                                                // But for simplicity, we treat them similarly unless it's a pre block
                                                const isInline = !className;
                                                return (
                                                    <code className={`${isInline
                                                        ? (message.sender === 'user' ? 'bg-indigo-800/50 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300')
                                                        : ''} rounded px-1.5 py-0.5 text-xs font-mono break-all`}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            pre: ({ children }: any) => (
                                                <pre className={`p-3 rounded-lg overflow-x-auto mb-3 text-sm font-mono ${message.sender === 'user' ? 'bg-indigo-900/50 text-zinc-100' : 'bg-zinc-100 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-300'}`}>
                                                    {children}
                                                </pre>
                                            ),
                                        }}
                                    >
                                        {message.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mt-1 shadow-md">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <div className={`p-4 rounded-2xl rounded-tl-sm backdrop-blur-md ${darkMode ? 'bg-zinc-800/50 border border-white/5' : 'bg-white border border-zinc-100'}`}>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Input Area - Fixed Bottom */}
            <div className={`relative z-50 p-4 md:p-6 ${darkMode ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent' : 'bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent'}`}>
                <div className={`max-w-4xl mx-auto rounded-3xl p-2 flex items-end gap-2 shadow-2xl transition-colors duration-300 border ${darkMode
                    ? 'bg-zinc-900 border-zinc-800 ring-1 ring-white/5'
                    : 'bg-white border-zinc-200 shadow-indigo-500/10'
                    }`}>
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask anything about your career..."
                        className={`flex-1 max-h-32 min-h-[48px] bg-transparent border-none focus:ring-0 resize-none py-3 px-4 outline-none ${darkMode ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'}`}
                        rows={1}
                        style={{ height: 'auto', minHeight: '48px' }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className={`p-3 rounded-2xl transition-all duration-300 flex-shrink-0 ${inputValue.trim()
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95'
                            : darkMode
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
