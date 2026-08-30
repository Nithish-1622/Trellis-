import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrellisLogo } from './TrellisLogo';
import { StemProgressBar } from './StemProgressBar';
import Stepper, { Step } from './Stepper';
import { ResumeDropper } from './ResumeDropper';
import { createLearningProfile, generatePersonalizedRoadmap, saveGeneratedRoadmap, saveLearningProfile } from '../services/learningPathEngine';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mic,
  MicOff,
  Tag,
  Plus,
  X,
  Layers,
  Award,
  BookOpen,
  Cpu,
  Shield,
  Brain,
  Globe,
  Database,
  Upload,
  FileText,
  SkipForward
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const DOMAIN_OPTIONS = [
  { id: 'Distributed Systems', label: 'Distributed Systems & Scaling', icon: Cpu, desc: 'Consensus, CAP theorem, sharding, and resilience.' },
  { id: 'Software Architecture', label: 'Software Architecture & DDD', icon: Layers, desc: 'Domain-driven design, clean architecture, and modularity.' },
  { id: 'Cloud & DevOps', label: 'Cloud & Kubernetes (DevOps)', icon: Globe, desc: 'Containers, service mesh, CI/CD, and multi-region infra.' },
  { id: 'AI/ML Engineering', label: 'AI & Systems Engineering', icon: Brain, desc: 'LLM agents, vector databases, and inference pipelines.' },
  { id: 'Security & Zero-Trust', label: 'Security & Zero-Trust Mesh', icon: Shield, desc: 'mTLS, cryptographic auth, OAuth2, and audit logging.' },
  { id: 'Data Engineering', label: 'Streaming Data & Sagas', icon: Database, desc: 'Kafka, CDC, event sourcing, and transactional outbox.' }
];

const PRESET_CERTIFICATIONS = [
  'AWS Certified Solutions Architect',
  'Certified Kubernetes Administrator (CKA)',
  "Distributed Systems Patterns (O'Reilly)",
  'Domain-Driven Design (Eric Evans)',
  'Google Cloud Professional Architect',
  'Microservices Patterns (Chris Richardson)',
  'Full-Stack TypeScript & React Mastery'
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Step 1: Resume Upload (optional)
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Step 2: Domain Interests
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    user?.domainInterests?.length ? user.domainInterests : ['Distributed Systems', 'Software Architecture']
  );

  // Step 3: Skill Self-Rating (6 domains)
  const [skills, setSkills] = useState({
    programming: user?.skills?.programming || 50,
    dataMath: user?.skills?.dataMath || 50,
    design: user?.skills?.design || 50,
    communication: user?.skills?.communication || 50,
    leadership: user?.skills?.leadership || 50,
    research: user?.skills?.research || 50
  });

  // Step 4: Learning History
  const [historyTags, setHistoryTags] = useState<string[]>(
    user?.learningHistory?.length ? user.learningHistory : []
  );
  const [tagInput, setTagInput] = useState('');

  // Step 5: Learning Goal
  const [learningGoal, setLearningGoal] = useState<string>(user?.learningGoal || '');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported] = useState<boolean>(
    typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );

  // ── Resume handlers ───────────────────────────────────────────────────────
  const handleResumeFile = (file: File) => {
    if (!file) return;
    setResumeFile(file);
    setIsParsingResume(true);
    setTimeout(() => {
      setIsParsingResume(false);
      setResumeParsed(true);
    }, 1500);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleResumeFile(file);
  };

  const toggleDomain = (domainId: string) => {
    if (selectedDomains.includes(domainId)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domainId));
    } else {
      setSelectedDomains([...selectedDomains, domainId]);
    }
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !historyTags.includes(trimmed)) {
      setHistoryTags([...historyTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setHistoryTags(historyTags.filter(t => t !== tagToRemove));
  };

  const toggleSpeechRecognition = () => {
    if (!speechSupported) return;
    if (isRecording) { setIsRecording(false); return; }
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
        setLearningGoal(prev => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsRecording(false);
    }
  };

  const handleFinish = () => {
    const profile = createLearningProfile({
      goal: learningGoal,
      interests: selectedDomains,
      skills,
      learningHistory: historyTags,
      weeklyHours: 6,
      learningStyle: 'balanced',
      difficulty: 'moderate'
    });
    saveLearningProfile(profile);
    saveGeneratedRoadmap(generatePersonalizedRoadmap(profile));
    completeOnboarding({
      domainInterests: selectedDomains,
      skills,
      learningHistory: historyTags,
      learningGoal,
      resumeUploaded: !!resumeFile,
      resumeFileName: resumeFile?.name
    });
    onComplete();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Top Brand Header */}
      <div className="text-center space-y-1">
        <TrellisLogo size="md" className="justify-center" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalized Learning Path Calibration
        </p>
      </div>

      <div className="w-full">
        <Stepper
          initialStep={1}
          currentStep={step}
          onStepChange={newStep => setStep(newStep)}
          onFinalStepCompleted={handleFinish}
          stepCircleContainerClassName="p-2 sm:p-4"
          nextButtonText="Continue"
          backButtonText="Back"
        >
          {/* STEP 1: RESUME UPLOAD (AI RESUME DROPPER) */}
          <Step key="step-1">
            <div className="space-y-6 animate-in fade-in duration-300">
              <ResumeDropper
                onParsed={data => {
                  setResumeFile({ name: data.fileName } as any);
                  setResumeParsed(true);
                  setSkills(prev => ({
                    ...prev,
                    ...data.inferredSkills
                  }));
                  if (data.detectedTags?.length) {
                    setHistoryTags(prev => Array.from(new Set([...prev, ...data.detectedTags])));
                  }
                  // Move to step 2 after a brief delay
                  setTimeout(() => {
                    setStep(2);
                  }, 400);
                }}
                onSkip={() => setStep(2)}
              />
            </div>
          </Step>

          {/* STEP 2: DOMAIN SELECTION */}
          <Step key="step-2">
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Step 2: Architecture Domains
                </span>
                <h2 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  Which specialties do you want to master?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Select your primary focus areas. Trellis will tailor your milestone sequence accordingly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {DOMAIN_OPTIONS.map(opt => {
                  const isSelected = selectedDomains.includes(opt.id);
                  const IconComponent = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleDomain(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{opt.label}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Step>

          {/* STEP 3: SKILL RATINGS */}
          <Step key="step-3">
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Step 3: Root Baseline
                </span>
                <h2 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  Rate your current skill strengths
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Drag the sliders to establish your initial Trellis Radar geometry.
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                {[
                  { key: 'programming', label: 'Programming & Architecture Patterns', val: skills.programming },
                  { key: 'dataMath', label: 'Data, Algorithms & Mathematics', val: skills.dataMath },
                  { key: 'design', label: 'Systems Design & API Usability', val: skills.design },
                  { key: 'communication', label: 'Technical Writing & Architecture RFCs', val: skills.communication },
                  { key: 'leadership', label: 'Technical Leadership & Mentorship', val: skills.leadership },
                  { key: 'research', label: 'Emerging Tech & Protocol Research', val: skills.research }
                ].map(item => (
                  <div key={item.key} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                      <span>{item.label}</span>
                      <span className="font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {item.val}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={item.val}
                      onChange={e => setSkills({ ...skills, [item.key]: parseInt(e.target.value, 10) })}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-emerald-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Step>

          {/* STEP 4: LEARNING HISTORY */}
          <Step key="step-4">
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Step 4: Prior Knowledge
                </span>
                <h2 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  What have you already studied?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Add past courses, certifications, and technologies to skip basic prerequisites.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput); } }}
                      placeholder="e.g. AWS Solutions Architect, Kubernetes CKA..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[48px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  {historyTags.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No past certifications added yet. Type above or pick from presets below.</span>
                  ) : (
                    historyTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{tag}</span>
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 transition-colors ml-0.5 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    Popular Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CERTIFICATIONS.filter(p => !historyTags.includes(p)).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddTag(preset)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{preset}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Step>

          {/* STEP 5: LEARNING GOAL */}
          <Step key="step-5">
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Step 5: Target Role & Goal
                </span>
                <h2 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  State your primary learning ambition
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Tell Trellis what system or milestone you want to achieve.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="relative">
                  <textarea
                    rows={4}
                    value={learningGoal}
                    onChange={e => setLearningGoal(e.target.value)}
                    placeholder="e.g. I want to master multi-region database sharding, lead distributed system architectural reviews, and reach Principal Architect level within 6 months."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white leading-relaxed resize-none"
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                        isRecording
                          ? 'bg-rose-500 text-white animate-pulse shadow-lg'
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                      title={isRecording ? 'Listening... click to stop' : 'Click to speak your goal'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isRecording ? 'Listening...' : 'Voice Input'}</span>
                    </button>
                  )}
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Speech recognition active: speak naturally into your microphone...</span>
                  </div>
                )}
              </div>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
};
