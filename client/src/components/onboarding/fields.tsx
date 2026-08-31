import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const inputClass = 'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'

interface FieldProps {
  label: string
  htmlFor: string
  hint?: string
  optional?: boolean
  error?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, optional, error, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {label}
        </label>
        {optional && <span className="text-xs text-zinc-600 dark:text-zinc-400">Optional</span>}
      </div>
      {hint && <p id={`${htmlFor}-hint`} className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{hint}</p>}
      {children}
      {error && <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className || ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-28 resize-y ${props.className || ''}`} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className || ''}`} />
}
