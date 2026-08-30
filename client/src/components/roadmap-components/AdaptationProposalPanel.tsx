import { useState } from 'react'
import { acceptAdaptation, rejectAdaptation } from '../../services/adaptationService'
import type { AdaptationProposal } from '../../services/adaptationService'

interface Props { proposal: AdaptationProposal; onAccepted: () => void; onDismissed: () => void }

export default function AdaptationProposalPanel({ proposal, onAccepted, onDismissed }: Props) {
  const [feedback, setFeedback] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const decide = async (accept: boolean) => {
    setIsBusy(true); setError(null)
    try {
      if (accept) { await acceptAdaptation(proposal.id); onAccepted() }
      else { await rejectAdaptation(proposal.id, feedback); onDismissed() }
    } catch (decisionError) { setError(decisionError instanceof Error ? decisionError.message : 'Could not decide this proposal.') }
    finally { setIsBusy(false) }
  }
  return <section aria-labelledby="adaptation-title" className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><p className="text-xs font-semibold uppercase tracking-wide">Your approval is required</p><h2 id="adaptation-title" className="mt-1 text-xl font-bold">Trellis proposes a roadmap update</h2><p className="mt-2 text-sm">{proposal.diff.explanation}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><h3 className="text-sm font-semibold">Additions</h3><ul className="mt-1 text-sm">{proposal.diff.additions?.length ? proposal.diff.additions.map((item) => <li key={item.stable_key}>+ {item.title} — {item.reason}</li>) : <li>None</li>}</ul></div><div><h3 className="text-sm font-semibold">Removals</h3><ul className="mt-1 text-sm">{proposal.diff.removals?.length ? proposal.diff.removals.map((item) => <li key={item.stable_key}>− {item.title} — {item.reason}</li>) : <li>None</li>}</ul></div></div><p className="mt-3 text-sm">{proposal.diff.timeline_change}</p><label className="mt-4 block text-sm font-medium">Feedback if you decline <span className="font-normal opacity-70">(Optional)</span><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} className="mt-1 block min-h-16 w-full rounded-lg border border-amber-300 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-zinc-950/50" /></label>{error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}<div className="mt-4 flex gap-3"><button type="button" disabled={isBusy} onClick={() => void decide(true)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">Accept update</button><button type="button" disabled={isBusy} onClick={() => void decide(false)} className="rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold dark:border-amber-700">Keep current roadmap</button></div></section>
}
