import { useEffect, useId, useRef, useState } from 'react'
import { recordResourceInteraction } from '../../services/resourceService'
import type { ResourceInteractionType } from '../../services/resourceService'
import type { RoadmapResource } from '../../services/roadmapService'

const newSessionId = () => globalThis.crypto?.randomUUID?.() || `session-${Date.now().toString(36)}`

export default function ResourceFeedbackControls({ resource, milestoneId }: { resource: RoadmapResource; milestoneId: string }) {
  const sessionId = useRef(newSessionId())
  const reportId = useId()
  const [pending, setPending] = useState<ResourceInteractionType | null>(null)
  const [sentiment, setSentiment] = useState<'helpful' | 'not_helpful' | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [message, setMessage] = useState('')

  const send = async (eventType: ResourceInteractionType, reportReasonValue?: string) => {
    setPending(eventType)
    setMessage('')
    try {
      await recordResourceInteraction(resource.id, {
        event_type: eventType,
        idempotency_key: `${sessionId.current}:${resource.id}:${eventType}`,
        session_id: sessionId.current,
        milestone_id: milestoneId,
        report_reason: reportReasonValue,
      })
      if (eventType === 'helpful' || eventType === 'not_helpful') {
        setSentiment(eventType)
        setMessage('Thanks—your feedback was recorded.')
      } else if (eventType === 'report') {
        setShowReport(false)
        setMessage('Report received. Trellis will reevaluate this resource.')
      }
    } catch {
      if (eventType !== 'impression') setMessage('Feedback could not be saved. Please try again.')
    } finally {
      setPending(null)
    }
  }

  useEffect(() => {
    void send('impression')
    // One impression per mounted resource card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.id, milestoneId])

  return <div className="p-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <a href={resource.url} target="_blank" rel="noreferrer" onClick={() => void send('open')} className="font-semibold text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">{resource.title} <span aria-hidden="true">↗</span></a>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{resource.provider} · {resource.explanation}</p>
        <p className="mt-1 text-xs capitalize text-zinc-500">{resource.status || 'verified'}{resource.score != null ? ` · ${Math.round(resource.score)} quality score` : ''}</p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label={`Feedback for ${resource.title}`}>
        <button type="button" aria-pressed={sentiment === 'helpful'} disabled={pending !== null} onClick={() => void send('helpful')} className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50 dark:border-zinc-700 dark:aria-pressed:bg-emerald-950/40">Helpful</button>
        <button type="button" aria-pressed={sentiment === 'not_helpful'} disabled={pending !== null} onClick={() => void send('not_helpful')} className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium aria-pressed:border-amber-600 aria-pressed:bg-amber-50 dark:border-zinc-700 dark:aria-pressed:bg-amber-950/40">Not helpful</button>
        <button type="button" aria-expanded={showReport} disabled={pending !== null} onClick={() => setShowReport((value) => !value)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-300">Report</button>
      </div>
    </div>
    {showReport && <form className="mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950" onSubmit={(event) => { event.preventDefault(); void send('report', reportReason.trim()) }}>
      <label htmlFor={reportId} className="text-xs font-medium">What should we review?</label>
      <textarea id={reportId} required minLength={5} maxLength={1000} value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-1 block min-h-16 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
      <div className="mt-2 flex gap-2"><button type="submit" disabled={pending !== null || reportReason.trim().length < 5} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Send report</button><button type="button" onClick={() => setShowReport(false)} className="px-3 py-1.5 text-xs font-semibold">Cancel</button></div>
    </form>}
    {message && <p role="status" className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">{message}</p>}
  </div>
}
