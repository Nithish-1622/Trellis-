import { useState } from 'react'
import type { CurrentPositionDraft, SkillDraft } from '../../services/onboardingService'
import { Field, SelectInput, TextInput } from './fields'
import ResumeCapabilityImport from './ResumeCapabilityImport'
import type { ResumeCapabilities } from '../../services/learningHistoryService'

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

  const applyResume = (capabilities: ResumeCapabilities) => {
    const existingSkills = new Set(value.skills.map((skill) => skill.name.toLocaleLowerCase()))
    const resumeSkills: SkillDraft[] = capabilities.skills
      .filter((skill) => !existingSkills.has(skill.name.toLocaleLowerCase()))
      .map((skill) => ({
        name: skill.name,
        proficiency: skill.proficiency,
        evidence_source: 'resume',
        evidence_rationale: skill.rationale,
      }))
    onChange({
      ...value,
      current_role: value.current_role?.trim() ? value.current_role : capabilities.current_role,
      experience_years: value.experience_years ?? capabilities.experience_years,
      education_level: value.education_level?.trim() ? value.education_level : capabilities.education_level,
      skills: [...value.skills, ...resumeSkills],
      resume_filename: capabilities.filename,
      resume_file_id: capabilities.resume_file_id,
      resume_certifications: capabilities.certifications,
      resume_projects: capabilities.projects,
    })
  }

  const updateSkillLevel = (skill: SkillDraft, nextLevel: SkillDraft['proficiency']) => {
    onChange({
      ...value,
      skills: value.skills.map((item) => item === skill ? { ...item, proficiency: nextLevel } : item),
    })
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 id="onboarding-step-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">Where are you starting from?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">This helps us skip material you already know. Everything here is editable later, and only your skills are required for gap analysis.</p>
      </div>
      <ResumeCapabilityImport onApply={applyResume} />
      {value.resume_filename && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"><strong>{value.resume_filename}</strong> was imported. Review the suggested role, experience, education, and skill levels below before continuing.</p>}
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
              <li key={skill.name.toLowerCase()} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{skill.name} {skill.evidence_source === 'resume' && <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">From resume</span>}</p>{skill.evidence_rationale && <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{skill.evidence_rationale}</p>}</div>
                <div className="flex items-center gap-2"><label htmlFor={`skill-level-${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="sr-only">Proficiency for {skill.name}</label><select id={`skill-level-${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} value={skill.proficiency} onChange={(event) => updateSkillLevel(skill, event.target.value as SkillDraft['proficiency'])} className="min-h-10 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">{proficiencyOptions.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select>
                <button type="button" aria-label={`Remove ${skill.name}`} onClick={() => onChange({ ...value, skills: value.skills.filter((item) => item !== skill) })} className="min-h-10 rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-300">Remove</button></div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </section>
  )
}
