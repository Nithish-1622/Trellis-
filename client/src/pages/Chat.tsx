import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { sendChatMessage } from '../services/chatService'
import type { AssistantAction } from '../services/chatService'

interface Message {
  id: string
  sender: 'learner' | 'assistant'
  text: string
  actions?: AssistantAction[]
  suggestions?: string[]
}

const actionHref = (action: AssistantAction) => {
  if (action.action_type === 'edit_profile') return String(action.payload.href || '/onboarding?edit=1')
  const milestone = action.payload.milestone_id ? `#${action.payload.milestone_id}` : ''
  return `/roadmap${milestone}`
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', sender: 'assistant', text: 'Ask me about your active roadmap, skill evidence, prerequisites, or why a resource was recommended. I will ask for confirmation before proposing any roadmap change.', suggestions: ['What should I do next?', 'Why is this milestone recommended?'] }])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: 'smooth' }) }, [messages, isSending])

  const send = async (text = input) => {
    const value = text.trim()
    if (!value || isSending) return
    setMessages((current) => [...current, { id: crypto.randomUUID(), sender: 'learner', text: value }])
    setInput(''); setIsSending(true); setError(null)
    try {
      const response = await sendChatMessage(value)
      setMessages((current) => [...current, { id: crypto.randomUUID(), sender: 'assistant', text: response.message, actions: response.actions, suggestions: response.suggestions }])
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'We could not reach the learning assistant.')
    } finally {
      setIsSending(false)
    }
  }

  return <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-6">
      <div className="border-b border-zinc-200 py-5 dark:border-zinc-800"><h1 className="text-xl font-bold">Trellis Assistant</h1><p className="mt-1 text-sm text-zinc-500">Grounded in your saved learning context</p></div>
      <div aria-live="polite" className="flex-1 space-y-6 py-8">
        {messages.map((message) => <article key={message.id} className={`max-w-2xl ${message.sender === 'learner' ? 'ml-auto' : ''}`}><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{message.sender === 'learner' ? 'You' : 'Trellis'}</p><div className={`whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${message.sender === 'learner' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' : 'border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>{message.text}</div>{message.actions?.length ? <div className="mt-2 flex flex-wrap gap-2">{message.actions.map((action) => <Link key={`${action.action_type}-${action.label}`} to={actionHref(action)} role="button" className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-200 dark:hover:bg-indigo-950">{action.label}{action.requires_confirmation ? ' · Approval required' : ''}</Link>)}</div> : null}{message.suggestions?.length ? <div className="mt-2 flex flex-wrap gap-2">{message.suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void send(suggestion)} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">{suggestion}</button>)}</div> : null}</article>)}
        {isSending && <p role="status" className="text-sm text-zinc-500">Trellis is checking your learning context…</p>}
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void send() }} className="sticky bottom-0 border-t border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-800 dark:bg-zinc-950"><label htmlFor="chat-message" className="sr-only">Message Trellis</label><div className="flex items-end gap-2 rounded-xl border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"><textarea id="chat-message" aria-label="Message Trellis" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} maxLength={4000} rows={2} placeholder="Ask about your roadmap or recommendations…" className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><button type="submit" aria-label="Send message" disabled={!input.trim() || isSending} className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Send</button></div></form>
    </main>
  </div>
}
