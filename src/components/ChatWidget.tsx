import { useState } from 'react'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [msgs, setMsgs] = useState<{role:'user'|'assistant', text:string}[]>([])
  const [loading, setLoading] = useState(false)

  async function ask() {
    const question = q.trim()
    if (!question || loading) return
    setMsgs(m => [...m, { role:'user', text: question }])
    setQ('')
    setLoading(true)
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      const j = await r.json()
      setMsgs(m => [...m, { role:'assistant', text: j.answer ?? 'No answer.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 rounded-full border border-white/10 bg-white/10 px-4 py-3 shadow-glow"
      >
        Ask about Alp
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-[360px] max-h-[70vh] rounded-2xl border border-white/10 bg-base-dark/90 backdrop-blur-xl shadow-glow p-3 flex flex-col">
          <div className="mb-2 text-sm text-white/70">Grounded answers from my résumé & projects.</div>
          <div className="flex-1 overflow-auto space-y-2 pr-1">
            {msgs.map((m,i) => (
              <div key={i} className={`rounded-xl px-3 py-2 text-sm ${m.role==='user' ? 'bg-white/10 self-end' : 'bg-white/5'}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-sm text-white/50">Thinking…</div>}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Ask e.g. What stack does Alp use?"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
              onKeyDown={(e)=> e.key==='Enter' && ask()}
            />
            <button onClick={ask} className="rounded-xl border border-white/10 bg-white/10 px-3">Send</button>
          </div>
        </div>
      )}
    </>
  )
}
