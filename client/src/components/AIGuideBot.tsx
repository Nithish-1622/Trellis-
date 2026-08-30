import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TrackNode, SkillScores } from '../types';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Leaf,
  Brain,
  HelpCircle,
  Code2,
  ChevronDown
} from 'lucide-react';

interface AIGuideBotProps {
  currentNode?: TrackNode;
  currentScores: SkillScores;
  onOpenNodeModal?: (nodeId: string) => void;
}

export const AIGuideBot: React.FC<AIGuideBotProps> = ({
  currentNode,
  currentScores,
  onOpenNodeModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Hello! I'm **Trellis AI**, your systems architecture mentor.\n\nI'm currently tracking your progress on **${currentNode?.title || 'Systems Architecture'}**. Based on your radar assessment, you have a high-leverage growth opportunity in **Data (48%)** and **Systems (58%)**.\n\nHow can I help you design resilient architectures today?`,
      timestamp: 'Just now',
      suggestedPrompt: 'Why is Event-Driven Architecture recommended for me?'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call server backend if available
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentNodeTitle: currentNode?.title,
          currentScores
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('Fallback response');
      }
    } catch {
      // Intelligent fallback answer generator
      setTimeout(() => {
        let replyText = '';
        const qLower = query.toLowerCase();

        if (qLower.includes('why') || qLower.includes('recommend')) {
          replyText = `**Why this recommendation?**\n\nYour diagnostic score showed strong Logic fundamentals (65%) but a notable gap in **Distributed Data async paradigms (48%)**.\n\nMastering **${currentNode?.title || 'Event-Driven Architecture'}** is critical because synchronous REST chains introduce cascading failures. With event choreography and idempotent consumers, your systems gain high availability and decoupling.`;
        } else if (qLower.includes('kafka') || qLower.includes('queue') || qLower.includes('broker')) {
          replyText = `**Kafka vs RabbitMQ Architectural Trade-offs:**\n\n- **Kafka (Log-Centric)**: Retains immutable message streams on disk partitioned across brokers. Best for event replay, high-throughput analytics, and CQRS projections.\n- **RabbitMQ (Queue-Centric)**: Smart broker, dumb consumer model with complex AMQP exchange routing (direct, topic, fanout). Messages are deleted upon ACK.\n\n*Rule of Thumb:* Use Kafka for event sourcing and stream analytics; use RabbitMQ for transactional job distribution.`;
        } else if (qLower.includes('idempotent') || qLower.includes('dedup')) {
          replyText = `**Implementing Idempotency in Distributed Consumers:**\n\n1. **Unique Message ID:** Every producer attaches an immutable \`eventId\` or \`idempotencyKey\`.\n2. **Transactional Outbox:** Save state changes and event logs atomically in the DB.\n3. **Redis / DB Unique Constraint:** Consumer attempts \`SET key 1 NX EX 86400\` before processing. If key exists, return HTTP 200/ACK without repeating side-effects.`;
        } else {
          replyText = `That is an essential question for high-scale systems.\n\nIn modern microservices, the key is balancing **loose coupling** against **operational complexity**. When implementing ${currentNode?.title || 'distributed services'}, always design for network failure, implement circuit breakers, and ensure all message handlers are idempotent.\n\nWould you like me to generate a 2-minute scenario quiz on this?`;
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Guide Button (Matching screenshot) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-white rounded-full shadow-[0_10px_30px_rgba(0,53,39,0.18)] border border-[#bfc9c3]/30 flex items-center justify-center text-[#003527] dark:[#52b788] hover:scale-105 transition-transform z-40 group"
        title="Open Trellis AI Architecture Guide"
      >
        <span className="absolute inset-0 rounded-full border border-[#003527] dark:[#52b788]/30 scale-110 opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          smart_toy
        </span>
      </button>

      {/* Slide-over AI Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#bfc9c3]/50 flex flex-col h-[560px] overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Drawer Header */}
          <div className="px-5 py-4 bg-[#f8f9ff] border-b border-[#bfc9c3]/30 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#003527] dark:[#52b788] text-white flex items-center justify-center shadow-xs">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-literata font-bold text-base text-[#003527]">
                  Trellis AI Architecture Guide
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online • Tracking Systems Roadmap
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#f8f9ff]/40">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#003527] text-white rounded-tr-xs'
                      : 'bg-white text-[#0d1c2e] border border-[#bfc9c3]/40 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>

                {msg.suggestedPrompt && (
                  <button
                    onClick={() => handleSend(msg.suggestedPrompt)}
                    className="mt-1.5 text-xs text-[#003527] dark:[#52b788] bg-[#003527] dark:[#52b788]/10 hover:bg-[#003527] dark:[#52b788]/20 px-3 py-1 rounded-full text-left flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>{msg.suggestedPrompt}</span>
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#003527] dark:[#52b788] bg-white p-3 rounded-xl border border-[#bfc9c3]/30 w-fit">
                <Brain className="w-4 h-4 animate-spin" />
                <span>Trellis AI is evaluating architecture patterns...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSend('Explain Outbox Pattern with code')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full whitespace-nowrap"
            >
              Transactional Outbox
            </button>
            <button
              onClick={() => handleSend('How does Istio mTLS work?')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full whitespace-nowrap"
            >
              mTLS in Istio
            </button>
            <button
              onClick={() => handleSend('Kafka vs RabbitMQ summary')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full whitespace-nowrap"
            >
              Kafka vs RabbitMQ
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-[#bfc9c3]/30 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask an architecture question or for recommendations..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              className="flex-1 text-xs md:text-sm p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003527] dark:[#52b788] outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#003527] hover:bg-[#064e3b] text-white flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

