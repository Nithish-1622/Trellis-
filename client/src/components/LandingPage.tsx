import React from 'react';
import { TrellisLogo } from './TrellisLogo';
import {
  ArrowRight,
  Brain,
  Compass,
  CheckCircle2,
  Target,
  Terminal,
  BookOpen,
  ChevronRight,
  Sprout,
  Shield,
  Sparkles,
  Cpu,
  Database
} from 'lucide-react';
import { GlassIcons } from './GlassIcons';
import Hero21 from './Hero21';
import Features4 from './Features4';
import SocialProof15 from './SocialProof15';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreResources: () => void;
  onOpenOnboarding?: () => void;
}

const STATIC_SKILL_PREVIEW = [
  { label: 'Programming & Patterns', current: 72, target: 90, color: '#10b981' },
  { label: 'Systems & Scalability', current: 58, target: 85, color: '#059669' },
  { label: 'Data & Algorithms', current: 65, target: 80, color: '#047857' },
  { label: 'Architecture RFCs', current: 80, target: 88, color: '#34d399' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreResources,
}) => {
  return (
    <div className="space-y-24 py-6 animate-in fade-in duration-500">

      {/* ── Hero 21: GLSL Aurora & Luminous Orb Section ───────────────────── */}
      <Hero21
        badgeText="AI-Powered Adaptive Learning Trellis"
        headline="Grow your engineering mastery on a living trellis."
        subheadline="Traditional roadmaps are rigid and linear. Trellis evaluates your real-world competencies, identifies your highest-leverage growth gaps, and cultivates an organic milestone path that blooms as you learn."
        onGetStarted={onGetStarted}
        onExploreResources={onExploreResources}
        primaryCtaText="Begin Your Trellis Path"
        secondaryCtaText="Browse Resources"
        rightElement={
          <div className="rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-literata font-bold text-sm text-slate-900 dark:text-white">
                  Trellis Skill Radar
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                Illustrative preview
              </span>
            </div>

            {/* Static illustrative skill bars */}
            <div className="space-y-4">
              {STATIC_SKILL_PREVIEW.map(skill => (
                <div key={skill.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{skill.label}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono">
                      {skill.current}% → {skill.target}%
                    </span>
                  </div>
                  {/* Current progress bar */}
                  <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{ width: `${skill.current}%`, background: skill.color }}
                    />
                    {/* Target marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-amber-400 dark:bg-amber-300 rounded-full"
                      style={{ left: `${skill.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom legend */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-500 dark:text-slate-400">Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  <span className="text-slate-500 dark:text-slate-400">Target</span>
                </div>
              </div>
              <button
                onClick={onGetStarted}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Calibrate yours</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      />

      {/* ── 3 Core Pillars Section ───────────────────────────────────────── */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Architectural Growth Reimagined
          </span>
          <h2 className="font-literata text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            How the Trellis Methodology Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Engineering mastery is not a straight line. Like vines climbing a trellis, your knowledge builds across dimensions supported by solid structural foundations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-md">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
                1. Continuous Skill Radar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Benchmark your proficiency across 6 key dimensions: <em>Programming</em>, <em>Data & Math</em>, <em>Systems Design</em>, <em>Communication</em>, <em>Leadership</em>, and <em>Research</em>.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Target Profile Benchmarking</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
                2. Organic Milestone Vines
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Milestones sprout dynamically based on your diagnostic answers and feedback. Filter between your full trajectory and immediate weekly sprint goals with clear prerequisite trees.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>"Why This?" Algorithmic Transparency</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 dark:bg-emerald-700 text-white flex items-center justify-center shadow-md">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white">
                3. Adaptive Skill-Checks
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Validate your claimed proficiency with scenario-based Q&A. Get per-answer feedback and a final assessment that feeds back into your learner skill profile.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Domain × Proficiency Assessment</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3D Glass Morphism Domain Quick Launcher ────────────────────── */}
      <section className="p-8 sm:p-10 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Interactive Domains
          </span>
          <h3 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Explore Architecture Specialties
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hover over any glass domain cartridge to preview curriculum focus areas.
          </p>
        </div>

        <GlassIcons
          items={[
            { icon: <Cpu className="w-6 h-6" />, color: 'emerald', label: 'Distributed Sys', onClick: onGetStarted },
            { icon: <Brain className="w-6 h-6" />, color: 'blue', label: 'AI & Inference', onClick: onGetStarted },
            { icon: <Database className="w-6 h-6" />, color: 'purple', label: 'Event Sagas', onClick: onGetStarted },
            { icon: <Shield className="w-6 h-6" />, color: 'red', label: 'Zero-Trust Sec', onClick: onGetStarted },
            { icon: <Terminal className="w-6 h-6" />, color: 'indigo', label: 'Cloud & Mesh', onClick: onGetStarted },
            { icon: <Target className="w-6 h-6" />, color: 'orange', label: 'DDD & RFCs', onClick: onGetStarted }
          ]}
        />
      </section>

      {/* ── Features 4: Auto-Cycling Feature Tabbed Showcase ──────────────── */}
      <Features4 onCtaClick={onGetStarted} />

      {/* ── Featured Learning Tracks ─────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Specialized Roadmaps
            </span>
            <h2 className="font-literata text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Curated Architectural Tracks
            </h2>
          </div>
          <button
            onClick={onGetStarted}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Sign in to view all tracks</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Track 1 */}
          <div
            onClick={onGetStarted}
            className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md bg-white dark:bg-slate-900"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Primary Track
              </span>
              <span className="text-xs text-slate-400 font-mono">6 Milestones</span>
            </div>
            <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
              Senior Systems Architect
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Master microservices boundaries, asynchronous event choreography, transactional outbox patterns, and zero-trust service mesh.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span>View Milestone Vine</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Track 2 */}
          <div
            onClick={onGetStarted}
            className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md bg-white dark:bg-slate-900"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Cloud & SRE
              </span>
              <span className="text-xs text-slate-400 font-mono">5 Milestones</span>
            </div>
            <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
              Cloud Infrastructure & Platform Engineering
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Design multi-cluster Kubernetes topologies, GitOps delivery pipelines with ArgoCD, and automated canary deployments.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span>View Milestone Vine</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Track 3 */}
          <div
            onClick={onGetStarted}
            className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md bg-white dark:bg-slate-900"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Data Streaming
              </span>
              <span className="text-xs text-slate-400 font-mono">5 Milestones</span>
            </div>
            <h3 className="font-literata text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
              Event Streams & Real-Time Data
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Architect Kafka log partitions, event sourcing aggregates, CQRS read-model projections, and change-data capture.
            </p>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span>View Milestone Vine</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof 15: Spotlight Customer Story & Author Rail ──────── */}
      <SocialProof15 />

      {/* ── Callout Banner ───────────────────────────────────────────────── */}
      <section className="rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-500/5 via-white dark:via-slate-900 to-emerald-500/10 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
              <Brain className="w-3.5 h-3.5" />
              <span>Adaptive Skill-Check Engine</span>
            </div>
            <h3 className="font-literata text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Validate what you know before you build a roadmap.
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Select a skill domain and your claimed proficiency. Trellis generates 5 adaptive scenario questions, gives per-answer rationale, and calibrates your radar — so your learning path starts from reality, not guesswork.
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col gap-3">
            <button
              onClick={onGetStarted}
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 py-3.5 px-5 rounded-2xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreResources}
              className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Browse Resource Library</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="text-center py-10 space-y-6 max-w-xl mx-auto flex flex-col items-center">
        <TrellisLogo size="xl" layout="vertical" />
        <h2 className="font-literata text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          Ready to cultivate your architecture roadmap?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Create your account, complete a quick profile setup, and get an organic learning path tailored to exactly where you are and where you want to grow.
        </p>
        <div className="pt-2">
          <button
            onClick={onGetStarted}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            Start Growing — It's Free
          </button>
        </div>
      </section>
    </div>
  );
};
