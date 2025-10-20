import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const items = [
  { k: 'Go to: Home', to: '/' },
  { k: 'Go to: Projects', to: '/projects' },
  { k: 'Go to: Résumé', to: '/resume' },
  { k: 'Go to: About', to: '/about' },
  { k: 'Go to: Contact', to: '/contact' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setOpen(true)
        setQ('')
      }
    }
    window.addEventListener('keydown', onKey)
    const onOpen = () => setOpen(true)
    window.addEventListener('open-cmd' as any, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-cmd' as any, onOpen)
    }
  }, [])

  const filtered = items.filter(i => i.k.toLowerCase().includes(q.toLowerCase()))

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-24 w-full max-w-xl rounded-2xl border border-white/10 bg-base-dark p-2 shadow-glow" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
        />
        <div className="mt-2 max-h-64 space-y-1 overflow-auto pr-1">
          {filtered.map(i => (
            <button
              key={i.k}
              onClick={() => { setOpen(false); nav(i.to) }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:shadow-glow"
            >
              {i.k}
            </button>
          ))}
          {!filtered.length && <div className="px-3 py-4 text-sm text-white/50">No results</div>}
        </div>
      </div>
    </div>
  )
}
