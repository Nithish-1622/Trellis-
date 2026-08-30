import { useState } from 'react'
import { getMilestoneQuiz, submitProject, submitQuiz } from '../../services/assessmentService'
import type { AssessmentAttempt, Quiz } from '../../services/assessmentService'
import type { RoadmapMilestone } from '../../services/roadmapService'

interface Props {
  milestone: RoadmapMilestone
  onEvidence: (attempt: AssessmentAttempt) => void
}

export default function AssessmentPanel({ milestone, onEvidence }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showProject, setShowProject] = useState(false)
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [reflection, setReflection] = useState('')
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQuiz = async () => {
    setIsBusy(true); setError(null)
    try { setQuiz(await getMilestoneQuiz(milestone.id)); setShowProject(false) }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load the quiz.') }
    finally { setIsBusy(false) }
  }

  const gradeQuiz = async () => {
    if (!quiz || Object.keys(answers).length !== quiz.questions.length) return
    setIsBusy(true); setError(null)
    try {
      const result = await submitQuiz(milestone.id, Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer })))
      setAttempt(result); setQuiz(null); onEvidence(result)
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not submit the quiz.') }
    finally { setIsBusy(false) }
  }

  const gradeProject = async () => {
    if (!repositoryUrl || summary.trim().length < 20) return
    setIsBusy(true); setError(null)
    try {
      const result = await submitProject(milestone.id, { repository_url: repositoryUrl, summary, reflection: reflection || undefined })
      setAttempt(result); setShowProject(false); onEvidence(result)
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not submit the project.') }
    finally { setIsBusy(false) }
  }

  return <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadQuiz()} disabled={isBusy} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700">Take short quiz</button><button type="button" onClick={() => { setShowProject(true); setQuiz(null) }} disabled={isBusy} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700">Submit project evidence</button></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
    {quiz && <form className="mt-4 space-y-5" onSubmit={(event) => { event.preventDefault(); void gradeQuiz() }}><h3 className="font-semibold">Knowledge check</h3>{quiz.questions.map((question) => <fieldset key={question.id}><legend className="text-sm font-medium">{question.prompt}</legend><div className="mt-2 grid gap-2">{question.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers({ ...answers, [question.id]: option })} />{option}</label>)}</div></fieldset>)}<button type="submit" disabled={isBusy || Object.keys(answers).length !== quiz.questions.length} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Submit quiz</button></form>}
    {showProject && <form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void gradeProject() }}><h3 className="font-semibold">Project evidence</h3><label className="text-sm font-medium">Repository URL<input type="url" required value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label><label className="text-sm font-medium">What did you build?<textarea required minLength={20} value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-1 block min-h-24 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label><label className="text-sm font-medium">Reflection <span className="font-normal text-zinc-500">(Optional)</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="mt-1 block min-h-20 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label><p className="text-xs text-zinc-500">AI-assisted project scores are provisional and lower-confidence than objective quiz scores.</p><button type="submit" disabled={isBusy || summary.trim().length < 20} className="justify-self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Submit for provisional review</button></form>}
    {attempt && <div role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100"><p className="font-semibold">{attempt.provisional ? 'Provisional project review' : 'Objective quiz score'}: {Math.round(attempt.score * 100)}%</p><p className="mt-1">{attempt.rationale}</p>{attempt.provisional && <p className="mt-2 text-xs font-semibold">This score is provisional and should be confirmed with stronger evidence.</p>}</div>}
  </div>
}
