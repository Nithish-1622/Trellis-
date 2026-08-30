import React, { useState } from 'react';
import { DiagnosticQuestion, SkillScores } from '../types';
import { DIAGNOSTIC_QUESTIONS } from '../data/tracks';
import { X, CheckCircle2, ArrowRight, RotateCcw, Brain, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DiagnosticModalProps {
  onClose: () => void;
  onUpdateScores: (newScores: SkillScores) => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  onClose,
  onUpdateScores
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);
  const [newScoresResult, setNewScoresResult] = useState<SkillScores | null>(null);

  const questions = DIAGNOSTIC_QUESTIONS;
  const currentQ = questions[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      let systemsScore = 55;
      let dataScore = 45;
      let logicScore = 65;
      let uxScore = 50;
      let agileScore = 60;

      questions.forEach((q, i) => {
        const isCorrect = answers[i] === q.correctIndex;
        const delta = isCorrect ? 20 : -5;
        if (q.category === 'systems') systemsScore += delta;
        if (q.category === 'data') dataScore += delta;
        if (q.category === 'logic') logicScore += delta;
        if (q.category === 'ux') uxScore += delta;
        if (q.category === 'agile') agileScore += delta;
      });

      const calculated: SkillScores = {
        systems: Math.min(95, Math.max(30, systemsScore)),
        data: Math.min(95, Math.max(30, dataScore)),
        logic: Math.min(95, Math.max(30, logicScore)),
        ux: Math.min(95, Math.max(30, uxScore)),
        agile: Math.min(95, Math.max(30, agileScore))
      };

      setNewScoresResult(calculated);
      setCompleted(true);
      onUpdateScores(calculated);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#f59e0b', '#fbbf24']
        });
      } catch {
        // ignore
      }
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setAnswers({});
    setCompleted(false);
    setNewScoresResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Interactive Skill Diagnostic
              </span>
              <h3 className="font-literata text-lg font-bold text-slate-900 dark:text-white">
                Adaptive Competency Assessment
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {!completed ? (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  {currentQ.category}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="space-y-4">
                <h4 className="font-literata text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </h4>

                {/* Options */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = answers[currentIdx] === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectOption(i)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer navigation */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={answers[currentIdx] === undefined}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{currentIdx < questions.length - 1 ? 'Next Question' : 'Complete Diagnostic'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Completed Result */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-2xl shadow-md">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-literata text-2xl font-bold text-slate-900 dark:text-white">
                  Radar Calibrated Successfully
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your answers have calibrated your 6-axis skill geometry. Your milestone path has adapted to target your highest-leverage growth areas.
                </p>
              </div>

              {newScoresResult && (
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {Object.entries(newScoresResult).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{k}</span>
                      <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{v}%</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  View Adapted Roadmap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
