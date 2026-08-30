'use client';

import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { askTrellisGuide } from '../services/agentService';
import AIChat7 from './AIChat7';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: `Hello! I'm **Trellis AI Guide** — your systems architecture mentor, here to help you navigate your personalized learning path.\n\nI can help you:\n- Deconstruct complex distributed systems patterns (Event Sourcing, Raft, Saga orchestrations)\n- Review system design trade-offs and recommend evidence-backed resources\n- Suggest next milestones based on your skill radar and target role\n\nWhat are you designing or studying today?`,
    timestamp: 'Just now',
    suggestedPrompts: [
      'Explain Event Sourcing vs CQRS with code examples',
      'How to design an idempotent payment webhook receiver?',
      'Compare Raft vs Paxos consensus mechanisms',
      'What should I learn next after Kubernetes basics?'
    ]
  }
];

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const responseText = await askTrellisGuide(textToSend, {
        userName: user?.name,
        targetRole: user?.targetRole,
        currentSkills: user?.skills
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          'Can you show an implementation snippet?',
          'What are the failure modes and edge cases?',
          'How does this tie into my next roadmap milestone?'
        ]
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'assistant',
        text: "I encountered a brief hiccup connecting to the reasoning core. Please ask again or check your network.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full py-4 animate-in fade-in duration-300">
      <AIChat7
        initialMessages={messages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        userName={user?.name || 'Elena Rostova'}
        userTargetRole={user?.targetRole || 'Senior Systems Architect'}
      />
    </div>
  );
};

export default ChatPage;
