import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../services/apiClient'
import { completeMilestone, createRoadmap, getCurrentRoadmap, updateMilestoneProgress } from '../services/roadmapService'
import type { LearningRoadmap, RoadmapMilestone } from '../services/roadmapService'
import { useThemeContext } from '../hooks/useThemeContext'
import RoadmapNavbar from '../components/roadmap-components/RoadmapNavbar'

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
  : 'Flexible'

export default function Roadmap() {
  const { darkMode, toggleTheme } = useThemeContext()
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasNoRoadmap, setHasNoRoadmap] = useState(false)

  const loadRoadmap = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRoadmap(await getCurrentRoadmap())
      setHasNoRoadmap(false)
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 404) setHasNoRoadmap(true)
      else setError(loadError instanceof Error ? loadError.message : 'We could not load your roadmap.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadRoadmap() }, [loadRoadmap])

  const generate = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      setRoadmap(await createRoadmap())
      setHasNoRoadmap(false)
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'We could not generate your roadmap.')
    } finally {
      setIsGenerating(false)
    }
  }

  const replaceMilestone = (updated: RoadmapMilestone) => {
    setRoadmap((current) => current ? {
      ...current,
      milestones: current.milestones.map((item) => item.id === updated.id ? updated : item),
    } : current)
  }

  const recordProgress = async (milestone: RoadmapMilestone) => {
    if (!roadmap) return
    setUpdatingId(milestone.id)
    setError(null)
    try {
      replaceMilestone(await updateMilestoneProgress(roadmap.id, milestone.id, Math.min(milestone.progress_percentage + 25, 100)))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'We could not update this milestone.')
    } finally {
      setUpdatingId(null)
    }
  }

  const markComplete = async (milestone: RoadmapMilestone) => {
    if (!roadmap) return
    setUpdatingId(milestone.id)
    setError(null)
    try {
      replaceMilestone(await completeMilestone(roadmap.id, milestone.id))
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : 'We could not complete this milestone.')
    } finally {
      setUpdatingId(null)
    }
  }

  const completedCount = roadmap?.milestones.filter((item) => item.status === 'completed').length || 0
  const overallProgress = roadmap?.milestones.length ? Math.round(roadmap.milestones.reduce((sum, item) => sum + item.progress_percentage, 0) / roadmap.milestones.length) : 0

  return <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
    <RoadmapNavbar darkMode={darkMode} toggleTheme={toggleTheme} targetRole={roadmap?.target_role} />
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6">
      {error && <div role="alert" className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><span>{error}</span><button type="button" className="font-semibold underline" onClick={() => setError(null)}>Dismiss</button></div>}

      {isLoading ? <div aria-busy="true" aria-label="Loading roadmap" className="space-y-4"><div className="h-10 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" /></div>
        : hasNoRoadmap ? <section className="mx-auto max-w-xl py-20 text-center"><h1 className="text-3xl font-bold tracking-tight">Your roadmap is ready to be built</h1><p className="mt-3 text-zinc-600 dark:text-zinc-300">Trellis will use your confirmed profile, prior learning, availability, and verified resources. You can review every recommendation.</p><button type="button" onClick={() => void generate()} disabled={isGenerating} className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{isGenerating ? 'Building roadmap…' : 'Build my roadmap'}</button></section>
          : roadmap && <>
            <header className="grid gap-6 border-b border-zinc-200 pb-8 dark:border-zinc-800 md:grid-cols-[1fr_auto] md:items-end">
              <div><p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Version {roadmap.version_number} · Active</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{roadmap.target_role} roadmap</h1><p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-300">{roadmap.objective}</p></div>
              <div className="min-w-52"><div className="flex justify-between text-sm"><span>{completedCount} of {roadmap.milestones.length} milestones</span><strong>{overallProgress}%</strong></div><progress aria-label="Overall roadmap progress" value={overallProgress} max={100} className="mt-2 h-2 w-full accent-indigo-600" /><p className="mt-2 text-xs text-zinc-500">Estimated {roadmap.estimated_completion_weeks} weeks</p></div>
            </header>

            <ol className="mt-8 space-y-6">
              {roadmap.milestones.map((milestone) => <li key={milestone.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <article>
                  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Milestone {milestone.sequence}</p><h2 className="mt-1 text-xl font-bold">{milestone.title}</h2><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{milestone.description}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold capitalize dark:bg-zinc-800">{milestone.status.replace('_', ' ')}</span></div>
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-zinc-500">Deadline</dt><dd className="font-semibold">{formatDate(milestone.deadline)}</dd></div><div><dt className="text-zinc-500">Effort</dt><dd className="font-semibold">{milestone.estimated_hours} hours</dd></div><div><dt className="text-zinc-500">Prerequisites</dt><dd className="font-semibold">{milestone.prerequisite_keys.length ? milestone.prerequisite_keys.join(', ') : 'None'}</dd></div></dl>
                  <div className="mt-5 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100"><p className="font-semibold">Why this milestone</p><p className="mt-1 leading-6">{milestone.explanation.why}</p><p className="mt-2 text-xs opacity-75">Confidence {Math.round((milestone.explanation.confidence || 0) * 100)}% · {(milestone.explanation.provenance || []).join(', ')}</p></div>
                  {milestone.recommended_resources.length > 0 && <div className="mt-5"><h3 className="text-sm font-semibold">Verified resources</h3><ul className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">{milestone.recommended_resources.map((resource) => <li key={resource.id} className="p-3"><a href={resource.url} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">{resource.title} <span aria-hidden="true">↗</span></a><p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{resource.provider} · {resource.explanation}</p></li>)}</ul></div>}
                  <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-sm font-semibold">{milestone.progress_percentage}% complete</span><progress aria-label={`${milestone.title} progress`} value={milestone.progress_percentage} max={100} className="h-2 min-w-32 flex-1 accent-indigo-600" /><button type="button" onClick={() => void recordProgress(milestone)} disabled={updatingId === milestone.id || milestone.status === 'completed'} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-zinc-700">Record 25% progress</button><button type="button" onClick={() => void markComplete(milestone)} disabled={updatingId === milestone.id || milestone.status === 'completed'} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950">Mark complete</button></div>
                </article>
              </li>)}
            </ol>
          </>}
    </main>
  </div>
}
