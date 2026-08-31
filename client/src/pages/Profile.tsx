import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboard } from '../services/dashboardService'
import type { DashboardData } from '../services/dashboardService'

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))

export default function Profile() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true); setError(null)
    try { setDashboard(await getDashboard()) }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'We could not load your dashboard.') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { void load() }, [])

  return <div>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-zinc-500">Welcome back{user?.name ? `, ${user.name}` : ''}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Your learning dashboard</h1></div><Link to="/onboarding?edit=1" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-white dark:border-zinc-700 dark:hover:bg-zinc-900">Edit learning profile</Link></div>
      {error && <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error} <button type="button" onClick={() => void load()} className="font-semibold underline">Try again</button></div>}
      {isLoading ? <div aria-busy="true" aria-label="Loading dashboard" className="mt-8 grid gap-4 md:grid-cols-3"><div className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" /><div className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" /><div className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" /></div>
        : dashboard && <>
          <section aria-labelledby="next-action" className="mt-8 rounded-xl bg-zinc-900 p-6 text-white dark:bg-white dark:text-zinc-950"><p className="text-xs font-semibold uppercase tracking-wide opacity-70">Recommended next action</p><h2 id="next-action" className="mt-2 text-2xl font-bold">{dashboard.next_action.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">{dashboard.next_action.explanation}</p><Link to={dashboard.next_action.href} className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 dark:bg-zinc-950 dark:text-white">Continue learning</Link></section>

          <section aria-label="Progress summary" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">Roadmap progress</p><p className="mt-2 text-3xl font-bold">{dashboard.roadmap?.progress_percentage || 0}%</p><p className="mt-1 text-xs text-zinc-500">{dashboard.roadmap ? `${dashboard.roadmap.completed_milestones} of ${dashboard.roadmap.total_milestones} milestones` : 'No roadmap yet'}</p></div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">This week</p><p className="mt-2 text-3xl font-bold">{Math.round(dashboard.weekly_effort_minutes / 60 * 10) / 10}h</p><p className="mt-1 text-xs text-zinc-500">Recorded learning effort</p></div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">Consistency</p><p className="mt-2 text-3xl font-bold">{dashboard.streak_days}</p><p className="mt-1 text-xs text-zinc-500">{dashboard.streak_days} day streak</p></div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">Skill evidence</p><p className="mt-2 text-3xl font-bold">{dashboard.skill_growth.reduce((sum, skill) => sum + skill.evidence_count, 0)}</p><p className="mt-1 text-xs text-zinc-500">Weighted observations</p></div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <section aria-labelledby="skills-title"><h2 id="skills-title" className="text-xl font-bold">Skill development</h2>{dashboard.skill_growth.length ? <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">{dashboard.skill_growth.map((skill) => <li key={skill.id} className="p-4"><div className="flex justify-between gap-4"><div><p className="font-semibold">{skill.name}</p><p className="text-xs capitalize text-zinc-500">{skill.proficiency} · {skill.evidence_count} evidence items</p></div><p className="text-sm font-semibold">{Math.round(skill.confidence * 100)}% confidence</p></div><progress aria-label={`${skill.name} estimated skill`} value={skill.estimated_score} max={1} className="mt-3 h-2 w-full accent-indigo-600" /></li>)}</ul> : <p className="mt-3 text-sm text-zinc-500">Add skills or assessment evidence to see growth.</p>}</section>
            <div className="space-y-7"><section aria-labelledby="deadlines-title"><h2 id="deadlines-title" className="text-xl font-bold">Upcoming deadlines</h2>{dashboard.deadlines.length ? <ul className="mt-3 space-y-2">{dashboard.deadlines.map((deadline) => <li key={deadline.milestone_id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"><p className="font-semibold">{deadline.title}</p><p className="mt-1 text-zinc-500">{formatDate(deadline.deadline)}</p></li>)}</ul> : <p className="mt-2 text-sm text-zinc-500">No upcoming deadlines.</p>}</section><section aria-labelledby="assessment-title"><h2 id="assessment-title" className="text-xl font-bold">Recent assessments</h2>{dashboard.recent_assessments.length ? <ul className="mt-3 space-y-2">{dashboard.recent_assessments.map((assessment) => <li key={assessment.id} className="flex justify-between rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"><span className="capitalize">{assessment.assessment_type}{assessment.provisional ? ' · provisional' : ''}</span><strong>{Math.round(assessment.score * 100)}%</strong></li>)}</ul> : <p className="mt-2 text-sm text-zinc-500">No assessments yet.</p>}</section>{dashboard.blockers.length > 0 && <section aria-labelledby="blockers-title"><h2 id="blockers-title" className="text-xl font-bold">Blockers</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">{dashboard.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></section>}</div>
          </div>
        </>}
    </main>
  </div>
}
