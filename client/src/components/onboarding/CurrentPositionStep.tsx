import { useState } from 'react'
import type { CurrentPositionDraft, SkillDraft } from '../../services/onboardingService'
import { Field, SelectInput, TextInput } from './fields'

interface CurrentPositionStepProps {
  value: CurrentPositionDraft
  onChange: (value: CurrentPositionDraft) => void
}

const proficiencyOptions: SkillDraft['proficiency'][] = ['beginner', 'intermediate', 'advanced', 'expert']

export default function CurrentPositionStep({ value, onChange }: CurrentPositionStepProps) {
  const [skillName, setSkillName] = useState('')
  const [proficiency, setProficiency] = useState<SkillDraft['proficiency']>('beginner')

  const addSkill = () => {
    const name = skillName.trim()
    if (!name || value.skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) return
    onChange({ ...value, skills: [...value.skills, { name, proficiency, evidence_source: 'self_reported' }] })
    setSkillName('')
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 id="onboarding-step-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">Where are you starting from?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">This helps us skip material you already know. Everything here is editable later, and only your skills are required for gap analysis.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Current role" htmlFor="current-role" optional>
          <TextInput id="current-role" value={value.current_role || ''} onChange={(event) => onChange({ ...value, current_role: event.target.value })} placeholder="Junior Developer" />
        </Field>
        <Field label="Years of experience" htmlFor="experience-years" optional>
          <TextInput id="experience-years" type="number" min="0" max="80" step="0.5" value={value.experience_years ?? ''} onChange={(event) => onChange({ ...value, experience_years: event.target.value ? Number(event.target.value) : null })} />
        </Field>
      </div>
      <Field label="Education" htmlFor="education" optional>
        <TextInput id="education" value={value.education_level || ''} onChange={(event) => onChange({ ...value, education_level: event.target.value })} placeholder="Degree, bootcamp, self-taught, or another path" />
      </Field>
      <Field label="Interests" htmlFor="interests" optional hint="Separate interests with commas.">
        <TextInput id="interests" value={value.interests.join(', ')} onChange={(event) => onChange({ ...value, interests: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Distributed systems, developer tools" />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Skills</legend>
        <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">Add a self-rating now. Assessments and evidence will adjust confidence later without overwriting your input.</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_11rem_auto]">
          <TextInput aria-label="Skill name" value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="Python" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill() } }} />
          <SelectInput aria-label="Skill proficiency" value={proficiency} onChange={(event) => setProficiency(event.target.value as SkillDraft['proficiency'])}>
            {proficiencyOptions.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
          </SelectInput>
          <button type="button" onClick={addSkill} className="mt-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">Add skill</button>
        </div>
        {value.skills.length === 0 ? (
          <p className="rounded-lg bg-zinc-100 px-3 py-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">No skills added yet. Add at least the skills most relevant to your goal.</p>
        ) : (
          <ul aria-label="Added skills" className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {value.skills.map((skill) => (
              <li key={skill.name.toLowerCase()} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{skill.name} <span className="font-normal text-zinc-600 dark:text-zinc-400">· {skill.proficiency}</span></span>
                <button type="button" aria-label={`Remove ${skill.name}`} onClick={() => onChange({ ...value, skills: value.skills.filter((item) => item !== skill) })} className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-300">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </section>
  )
}
