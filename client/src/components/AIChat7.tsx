'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Pin,
  X,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Brain,
  Layers,
  Activity,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark
} from 'lucide-react';
import { ChatMessage } from '../types';
import './AIChat7.css';

export interface ContextSource {
  id: string;
  title: string;
  type: 'milestone' | 'radar' | 'rfc' | 'code';
  pinned: boolean;
  contentSnippet: string;
}

export interface CitationItem {
  id: number;
  sourceTitle: string;
  evidenceQuote: string;
  domain: string;
}

export interface AIChat7Props {
  initialMessages?: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isTyping?: boolean;
  userName?: string;
  userTargetRole?: string;
  className?: string;
}

export const AIChat7: React.FC<AIChat7Props> = ({
  initialMessages,
  onSendMessage,
  isTyping = false,
  userName = 'Learner',
  userTargetRole = 'Senior Systems Architect',
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<{ msgId: string; citationId: number } | null>(null);

  // Pinned Context Sources
  const [sources, setSources] = useState<ContextSource[]>([
    {
      id: 'src-1',
      title: 'Current Milestone: Transactional Outbox',
      type: 'milestone',
      pinned: true,
      contentSnippet: 'In-progress node in Senior Systems Architect track. Prerequisite: Raft Consensus.'
    },
    {
      id: 'src-2',
      title: 'Trellis Skill Radar (Data 48% • Systems 58%)',
      type: 'radar',
      pinned: true,
      contentSnippet: 'Recent radar evaluation identified highest-leverage growth in distributed data consistency.'
    },
    {
      id: 'src-3',
      title: 'RFC-44: Multi-Region Event Choreography',
      type: 'rfc',
      pinned: true,
      contentSnippet: 'Architecture specification for idempotency keys, dead-letter topics, and rollback sagas.'
    },
    {
      id: 'src-4',
      title: 'Kafka vs Raft Consensus Trade-offs',
      type: 'code',
      pinned: false,
      contentSnippet: 'Log partition replication models vs state machine consensus algorithms.'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const togglePinSource = (sourceId: string) => {
    setSources(prev =>
      prev.map(s => (s.id === sourceId ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || isTyping) return;
    setInput('');
    await onSendMessage(text);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const mockCitations: Record<number, CitationItem> = {
    1: {
      id: 1,
      sourceTitle: "Designing Data-Intensive Applications (Kleppmann, Ch. 9)",
      evidenceQuote: "Dual-write hazards occur when two distinct storage systems are updated without distributed atomic coordination.",
      domain: "Distributed Systems"
    },
    2: {
      id: 2,
      sourceTitle: "Trellis Architecture RFC #44 — Outbox Pattern",
      evidenceQuote: "Writing event records in the same ACID database transaction guarantees at-least-once message delivery to downstream message brokers.",
      domain: "Software Architecture"
    },
    3: {
      id: 3,
      sourceTitle: "Trellis 6-Axis Competency Calibration Matrix",
      evidenceQuote: "Mastering transactional outbox patterns increases Systems Design proficiency score by +12%.",
      domain: "Radar Calibration"
    }
  };

  return (
    <div className={`aichat7-container ${className}`}>
      
      {/* Top Bar: Assistant Identity & Pinned Sources */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-literata font-bold text-sm text-slate-900 dark:text-white">
                Trellis AI Architecture Guide
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-700">
                Evidence-Mapped
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Calibrated for <strong>{userName}</strong> • Target: <strong>{userTargetRole}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Pin className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline font-semibold">{sources.filter(s => s.pinned).length} Pinned Sources</span>
        </div>
      </div>

      {/* Pinned Context Sources Strip */}
      <div className="pinned-sources-strip">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Pin className="w-3 h-3" />
          <span>Active Context:</span>
        </span>
        {sources.map(src => (
          <button
            key={src.id}
            type="button"
            onClick={() => togglePinSource(src.id)}
            className={`pinned-source-pill ${src.pinned ? 'active' : ''} cursor-pointer`}
            title={src.contentSnippet}
          >
            {src.type === 'milestone' && <Layers className="w-3 h-3" />}
            {src.type === 'radar' && <Activity className="w-3 h-3" />}
            {src.type === 'rfc' && <FileText className="w-3 h-3" />}
            {src.type === 'code' && <BookOpen className="w-3 h-3" />}
            <span>{src.title}</span>
            {src.pinned ? (
              <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
            ) : (
              <span className="text-[9px] opacity-60">+Pin</span>
            )}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg, idx) => {
          const isAssistant = msg.sender === 'assistant';

          return (
            <div
              key={msg.id || idx}
              className={`flex gap-3.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Brain className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2.5 ${isAssistant ? '' : 'items-end'}`}>
                {/* Message Bubble */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isAssistant
                      ? 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs'
                      : 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                  }`}
                >
                  {isAssistant ? (
                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>

                      {/* Evidence / Citation Badges */}
                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Evidence Citations:
                        </span>
                        {[1, 2, 3].map(citeId => {
                          const isSelected =
                            activeCitation?.msgId === msg.id &&
                            activeCitation?.citationId === citeId;

                          return (
                            <button
                              key={citeId}
                              type="button"
                              onClick={() =>
                                setActiveCitation(
                                  isSelected
                                    ? null
                                    : { msgId: msg.id, citationId: citeId }
                                )
                              }
                              className={`citation-badge ${isSelected ? 'active' : ''}`}
                            >
                              <span>[{citeId}]</span>
                              <span>{mockCitations[citeId].domain}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Expandable Evidence Card Popover */}
                      {activeCitation?.msgId === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="evidence-card space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{mockCitations[activeCitation.citationId].sourceTitle}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveCitation(null)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                            "{mockCitations[activeCitation.citationId].evidenceQuote}"
                          </p>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>

                {/* Message Footer: Actions & Timestamp */}
                <div className={`flex items-center gap-3 text-[11px] text-slate-400 px-1 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                  <span>{msg.timestamp || 'Just now'}</span>
                  {isAssistant && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Suggested Follow-up Prompts */}
                {isAssistant && msg.suggestedPrompts && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3.5 items-center text-xs text-slate-500 dark:text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Trellis Reasoning Core synthesizing citations and trade-offs...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask architecture questions, discuss Raft/Sagas, or query milestone citations..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default AIChat7;

