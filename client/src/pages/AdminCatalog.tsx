import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { archiveResource, bulkCreateResources, checkResourceLink, createResource, getApiSession, listResources, syncProviderResources, updateResource } from '../services/adminCatalogService'
import type { CatalogResource, NewCatalogResource } from '../services/adminCatalogService'

const emptyResource: NewCatalogResource = { title: '', provider: '', resource_type: 'course', url: '', topics: [], verification_status: 'pending' }

export default function AdminCatalog() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [resources, setResources] = useState<CatalogResource[]>([])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<NewCatalogResource>(emptyResource)
  const [bulkJson, setBulkJson] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = async () => setResources((await listResources()).items)
  useEffect(() => { void (async () => { try { const session = await getApiSession(); const allowed = session.roles.includes('admin'); setIsAdmin(allowed); if (allowed) await reload() } catch { setError('The catalog could not be loaded.') } })() }, [])

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setMessage('')
    try { await action(); await reload(); setMessage(success) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'The operation failed.') }
    finally { setBusy(false) }
  }

  if (isAdmin === false) return <main className="mx-auto max-w-3xl px-4 py-20"><h1 className="text-3xl font-bold">Administrator access required</h1><p className="mt-3 text-zinc-600">Catalog verification is restricted to configured administrators.</p><Link to="/profile" className="mt-6 inline-block underline">Return to dashboard</Link></main>
  if (isAdmin === null && !error) return <main aria-busy="true" className="p-12 text-center">Loading catalog…</main>

  return <main className="mx-auto max-w-6xl px-4 py-10 text-zinc-950 dark:text-zinc-100">
    <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-indigo-600">Administration</p><h1 className="text-3xl font-bold">Learning resource catalog</h1></div><Link to="/profile" className="rounded-lg border px-4 py-2 text-sm">Dashboard</Link></div>
    <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">Provider results enter as pending. Verify their content and link before learners can receive them as trusted catalog recommendations.</p>
    {message && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

    <section className="mt-8 grid gap-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2">
      <div><h2 className="font-bold">Find live resources</h2><label htmlFor="provider-query" className="mt-3 block text-sm">Provider search</label><div className="mt-1 flex gap-2"><input id="provider-query" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2" /><button disabled={busy || query.trim().length < 2} onClick={() => void run(() => syncProviderResources(query), 'Provider resources added for review.')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Sync as pending</button></div></div>
      <div><h2 className="font-bold">Bulk JSON import</h2><label htmlFor="bulk-json" className="mt-3 block text-sm">Resource array</label><div className="mt-1 flex gap-2"><textarea id="bulk-json" rows={2} value={bulkJson} onChange={(event) => setBulkJson(event.target.value)} placeholder='[{"title":"…","provider":"…","resource_type":"course","url":"https://…","topics":[]}]' className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs" /><button disabled={busy || !bulkJson.trim()} onClick={() => void run(() => bulkCreateResources(JSON.parse(bulkJson) as NewCatalogResource[]), 'Bulk resources imported.')} className="self-end rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Import</button></div></div>
    </section>

    <form className="mt-5 grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => { event.preventDefault(); void run(() => createResource(draft), 'Resource created.').then(() => setDraft(emptyResource)) }}>
      <label className="text-sm">Title<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2" /></label>
      <label className="text-sm">Provider<input required value={draft.provider} onChange={(event) => setDraft({ ...draft, provider: event.target.value })} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2" /></label>
      <label className="text-sm">Type<select value={draft.resource_type} onChange={(event) => setDraft({ ...draft, resource_type: event.target.value })} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2"><option>course</option><option>video</option><option>project</option><option>article</option><option>assessment</option></select></label>
      <label className="text-sm">URL<input required type="url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2" /></label>
      <button disabled={busy} className="self-end rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">Add pending resource</button>
    </form>

    <section className="mt-8" aria-labelledby="catalog-list"><div className="flex justify-between"><h2 id="catalog-list" className="text-xl font-bold">Catalog review queue</h2><span className="text-sm text-zinc-500">{resources.length} resources</span></div><div className="mt-3 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-3">Resource</th><th className="p-3">Status</th><th className="p-3">Link</th><th className="p-3">Actions</th></tr></thead><tbody>{resources.map((resource) => <tr key={resource.id} className="border-b border-zinc-200 dark:border-zinc-800"><td className="p-3"><a href={resource.url} target="_blank" rel="noreferrer" className="font-semibold underline">{resource.title}</a><p className="text-xs text-zinc-500">{resource.provider} · {resource.resource_type}</p></td><td className="p-3 capitalize">{resource.verification_status}</td><td className="p-3 capitalize">{resource.link_status}</td><td className="p-3"><div className="flex flex-wrap gap-2">{resource.verification_status !== 'verified' && <button disabled={busy} aria-label={`Verify ${resource.title}`} onClick={() => void run(() => updateResource(resource.id, { verification_status: 'verified' }), 'Resource verified.')} className="rounded border px-2 py-1">Verify</button>}<button disabled={busy} aria-label={`Check ${resource.title} link`} onClick={() => void run(() => checkResourceLink(resource.id), 'Link status updated.')} className="rounded border px-2 py-1">Check link</button>{!resource.archived_at && <button disabled={busy} aria-label={`Archive ${resource.title}`} onClick={() => void run(() => archiveResource(resource.id), 'Resource archived.')} className="rounded border px-2 py-1 text-red-700">Archive</button>}</div></td></tr>)}</tbody></table></div></section>
  </main>
}
