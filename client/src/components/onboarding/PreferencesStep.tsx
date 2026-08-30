import type { LearningPreferencesDraft } from '../../services/onboardingService'
import { Field, SelectInput, TextInput } from './fields'

interface PreferencesStepProps {
  value: LearningPreferencesDraft
  onChange: (value: LearningPreferencesDraft) => void
  errors: Record<string, string>
}

const formats = ['course', 'video', 'article', 'project', 'quiz']

export default function PreferencesStep({ value, onChange, errors }: PreferencesStepProps) {
  const toggleFormat = (format: string) => onChange({ ...value, preferred_formats: value.preferred_formats.includes(format) ? value.preferred_formats.filter((item) => item !== format) : [...value.preferred_formats, format] })

  return (
    <section className="space-y-6">
      <div><h1 id="onboarding-step-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">How should learning fit your life?</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">Availability shapes the schedule. Format, budget, and accessibility choices affect which verified resources rank highest.</p></div>
      <fieldset><legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Preferred formats</legend><div className="mt-3 flex flex-wrap gap-2">{formats.map((format) => <label key={format} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${value.preferred_formats.includes(format) ? 'border-indigo-600 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}><input type="checkbox" className="sr-only" checked={value.preferred_formats.includes(format)} onChange={() => toggleFormat(format)} /><span className="capitalize">{format}</span></label>)}</div></fieldset>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Hours available each week" htmlFor="weekly-hours" error={errors.weekly_hours}><TextInput id="weekly-hours" type="number" min="1" max="80" step="0.5" value={value.weekly_hours ?? ''} onChange={(event) => onChange({ ...value, weekly_hours: event.target.value ? Number(event.target.value) : null })} /></Field>
        <Field label="Preferred session length" htmlFor="session-length" optional><SelectInput id="session-length" value={value.preferred_session_minutes ?? ''} onChange={(event) => onChange({ ...value, preferred_session_minutes: event.target.value ? Number(event.target.value) : null })}><option value="">No preference</option><option value="25">25 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></SelectInput></Field>
        <Field label="Pace" htmlFor="learning-pace" optional><SelectInput id="learning-pace" value={value.learning_pace || ''} onChange={(event) => onChange({ ...value, learning_pace: event.target.value || null })}><option value="">No preference</option><option value="gentle">Gentle</option><option value="steady">Steady</option><option value="intensive">Intensive</option></SelectInput></Field>
        <Field label="Budget" htmlFor="budget" optional><SelectInput id="budget" value={value.budget || ''} onChange={(event) => onChange({ ...value, budget: event.target.value || null })}><option value="">No preference</option><option value="free_only">Free only</option><option value="free_or_paid">Free or paid</option><option value="paid_certificates">Paid certificates are useful</option></SelectInput></Field>
        <Field label="Language" htmlFor="preferred-language" optional><TextInput id="preferred-language" value={value.preferred_language || ''} onChange={(event) => onChange({ ...value, preferred_language: event.target.value })} /></Field>
        <Field label="Accessibility needs" htmlFor="accessibility-needs" optional hint="Separate needs with commas. These preferences influence resource ranking."><TextInput id="accessibility-needs" value={value.accessibility_needs.join(', ')} onChange={(event) => onChange({ ...value, accessibility_needs: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Captions, transcripts" /></Field>
      </div>
      <Field label={`Project focus: ${value.project_theory_balance ?? 50}%`} htmlFor="project-balance" hint="0% favors theory; 100% favors hands-on projects."><input id="project-balance" type="range" min="0" max="100" step="10" value={value.project_theory_balance ?? 50} onChange={(event) => onChange({ ...value, project_theory_balance: Number(event.target.value) })} className="mt-3 w-full accent-indigo-600" /></Field>
    </section>
  )
}
