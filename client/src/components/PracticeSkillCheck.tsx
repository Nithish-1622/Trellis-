import React, { useState } from 'react';
import { SkillCheckQuestion, SkillCheckReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { generateSkillCheckQuestions, generateSkillCheckReport } from '../services/agentService';
import { StemProgressBar } from './StemProgressBar';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Award,
  Leaf,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PracticeSkillCheckProps {
  onNavigateRoadmap?: () => void;
}

export const PracticeSkillCheck: React.FC<PracticeSkillCheckProps> = ({
  onNavigateRoadmap
}) => {
  const { user, updateProfile } = useAuth();
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'report'>('setup');
  const [domain, setDomain] = useState<string>('Distributed Systems & Scaling');
  const [proficiency, setProficiency] = useState<'Junior' | 'Mid' | 'Senior' | 'Lead'>('Senior');

  // Quiz State
  const [questions, setQuestions] = useState<SkillCheckQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Final Assessment Report
  const [report, setReport] = useState<SkillCheckReport | null>(null);

  const startAssessment = () => {
    setIsLoading(true);
    setTimeout(() => {
      const generated = generateSkillCheckQuestions(domain, proficiency);
      setQuestions(generated);
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedOption(null);
      setHasAnsweredCurrent(false);
      setPhase('quiz');
      setIsLoading(false);
    }, 600);
  };

  const handleSelectOption = (index: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedOption(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);
    setHasAnsweredCurrent(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setHasAnsweredCurrent(false);
    } else {
      // Calculate assessment report
      const rep = generateSkillCheckReport(domain, proficiency, questions, userAnswers);
      setReport(rep);
      setPhase('report');

      if (rep.percentage >= 60) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#059669', '#fbbf24']
        });
      }
    }
  };

  const handleApplyToRadar = () => {
    if (!report) return;

    // Update skill profile
    updateProfile({
      skills: {
        ...(user?.skills || {}),
        systems: Math.min(96, 65 + report.score * 6),
        programming: Math.min(95, 70 + report.score * 5),
        dataMath: Math.min(92, 60 + report.score * 6),
        design: Math.min(94, 65 + report.score * 5),
        communication: Math.min(90, 70 + report.score * 4),
        leadership: Math.min(90, 65 + report.score * 5),
        research: Math.min(90, 60 + report.score * 5)
      }
    });

    if (onNavigateRoadmap) onNavigateRoadmap();
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* ── 1. SETUP PHASE ── */}
      {phase === 'setup' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              <span>Skill-Check Diagnostic</span>
            </span>
            <h1 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Adaptive Architecture Assessment
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Test your real-world system design competence. 5 scenario-based questions will evaluate your mastery and calibrate your Trellis roadmap canopy.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Domain Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Select Architecture Domain
              </label>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Distributed Systems & Scaling">Distributed Systems & High-Throughput Scaling</option>
                <option value="Event-Driven Sagas & Kafka">Event-Driven Architecture & Transactional Outbox</option>
                <option value="Service Mesh & Zero-Trust">Service Mesh, Istio & Zero-Trust Governance</option>
                <option value="Multi-Region Database Sharding">Multi-Region Databases & Active-Active Sharding</option>
              </select>
            </div>

            {/* Proficiency Claim */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Claimed Proficiency Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Junior', 'Mid', 'Senior', 'Lead'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setProficiency(lvl)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      proficiency === lvl
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lvl} Level
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              5 Scenario Questions • Instant Feedback
            </span>
            <button
              type="button"
              onClick={startAssessment}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Generating Adaptive Questions...</span>
              ) : (
                <>
                  <span>Begin Diagnostic</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── 2. QUIZ PHASE ── */}
      {phase === 'quiz' && currentQ && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Progress Header */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="w-44">
              <StemProgressBar
                progress={((currentIndex + 1) / questions.length) * 100}
                height={8}
                showLeaves={false}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                  {currentQ.difficulty} Scenario
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {currentQ.domain}
                </span>
              </div>
              <h2 className="font-literata text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.scenario}
              </h2>
            </div>

            {/* Optional Code Snippet */}
            {currentQ.codeSnippet && (
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                <pre>{currentQ.codeSnippet}</pre>
              </div>
            )}

            {/* Options List */}
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100';

                if (hasAnsweredCurrent) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                  } else {
                    btnStyle = 'border-slate-200 dark:border-slate-800 opacity-40 text-slate-500';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-white';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnsweredCurrent}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                    {hasAnsweredCurrent && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {hasAnsweredCurrent && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation */}
            {hasAnsweredCurrent && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Architecture Rationale:</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              {!hasAnsweredCurrent ? (
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  disabled={selectedOption === null}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Assessment Report'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. REPORT PHASE ── */}
      {phase === 'report' && report && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
          
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-3xl shadow-xl border-4 border-white dark:border-slate-800">
              {report.percentage >= 80 ? (
                <Trophy className="w-10 h-10 text-white drop-shadow-md" />
              ) : report.percentage >= 60 ? (
                <Award className="w-10 h-10 text-white drop-shadow-md" />
              ) : (
                <Sparkles className="w-10 h-10 text-white drop-shadow-md" />
              )}
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Assessment Results
            </span>
            <h2 className="font-literata text-3xl font-bold text-slate-900 dark:text-white">
              {report.bloomStage}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              You scored <strong className="text-emerald-600 dark:text-emerald-400">{report.score} of {report.total} ({report.percentage}%)</strong> in {report.domain}.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <StemProgressBar
              progress={report.percentage}
              label={`Assessed Mastery: ${report.bloomStage}`}
              height={12}
            />
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Validated Strengths</span>
              </span>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                {report.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-amber-600" />
                <span>Recommended Focus Areas</span>
              </span>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                {report.growthAreas.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Node */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recommended Roadmap Milestone:
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {report.recommendedNodeTitle}
              </h4>
            </div>
            <button
              onClick={handleApplyToRadar}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Calibrate Trellis Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setPhase('setup')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Take diagnostic on a different domain
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
