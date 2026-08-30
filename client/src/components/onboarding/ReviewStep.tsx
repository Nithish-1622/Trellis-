import type { OnboardingDraft, OnboardingStep } from '../../services/onboardingService'

interface ReviewStepProps {
  draft: OnboardingDraft
  onEdit: (step: OnboardingStep) => void
}

function ReviewSection({ title, affects, onEdit, children }: { title: string; affects: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="border-b border-zinc-200 pb-5 last:border-0 last:pb-0 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{affects}</p>
        </div>
        <button type="button" aria-label={`Edit ${title.toLowerCase()}`} onClick={onEdit} className="rounded-md px-2 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/40">Edit</button>
      </div>
      <div className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  )
}

export default function ReviewStep({ draft, onEdit }: ReviewStepProps) {
  const position = draft.current_position
  const projectCount = position?.resume_projects?.length || 0
  const certificationCount = position?.resume_certifications?.length || 0

  return (
    <section className="space-y-6">
      <div>
        <h1 id="onboarding-step-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">Review your learning profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">Confirm these details before Trellis builds a roadmap. Your profile is saved first, so a generation failure will never make you repeat onboarding.</p>
      </div>
      <div className="space-y-5">
        <ReviewSection title="Goal" affects="Determines the target skill set, milestone outcomes, and timeline." onEdit={() => onEdit('goal')}>
          <p className="font-medium text-zinc-900 dark:text-white">{draft.goal?.target_role || 'No target role'}</p>
          <p>{draft.goal?.objective}</p>
          {draft.goal?.target_date && <p>Target date: {draft.goal.target_date}</p>}
        </ReviewSection>
        <ReviewSection title="Current position" affects="Prevents redundant recommendations and sets the starting difficulty." onEdit={() => onEdit('current_position')}>
          {position?.resume_filename && <p className="mb-2 font-medium text-emerald-800 dark:text-emerald-300">Imported from {position.resume_filename}</p>}
          <p>{position?.current_role || 'Role not specified'} · {position?.experience_years ?? 0} years</p>
          <p>{position?.education_level || 'Education not specified'}</p>
          <p>{position?.skills.map((skill) => `${skill.name} (${skill.proficiency}${skill.evidence_source === 'resume' ? ', resume' : ''})`).join(', ') || 'No skills added'}</p>
          {position?.resume_filename && <p className="mt-1 text-xs text-zinc-500">{projectCount} {projectCount === 1 ? 'project' : 'projects'} · {certificationCount} {certificationCount === 1 ? 'certification' : 'certifications'} used as supporting context</p>}
        </ReviewSection>
        <ReviewSection title="Previous learning" affects="Completed work can satisfy prerequisites or provide supporting evidence." onEdit={() => onEdit('previous_learning')}>
          <p>{draft.previous_learning?.courses.length || 0} completed learning items</p>
        </ReviewSection>
        <ReviewSection title="Preferences and availability" affects="Controls schedule density and how courses, projects, and media are ranked." onEdit={() => onEdit('preferences')}>
          <p>{draft.preferences?.weekly_hours || 0} hours per week · {draft.preferences?.preferred_formats.join(', ') || 'No format preference'}</p>
        </ReviewSection>
      </div>
    </section>
  )
}
