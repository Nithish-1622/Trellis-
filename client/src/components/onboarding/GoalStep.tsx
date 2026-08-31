import { useState } from 'react'
import type { GoalDraft } from '../../services/onboardingService'
import { analyzeGoal } from '../../services/onboardingService'
import { Field, TextArea, TextInput } from './fields'

interface GoalStepProps {
  value: GoalDraft
  onChange: (value: GoalDraft) => void
  errors: Record<string, string>
}

export default function GoalStep({ value, onChange, errors }: GoalStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisExplanation, setAnalysisExplanation] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (value.free_text.trim().length < 10) return
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisExplanation(null)
    try {
      const result = await analyzeGoal(value.free_text)
      onChange({
        ...value,
        target_role: result.target_role,
        objective: result.objective,
        target_date: result.target_date,
      })
      setAnalysisExplanation(result.explanation)
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'We could not analyze that goal. You can fill in the fields manually.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 id="onboarding-step-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">What do you want to achieve?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">Describe the outcome in your own words. Trellis will propose a role, objective, and timeline for you to review—not silently decide them.</p>
      </div>

      <Field label="What do you want to achieve?" htmlFor="goal-free-text" hint="Include the role, capability, or outcome you care about and any timing constraints." error={errors.free_text}>
        <TextArea id="goal-free-text" value={value.free_text} aria-describedby="goal-free-text-hint goal-free-text-error" onChange={(event) => onChange({ ...value, free_text: event.target.value })} placeholder="For example: I want to move from frontend development into backend engineering within 12 months." />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleAnalyze} disabled={isAnalyzing || value.free_text.trim().length < 10} className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
          {isAnalyzing ? 'Analyzing goal…' : 'Suggest goal details'}
        </button>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">You can edit every suggestion.</span>
      </div>
      {analysisError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{analysisError}</p>}
      {analysisExplanation && <p role="status" className="border-l-2 border-indigo-500 pl-3 text-sm text-zinc-700 dark:text-zinc-300">{analysisExplanation} Review and edit the proposal below before continuing.</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Target role" htmlFor="target-role" error={errors.target_role}>
          <TextInput id="target-role" value={value.target_role || ''} onChange={(event) => onChange({ ...value, target_role: event.target.value })} placeholder="Backend Engineer" />
        </Field>
        <Field label="Target date" htmlFor="target-date" optional hint="A flexible date is fine.">
          <TextInput id="target-date" type="date" value={value.target_date || ''} onChange={(event) => onChange({ ...value, target_date: event.target.value || null })} />
        </Field>
      </div>
      <Field label="Learning objective" htmlFor="learning-objective" hint="What should you be able to do when this path is complete?" error={errors.objective}>
        <TextArea id="learning-objective" value={value.objective || ''} onChange={(event) => onChange({ ...value, objective: event.target.value })} placeholder="Design, build, test, and deploy reliable production services." />
      </Field>
    </section>
  )
}
