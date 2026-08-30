import { useRef, useState } from 'react'
import type { CompletedCourseDraft, PreviousLearningDraft } from '../../services/onboardingService'
import { Field, TextInput } from './fields'

interface HistoryStepProps {
  value: PreviousLearningDraft
  onChange: (value: PreviousLearningDraft) => void
}

const parseCsvLine = (line: string) => line.split(',').map((cell) => cell.trim())

export default function HistoryStep({ value, onChange }: HistoryStepProps) {
  const [title, setTitle] = useState('')
  const [provider, setProvider] = useState('')
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addCourse = () => {
    if (!title.trim()) return
    onChange({ ...value, courses: [...value.courses, { title: title.trim(), provider: provider.trim() || null, topics: [] }] })
    setTitle('')
    setProvider('')
  }

  const importCsv = async (file?: File) => {
    if (!file) return
    const lines = (await file.text()).split(/\r?\n/).filter(Boolean)
    const [header, ...rows] = lines.map(parseCsvLine)
    if (!header || header[0]?.toLowerCase() !== 'title') {
      setCsvErrors(['The first column must be named “title”. Download the template and try again.'])
      return
    }
    const imported: CompletedCourseDraft[] = []
    const errors: string[] = []
    rows.forEach((row, index) => {
      if (!row[0]) errors.push(`Row ${index + 2}: title is required.`)
      else imported.push({ title: row[0], provider: row[1] || null, completion_date: row[2] || null, topics: row[3] ? row[3].split('|').map((item) => item.trim()).filter(Boolean) : [] })
    })
    const existing = new Set(value.courses.map((course) => `${course.title}|${course.provider || ''}`.toLowerCase()))
    const unique = imported.filter((course) => !existing.has(`${course.title}|${course.provider || ''}`.toLowerCase()))
    onChange({ ...value, courses: [...value.courses, ...unique] })
    setCsvErrors(errors)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadTemplate = () => {
    const blob = new Blob(['title,provider,completion_date,topics\nIntro to Python,Example Academy,2025-06-01,python|programming\n'], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'trellis-learning-history-template.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 id="onboarding-step-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">What have you already learned?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">Previous courses help prevent repetitive beginner recommendations. This step is optional and can be updated later.</p>
      </div>
      <div className="grid gap-4 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800/70 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Course or resource" htmlFor="course-title"><TextInput id="course-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Intro to Python" /></Field>
        <Field label="Provider" htmlFor="course-provider" optional><TextInput id="course-provider" value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Coursera" /></Field>
        <button type="button" onClick={addCourse} className="self-end rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white dark:text-zinc-950">Add</button>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Import a CSV</h2><p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Columns: title, provider, completion_date, topics separated by |</p></div>
          <button type="button" onClick={downloadTemplate} className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Download template</button>
        </div>
        <input ref={fileInputRef} aria-label="Upload completed courses CSV" type="file" accept=".csv,text/csv" onChange={(event) => importCsv(event.target.files?.[0])} className="mt-3 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:font-semibold dark:text-zinc-300 dark:file:bg-zinc-700" />
        {csvErrors.length > 0 && <ul role="alert" className="mt-3 space-y-1 text-sm text-red-700 dark:text-red-300">{csvErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
      </div>

      {value.courses.length > 0 && <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">{value.courses.map((course, index) => <li key={`${course.title}-${index}`} className="flex items-center justify-between gap-3 px-3 py-3"><div><p className="text-sm font-semibold text-zinc-900 dark:text-white">{course.title}</p><p className="text-xs text-zinc-600 dark:text-zinc-400">{course.provider || 'Provider not specified'}</p></div><button type="button" aria-label={`Remove ${course.title}`} onClick={() => onChange({ ...value, courses: value.courses.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-zinc-800">Remove</button></li>)}</ul>}
    </section>
  )
}
