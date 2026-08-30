import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  bulkCreateResources,
  checkResourceLink,
  createResource,
  getApiSession,
  listResources,
  moderateResource,
  previewProviderResources,
  reevaluateResource,
} from '../services/adminCatalogService'
import type { CatalogResource, ExceptionCategory, ModerationAction, NewCatalogResource, ProviderCandidate } from '../services/adminCatalogService'

const emptyResource: NewCatalogResource = { title: '', provider: '', resource_type: 'course', url: '', topics: [], verification_status: 'discovered' }
const exceptionOptions: Array<{ value: ExceptionCategory; label: string }> = [
  { value: '', label: 'All indexed resources' },
  { value: 'reports', label: 'Learner reports' },
  { value: 'low_confidence_high_score', label: 'High score, low confidence' },
  { value: 'score_drop', label: 'Recent score drops' },
  { value: 'stale', label: 'Potentially stale' },
  { value: 'heavily_used', label: 'Heavily used' },
  { value: 'unusual_new_creator', label: 'Unusual new creators' },
]

export default function AdminCatalog() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [resources, setResources] = useState<CatalogResource[]>([])
  const [exceptionCategory, setExceptionCategory] = useState<ExceptionCategory>('reports')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<ProviderCandidate[]>([])
  const [draft, setDraft] = useState<NewCatalogResource>(emptyResource)
  const [bulkJson, setBulkJson] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = async (category = exceptionCategory) => setResources((await listResources({ exceptionCategory: category })).items)
  useEffect(() => { void (async () => { try { const session = await getApiSession(); const allowed = session.roles.includes('admin'); setIsAdmin(allowed); if (allowed) setResources((await listResources({ exceptionCategory: 'reports' })).items) } catch { setError('The resource exception console could not be loaded.') } })() }, [])

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setMessage('')
    try { await action(); await reload(); setMessage(success) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'The operation failed.') }
    finally { setBusy(false) }
  }

  const requireReason = (resource: CatalogResource, action: ModerationAction | 'reevaluate') => {
    const reason = (reasons[resource.id] || '').trim()
    if (reason.length < 10) {
      setError(`Add a specific review reason for ${resource.title} before continuing.`)
      return
    }
    if (action === 'reevaluate') void run(() => reevaluateResource(resource.id, reason), 'Reevaluation queued.')
    else void run(() => moderateResource(resource.id, action, reason), `Resource ${action.replace('_', ' ')} action saved.`)
  }

  if (isAdmin === false) return <main className="mx-auto max-w-3xl px-4 py-20"><h1 className="text-3xl font-bold">Administrator access required</h1><p className="mt-3 text-zinc-600">Resource exception handling is restricted to configured administrators.</p><Link to="/profile" className="mt-6 inline-block underline">Return to dashboard</Link></main>
  if (isAdmin === null && !error) return <main aria-busy="true" className="p-12 text-center">Loading resource exceptions…</main>

  return <main className="mx-auto max-w-6xl px-4 py-10 text-zinc-950 dark:text-zinc-100">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">Administration</p><h1 className="text-3xl font-bold">Resource exception console</h1></div><Link to="/profile" className="rounded-lg border px-4 py-2 text-sm">Dashboard</Link></div>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">Trellis automatically validates and vets external resources. Review learner reports, confidence anomalies, score changes, and high-impact exceptions here; routine discovery does not wait for approval.</p>
    {message && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</p>}
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="exception-heading">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="exception-heading" className="text-xl font-bold">Exceptions requiring attention</h2><p className="mt-1 text-sm text-zinc-500">{resources.length} resources in this view</p></div><label className="text-sm font-medium">Exception view<select value={exceptionCategory} onChange={(event) => { const value = event.target.value as ExceptionCategory; setExceptionCategory(value); void reload(value) }} className="mt-1 block rounded-lg border bg-transparent px-3 py-2"><option value="">All indexed resources</option>{exceptionOptions.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>
      {resources.length === 0 ? <div className="mt-6 rounded-lg bg-zinc-50 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">No resources currently match this exception view.</div> : <div className="mt-4 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-3">Resource</th><th className="p-3">Trust and score</th><th className="min-w-64 p-3">Reason and actions</th></tr></thead><tbody>{resources.map((resource) => <tr key={resource.id} className="border-b border-zinc-200 align-top dark:border-zinc-800"><td className="p-3"><a href={resource.url} target="_blank" rel="noreferrer" className="font-semibold underline focus-visible:ring-2 focus-visible:ring-indigo-500">{resource.title}</a><p className="mt-1 text-xs text-zinc-500">{resource.provider} · {resource.resource_type}{resource.author ? ` · ${resource.author}` : ''}</p></td><td className="p-3"><span className="capitalize">{resource.verification_status}</span><p className="mt-1 text-xs text-zinc-500">{resource.resource_score == null ? 'Not scored' : `${Math.round(resource.resource_score)} score · ${Math.round((resource.score_confidence || 0) * 100)}% confidence`}</p></td><td className="p-3"><label className="text-xs font-medium" htmlFor={`reason-${resource.id}`}>Review reason</label><textarea id={`reason-${resource.id}`} value={reasons[resource.id] || ''} onChange={(event) => setReasons({ ...reasons, [resource.id]: event.target.value })} rows={2} maxLength={1000} className="mt-1 block w-full rounded-md border bg-transparent px-2 py-1.5" /><div className="mt-2 flex flex-wrap gap-2">{resource.verification_status !== 'verified' && <button disabled={busy} onClick={() => requireReason(resource, 'verify')} className="rounded border px-2 py-1">Verify</button>}<button disabled={busy} onClick={() => requireReason(resource, 'reject')} className="rounded border px-2 py-1 text-red-700 dark:text-red-300">Reject</button><button disabled={busy} onClick={() => requireReason(resource, resource.is_pinned ? 'unpin' : 'pin')} className="rounded border px-2 py-1">{resource.is_pinned ? 'Unpin' : 'Pin'}</button><button disabled={busy} onClick={() => requireReason(resource, resource.suppressed_at ? 'unsuppress' : 'suppress')} className="rounded border px-2 py-1">{resource.suppressed_at ? 'Restore' : 'Suppress'}</button><button disabled={busy} onClick={() => requireReason(resource, 'reevaluate')} className="rounded border px-2 py-1">Reevaluate</button><button disabled={busy} aria-label={`Check ${resource.title} link`} onClick={() => void run(() => checkResourceLink(resource.id), 'Link status updated.')} className="rounded border px-2 py-1">Check link</button></div></td></tr>)}</tbody></table></div>}
    </section>

    <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><summary className="cursor-pointer font-bold">Provider diagnostics</summary><p className="mt-2 text-sm text-zinc-500">Preview normalized provider results without importing or approving them.</p><label htmlFor="provider-query" className="mt-4 block text-sm">Diagnostic search</label><div className="mt-1 flex gap-2"><input id="provider-query" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2" /><button disabled={busy || query.trim().length < 2} onClick={() => void (async () => { setBusy(true); setError(''); try { setPreview(await previewProviderResources(query)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Preview failed.') } finally { setBusy(false) } })()} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Preview results</button></div>{preview.length > 0 && <ul className="mt-3 space-y-2">{preview.map((item) => <li key={item.canonical_key} className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-950"><a href={item.url} target="_blank" rel="noreferrer" className="font-semibold underline">{item.title}</a><p className="text-xs text-zinc-500">{item.provider} · {item.canonical_key}</p></li>)}</ul>}</details>

    <details className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><summary className="cursor-pointer font-bold">Manage trusted internal catalog</summary><div className="mt-4 grid gap-5 md:grid-cols-2"><div><h3 className="font-semibold">Bulk JSON import</h3><label htmlFor="bulk-json" className="mt-2 block text-sm">Resource array</label><textarea id="bulk-json" rows={3} value={bulkJson} onChange={(event) => setBulkJson(event.target.value)} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-xs" /><button disabled={busy || !bulkJson.trim()} onClick={() => void run(() => bulkCreateResources(JSON.parse(bulkJson) as NewCatalogResource[]), 'Bulk resources imported.')} className="mt-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Import</button></div><form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); void run(() => createResource(draft), 'Discovered resource created.').then(() => setDraft(emptyResource)) }}><h3 className="font-semibold">Add internal resource</h3><label className="text-sm">Title<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2" /></label><label className="text-sm">Provider<input required value={draft.provider} onChange={(event) => setDraft({ ...draft, provider: event.target.value })} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2" /></label><label className="text-sm">URL<input required type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2" /></label><button disabled={busy} className="mt-1 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">Add as discovered</button></form></div></details>
  </main>
}
