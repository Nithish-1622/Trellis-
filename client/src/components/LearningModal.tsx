import React, { useState } from 'react';
import { RoadmapNode } from '../types';
import {
  X,
  CheckCircle2,
  Brain,
  Sparkles,
  BookOpen,
  ArrowRight,
  Code2,
  Terminal,
  Send,
  RotateCcw,
  ExternalLink,
  Award,
  Leaf
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LearningModalProps {
  node: RoadmapNode;
  onClose: () => void;
  onMasterNode: (nodeId: string) => void;
}

export const LearningModal: React.FC<LearningModalProps> = ({
  node,
  onClose,
  onMasterNode
}) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'simulator' | 'quiz'>('concepts');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Interactive Broker Sandbox state
  const [messages, setMessages] = useState<Array<{ id: string; topic: string; payload: string; status: 'queued' | 'processing' | 'acked' | 'duplicate'; latency: number }>>([
    { id: 'evt-001', topic: 'orders.v1.placed', payload: '{"orderId":"ord-9821","total":149.50}', status: 'acked', latency: 42 },
    { id: 'evt-002', topic: 'payments.v1.authorized', payload: '{"txId":"tx-4412","status":"SUCCESS"}', status: 'acked', latency: 28 }
  ]);
  const [newTopic, setNewTopic] = useState('inventory.v1.reserved');
  const [newPayload, setNewPayload] = useState('{"sku":"SKU-CORAL-99","qty":2}');
  const [simRunning, setSimRunning] = useState(false);

  const handlePublishMessage = () => {
    if (!newPayload) return;
    const msgId = `evt-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMsg = {
      id: msgId,
      topic: newTopic,
      payload: newPayload,
      status: 'queued' as const,
      latency: Math.floor(20 + Math.random() * 40)
    };

    setMessages(prev => [newMsg, ...prev]);
    setSimRunning(true);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, status: 'processing' } : m))
      );
    }, 600);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, status: 'acked' } : m))
      );
      setSimRunning(false);
    }, 1300);
  };

  const handleSimulateDuplicate = () => {
    const dupMsg = {
      id: 'evt-001',
      topic: 'orders.v1.placed',
      payload: '{"orderId":"ord-9821","total":149.50}',
      status: 'duplicate' as const,
      latency: 4
    };
    setMessages(prev => [dupMsg, ...prev]);
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const learningModule = node?.learningModule || {
    overview: node?.shortDescription || 'Master this architectural milestone with hands-on labs and mental models.',
    keyConcepts: [
      {
        title: 'Architectural Mental Model',
        explanation: node?.shortDescription || 'Deconstruct patterns and systems trade-offs.',
        codeSnippet: '// Architecture Implementation Snippet\nexport interface MilestoneTopology {\n  id: string;\n  status: "active";\n}'
      }
    ],
    resources: [
      { title: 'Designing Distributed Systems Guide', type: 'guide', estMinutes: 25, url: '#' },
      { title: 'Trellis Architecture RFC Specification', type: 'rfc', estMinutes: 15, url: '#' }
    ],
    interactiveDemo: {
      type: 'rate-limiter',
      title: `${node?.title || 'Interactive'} Sandbox`,
      description: 'Explore state transformations and latency dynamics.'
    },
    quiz: [
      {
        question: `What is the primary architectural objective of ${node?.title || 'this milestone'}?`,
        options: [
          'Enforces distributed resilience and bounds failure domains',
          'Increases system complexity without measurable benefits',
          'Eliminates all network latency completely',
          'Requires synchronous monolithic coupling'
        ],
        correctIndex: 0,
        explanation: 'Architectural boundaries isolate blast radiuses and enable high availability.'
      }
    ]
  };

  const keyConcepts = (learningModule.keyConcepts && Array.isArray(learningModule.keyConcepts))
    ? learningModule.keyConcepts
    : [
        {
          title: 'Architectural Mental Model',
          explanation: node?.shortDescription || 'Master the essential systems patterns.',
          codeSnippet: '// Mental model configuration\nconst config = { enabled: true };'
        }
      ];

  const resources = (learningModule.resources && Array.isArray(learningModule.resources))
    ? learningModule.resources
    : [
        { title: 'Architecture Systems Guide', type: 'guide', estMinutes: 20, url: '#' },
        { title: 'Trellis RFC Reference', type: 'rfc', estMinutes: 15, url: '#' }
      ];

  const quiz = (learningModule.quiz && Array.isArray(learningModule.quiz))
    ? learningModule.quiz
    : [
        {
          question: `What is the primary architectural objective of ${node?.title || 'this milestone'}?`,
          options: [
            'Enforces distributed resilience and bounds failure domains',
            'Increases system complexity without measurable benefits',
            'Eliminates all network latency completely',
            'Requires synchronous monolithic coupling'
          ],
          correctIndex: 0,
          explanation: 'Architectural boundaries isolate blast radiuses and enable high availability.'
        }
      ];

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quiz.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) {
        correctCount += 1;
      }
    });
    setQuizScore(correctCount);
    setQuizSubmitted(true);

    if (correctCount >= Math.ceil(quiz.length * 0.7)) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#52b788', '#f59e0b', '#2d6a4f', '#fbbf24']
        });
      } catch {
        // ignore if not supported
      }
      onMasterNode(node.id);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06110d]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 dark:border-slate-700/60 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 dark:border-slate-700/60 flex justify-between items-start bg-gray-50 dark:bg-slate-800/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                node.status === 'done'
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-600 dark:text-emerald-400/10 dark:bg-[#52b788]/20 text-emerald-600 dark:text-emerald-400 dark:text-[#a7f3d0]'
              }`}>
                {node.status === 'done' ? 'Mastered Milestone' : 'Interactive Growth Sandbox'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {resources.length} resources available
              </span>
            </div>
            <h2 className="font-literata text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 dark:text-white">
              {node.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 dark:border-slate-700/60 px-6 bg-white dark:bg-slate-900 gap-6">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'concepts'
                ? 'border-emerald-600 dark:text-emerald-400 text-emerald-600 dark:text-emerald-400 dark:border-[#52b788] dark:text-[#52b788]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Core Concepts</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-emerald-600 dark:text-emerald-400 text-emerald-600 dark:text-emerald-400 dark:border-[#52b788] dark:text-[#52b788]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Interactive Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'quiz'
                ? 'border-emerald-600 dark:text-emerald-400 text-emerald-600 dark:text-emerald-400 dark:border-[#52b788] dark:text-[#52b788]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Mastery Quiz</span>
            {quiz.length > 0 && (
              <span className="bg-[#52b788]/20 text-emerald-600 dark:text-emerald-400 dark:text-[#a7f3d0] text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                {quiz.length}Q
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: CONCEPTS */}
          {activeTab === 'concepts' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-600 dark:text-emerald-400/5 dark:bg-[#52b788]/10 rounded-2xl border border-emerald-600 dark:text-emerald-400/10 dark:border-[#52b788]/20 text-gray-800 dark:text-gray-200">
                <h4 className="font-literata font-bold text-base mb-1 text-emerald-600 dark:text-emerald-400 dark:text-[#a7f3d0]">
                  Milestone Overview
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {learningModule.overview}
                </p>
              </div>

              {/* Key Concept Cards */}
              <div className="space-y-4">
                <h4 className="font-literata font-bold text-lg text-emerald-600 dark:text-emerald-400 dark:text-white">
                  Key Architectural Patterns
                </h4>
                {keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 dark:text-emerald-400/10 dark:bg-[#52b788]/20 text-emerald-600 dark:text-emerald-400 dark:text-[#a7f3d0] flex items-center justify-center text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <h5 className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 dark:text-white">
                        {concept.title}
                      </h5>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 pl-8 leading-relaxed">
                      {concept.explanation}
                    </p>
                    {concept.codeSnippet && (
                      <div className="pl-8 pt-1">
                        <pre className="bg-gray-900 dark:bg-[#040c09] text-[#a7f3d0] p-3 rounded-xl text-xs font-mono overflow-x-auto border border-gray-800">
                          <code>{concept.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Curated Readings */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 space-y-3">
                <h4 className="font-literata font-bold text-base text-emerald-600 dark:text-emerald-400 dark:text-white">
                  Curated Technical References
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resources.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/60/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 dark:text-[#52b788]" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 dark:text-white">{res.title}</p>
                          <span className="text-[10px] text-gray-500 capitalize">
                            {res.type} • {res.estMinutes} mins
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-600 dark:text-emerald-400/5 dark:bg-[#52b788]/10 rounded-2xl border border-emerald-600 dark:text-emerald-400/10 dark:border-[#52b788]/20">
                <h4 className="font-literata font-bold text-base text-emerald-600 dark:text-emerald-400 dark:text-[#a7f3d0] mb-1">
                  Message Broker & Idempotency Sandbox
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Publish asynchronous domain events to observe broker queuing, worker acknowledgment latency, and idempotent deduplication behavior.
                </p>
              </div>

              {/* Publisher Form */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 dark:text-[#52b788]">
                  Event Producer
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Topic Name</label>
                    <input
                      type="text"
                      value={newTopic}
                      onChange={e => setNewTopic(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/60 text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">JSON Payload</label>
                    <input
                      type="text"
                      value={newPayload}
                      onChange={e => setNewPayload(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/60 text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePublishMessage}
                    disabled={simRunning}
                    className="bg-emerald-600 dark:text-emerald-400 hover:bg-[#084e3a] dark:bg-[#52b788] dark:hover:bg-[#40916c] text-white dark:text-[#06110d] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Event</span>
                  </button>
                  <button
                    onClick={handleSimulateDuplicate}
                    className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Simulate Duplicate Key Re-delivery</span>
                  </button>
                </div>
              </div>

              {/* Message Stream Table */}
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 flex justify-between">
                  <span>Message Queue & Consumer Logs</span>
                  <span className="font-mono text-gray-400">{messages.length} Events Processed</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700/40 max-h-64 overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-slate-800/40">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 dark:text-[#52b788]">{msg.id}</span>
                          <span className="font-mono text-gray-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            {msg.topic}
                          </span>
                        </div>
                        <p className="font-mono text-gray-600 dark:text-gray-400 text-[11px] truncate max-w-md">{msg.payload}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-gray-400 text-[11px]">{msg.latency}ms</span>
                        {msg.status === 'acked' && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ACK (200)</span>
                          </span>
                        )}
                        {msg.status === 'processing' && (
                          <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                            Processing...
                          </span>
                        )}
                        {msg.status === 'queued' && (
                          <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Queued
                          </span>
                        )}
                        {msg.status === 'duplicate' && (
                          <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full text-[10px] border border-rose-200 dark:border-rose-800">
                            Deduped (Skipped)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {quiz.map((q, qIdx) => {
                const isAnswered = selectedAnswers[qIdx] !== undefined;
                const isCorrect = selectedAnswers[qIdx] === q.correctIndex;

                return (
                  <div
                    key={qIdx}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 dark:text-emerald-400/10 dark:bg-[#52b788]/20 text-emerald-600 dark:text-emerald-400 dark:text-[#a7f3d0] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <h4 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">
                        {q.question}
                      </h4>
                    </div>

                    <div className="space-y-2 pl-8">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        let optionClass = 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300';

                        if (quizSubmitted) {
                          if (optIdx === q.correctIndex) {
                            optionClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isSelected) {
                            optionClass = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200';
                          }
                        } else if (isSelected) {
                          optionClass = 'bg-emerald-600 dark:text-emerald-400/10 dark:bg-[#52b788]/20 border-emerald-600 dark:text-emerald-400 dark:border-[#52b788] text-emerald-600 dark:text-emerald-400 dark:text-[#a7f3d0] font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${optionClass}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300'
                      }`}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit / Reset Actions */}
              {quizSubmitted ? (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-literata font-bold text-sm text-emerald-900 dark:text-emerald-200">
                        Score: {quizScore} / {quiz.length} ({Math.round((quizScore / quiz.length) * 100)}%)
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        {quizScore >= Math.ceil(quiz.length * 0.7)
                          ? 'Mastery Achieved! Node has bloomed into a golden flower on your trellis.'
                          : 'Review the explanations above and retry to achieve node mastery.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleResetQuiz}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                    >
                      Retry Quiz
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-emerald-600 dark:text-emerald-400 dark:bg-[#52b788] text-white dark:text-[#06110d] text-xs font-bold"
                    >
                      Back to Trellis Path
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(selectedAnswers).length < quiz.length}
                    className="bg-emerald-600 dark:text-emerald-400 hover:bg-[#084e3a] dark:bg-[#52b788] dark:hover:bg-[#40916c] text-white dark:text-[#06110d] px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Submit Mastery Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

