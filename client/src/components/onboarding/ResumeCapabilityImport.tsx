import { useId, useState } from 'react'
import {
  previewResumeCapabilities,
  storeAcceptedResume,
} from '../../services/learningHistoryService'
import type { ResumeCapabilities } from '../../services/learningHistoryService'

interface ResumeCapabilityImportProps {
  onApply: (capabilities: ResumeCapabilities) => void
}

export default function ResumeCapabilityImport({ onApply }: ResumeCapabilityImportProps) {
  const inputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ResumeCapabilities | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parse = async (selected?: File) => {
    if (!selected) return
    setFile(selected)
    setPreview(null)
    setError(null)
    setIsParsing(true)
    try {
      setPreview(await previewResumeCapabilities(selected))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not read this resume.')
    } finally {
      setIsParsing(false)
    }
  }

  const apply = async () => {
    if (!file || !preview) return
    setError(null)
    setIsApplying(true)
    try {
      const resumeFileId = await storeAcceptedResume(file)
      onApply({ ...preview, resume_file_id: resumeFileId })
      setPreview(null)
      setFile(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not save this resume.')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <section aria-labelledby="resume-import-title" className="rounded-xl border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Fastest way to start</p>
          <h2 id="resume-import-title" className="mt-1 text-base font-semibold text-zinc-950 dark:text-white">Import your current capabilities</h2>
          <p id={`${inputId}-hint`} className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">Upload a PDF or DOCX up to 5 MB. Trellis proposes skills and experience; nothing is added until you review and accept it.</p>
        </div>
        <label htmlFor={inputId} className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 focus-within:ring-2 focus-within:ring-emerald-600 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
          {isParsing ? 'Reading resume…' : 'Choose resume'}
          <input id={inputId} aria-describedby={`${inputId}-hint`} aria-label="Upload resume for capability suggestions" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={isParsing || isApplying} onChange={(event) => void parse(event.target.files?.[0])} className="sr-only" />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      {isParsing && <div aria-busy="true" aria-label="Extracting resume capabilities" className="mt-4 space-y-2"><div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" /></div>}

      {preview && (
        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-zinc-950 dark:text-white">Review suggestions from {preview.filename}</h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">You can edit every value after applying it.</p>
            </div>
            <button type="button" onClick={() => void apply()} disabled={isApplying} className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
              {isApplying ? 'Saving resume…' : 'Use these suggestions'}
            </button>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-zinc-500">Current role</dt><dd className="mt-1 font-medium">{preview.current_role || 'Not identified'}</dd></div>
            <div><dt className="text-xs text-zinc-500">Experience</dt><dd className="mt-1 font-medium">{preview.experience_years == null ? 'Not identified' : `${preview.experience_years} years`}</dd></div>
            <div><dt className="text-xs text-zinc-500">Education</dt><dd className="mt-1 font-medium">{preview.education_level || 'Not identified'}</dd></div>
          </dl>
          {preview.skills.length > 0 && <ul aria-label="Resume skill suggestions" className="mt-4 flex flex-wrap gap-2">{preview.skills.map((skill) => <li key={skill.name.toLowerCase()} className="rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">{skill.name} · {skill.proficiency[0].toUpperCase() + skill.proficiency.slice(1)}</li>)}</ul>}
          {(preview.projects.length > 0 || preview.certifications.length > 0) && <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">Also found {preview.projects.length} {preview.projects.length === 1 ? 'project' : 'projects'} and {preview.certifications.length} {preview.certifications.length === 1 ? 'certification' : 'certifications'} as supporting context.</p>}
        </div>
      )}
    </section>
  )
}
