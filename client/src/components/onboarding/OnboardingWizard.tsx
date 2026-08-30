import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getOnboarding, saveOnboarding } from '../../services/onboardingService'
import type { OnboardingDraft, OnboardingStep } from '../../services/onboardingService'
import { trackOnboardingEvent } from '../../services/analytics'
import { createRoadmap } from '../../services/roadmapService'
import { discoverResources, waitForDiscovery } from '../../services/resourceService'
import CurrentPositionStep from './CurrentPositionStep'
import GoalStep from './GoalStep'
import HistoryStep from './HistoryStep'
import PreferencesStep from './PreferencesStep'
import ReviewStep from './ReviewStep'

const steps: { id: OnboardingStep; label: string }[] = [{ id: 'goal', label: 'Goal' }, { id: 'current_position', label: 'Current position' }, { id: 'previous_learning', label: 'Previous learning' }, { id: 'preferences', label: 'Preferences' }, { id: 'review', label: 'Review' }]

const emptyDraft: OnboardingDraft = {
  goal: { free_text: '', target_role: '', objective: '', target_date: null },
  current_position: { current_role: '', experience_years: null, education_level: '', interests: [], skills: [] },
  previous_learning: { courses: [] },
  preferences: { preferred_formats: [], project_theory_balance: 50, learning_pace: 'steady', weekly_hours: null, preferred_language: 'English', budget: null, accessibility_needs: [], preferred_session_minutes: 45 },
}

const mergeDraft = (draft: OnboardingDraft): OnboardingDraft => ({
  goal: { ...emptyDraft.goal!, ...(draft.goal || {}) },
  current_position: { ...emptyDraft.current_position!, ...(draft.current_position || {}) },
  previous_learning: { ...emptyDraft.previous_learning!, ...(draft.previous_learning || {}) },
  preferences: { ...emptyDraft.preferences!, ...(draft.preferences || {}) },
})

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('goal')
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([])
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [profileSaved, setProfileSaved] = useState(false)
  const [preparationStatus, setPreparationStatus] = useState<string | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const currentStepRef = useRef<OnboardingStep>('goal')
  const completedRef = useRef(false)

  const loadOnboarding = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const session = await getOnboarding()
      if (session.status === 'completed' && !isEditing) {
        completedRef.current = true
        navigate('/profile', { replace: true })
        return
      }
      setCurrentStep(isEditing ? 'goal' : session.current_step)
      setCompletedSteps(session.completed_steps)
      setDraft(mergeDraft(session.draft))
      trackOnboardingEvent('onboarding_step_viewed', session.current_step)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load your onboarding progress.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOnboarding()
    // The initial server resume should run once for this mounted wizard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, isEditing])

  useEffect(() => {
    if (!isLoading) mainRef.current?.querySelector<HTMLElement>('#onboarding-step-title')?.focus()
  }, [currentStep, isLoading])

  useEffect(() => { currentStepRef.current = currentStep }, [currentStep])

  useEffect(() => () => {
    if (!completedRef.current) trackOnboardingEvent('onboarding_abandoned', currentStepRef.current)
  }, [])

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (currentStep === 'goal') {
      if ((draft.goal?.free_text.trim().length || 0) < 10) nextErrors.free_text = 'Describe your goal in at least 10 characters.'
      if (!draft.goal?.target_role?.trim()) nextErrors.target_role = 'Review or enter a target role.'
      if (!draft.goal?.objective?.trim()) nextErrors.objective = 'Review or enter a learning objective.'
    }
    if (currentStep === 'preferences' && !draft.preferences?.weekly_hours) nextErrors.weekly_hours = 'Enter the time you can realistically commit each week.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) trackOnboardingEvent('onboarding_validation_failed', currentStep)
    return Object.keys(nextErrors).length === 0
  }

  const saveAndMove = async (nextStep: OnboardingStep, complete = false) => {
    if (!validate()) return
    setIsSaving(true); setError(null)
    const nextCompleted = currentStep === 'review' ? completedSteps : Array.from(new Set([...completedSteps, currentStep]))
    try {
      await saveOnboarding({ current_step: nextStep, completed_steps: nextCompleted, draft, complete })
      setCompletedSteps(nextCompleted)
      trackOnboardingEvent(complete ? 'onboarding_completed' : 'onboarding_step_completed', currentStep)
      if (complete) {
        completedRef.current = true
        setProfileSaved(true)
        try {
          setPreparationStatus('Checking your learning-resource coverage…')
          try {
            const job = await discoverResources()
            await waitForDiscovery(job.id, (progress) => {
              setPreparationStatus(`Checking resource quality and coverage… ${progress.progress}%`)
            })
          } catch {
            setPreparationStatus('Live discovery is unavailable. Building from the Trellis resource index…')
          }
          await createRoadmap()
          navigate('/roadmap', { replace: true })
        } catch (generationError) {
          setError(`Your profile is saved. ${generationError instanceof Error ? generationError.message : 'We could not generate your roadmap.'} You can retry without repeating onboarding.`)
        }
      }
      else { setCurrentStep(nextStep); trackOnboardingEvent('onboarding_step_viewed', nextStep) }
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'We could not save your progress. Please try again.') }
    finally { setIsSaving(false) }
  }

  const index = steps.findIndex((step) => step.id === currentStep)
  const goBack = async () => {
    if (index <= 0) return
    setIsSaving(true); setError(null)
    const previousStep = steps[index - 1].id
    try { await saveOnboarding({ current_step: previousStep, completed_steps: completedSteps, draft, complete: false }); setCurrentStep(previousStep) }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'We could not save your progress.') }
    finally { setIsSaving(false) }
  }

  if (isLoading) return <div aria-busy="true" aria-label="Loading onboarding" className="space-y-4"><div className="h-7 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" /></div>

  if (error && !draft.goal?.free_text && completedSteps.length === 0) {
    return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"><p className="font-semibold">We could not restore your onboarding progress.</p><p className="mt-1">{error}</p><button type="button" onClick={() => void loadOnboarding()} className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white dark:text-zinc-950">Try again</button></div>
  }

  return <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
    <aside aria-label="Onboarding progress"><p className="text-sm font-semibold text-zinc-900 dark:text-white">Your learning profile</p><p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Step {index + 1} of {steps.length}</p><ol className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1">{steps.map((step, stepIndex) => <li key={step.id}><button type="button" disabled={stepIndex > index && !completedSteps.includes(step.id)} onClick={() => setCurrentStep(step.id)} aria-current={step.id === currentStep ? 'step' : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:w-full ${step.id === currentStep ? 'bg-zinc-900 font-semibold text-white dark:bg-white dark:text-zinc-950' : completedSteps.includes(step.id) ? 'text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800' : 'text-zinc-500 disabled:cursor-not-allowed dark:text-zinc-500'}`}>{completedSteps.includes(step.id) && step.id !== currentStep ? '✓ ' : ''}{step.label}</button></li>)}</ol></aside>
    <div ref={mainRef} className="min-w-0">
      <p aria-live="polite" className="sr-only">{preparationStatus}</p>
      {error && <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"><span>{error}</span><button type="button" onClick={() => setError(null)} className="font-semibold underline">Dismiss</button></div>}
      {currentStep === 'goal' && <GoalStep value={draft.goal!} onChange={(goal) => setDraft({ ...draft, goal })} errors={fieldErrors} />}
      {currentStep === 'current_position' && <CurrentPositionStep value={draft.current_position!} onChange={(current_position) => setDraft({ ...draft, current_position })} />}
      {currentStep === 'previous_learning' && <HistoryStep value={draft.previous_learning!} onChange={(previous_learning) => setDraft({ ...draft, previous_learning })} />}
      {currentStep === 'preferences' && <PreferencesStep value={draft.preferences!} onChange={(preferences) => setDraft({ ...draft, preferences })} errors={fieldErrors} />}
      {currentStep === 'review' && <ReviewStep draft={draft} onEdit={setCurrentStep} />}
      {preparationStatus && profileSaved && <div aria-hidden="true" className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100"><span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-indigo-600" />{preparationStatus}</div>}
      <div className="mt-8 flex items-center justify-between gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800"><button type="button" onClick={goBack} disabled={index === 0 || isSaving || profileSaved} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:invisible dark:text-zinc-300 dark:hover:bg-zinc-800">Back</button><button type="button" onClick={() => currentStep === 'review' ? saveAndMove('review', true) : saveAndMove(steps[index + 1].id)} disabled={isSaving} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{isSaving ? (profileSaved ? 'Preparing your roadmap…' : 'Saving…') : currentStep === 'review' ? (profileSaved ? 'Retry roadmap generation' : 'Confirm and create roadmap') : 'Continue'}</button></div>
    </div>
  </div>
}
