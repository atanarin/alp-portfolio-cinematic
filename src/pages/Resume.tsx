import { useEffect, useState } from 'react'

export default function Resume() {
  const frameHeight = 'calc(100dvh - 140px)'
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch('/resume.pdf', { method: 'HEAD' })
        const ct = res.headers.get('content-type') || ''
        if (!cancelled) setAvailable(res.ok && ct.includes('pdf'))
      } catch {
        if (!cancelled) setAvailable(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-3">
      <div className="glass p-5">
        <h2 className="text-2xl font-semibold">Résumé</h2>
        <p className="mt-2 text-white/70">Embedded PDF; download if your browser blocks inline PDFs.</p>
      </div>

      {available ? (
        <div className="glass-strong overflow-hidden" style={{ height: frameHeight }}>
          <object data="/resume.pdf#zoom=page-width&view=FitH" type="application/pdf" className="w-full h-full">
            <iframe title="resume" src="/resume.pdf#zoom=page-width&view=FitH" className="w-full h-full" />
          </object>
        </div>
      ) : available === false ? (
        <div className="glass-strong p-5">
          <div className="text-sm text-white/70">
            Couldn’t find <code className="mx-1 rounded bg-black/50 px-1">/resume.pdf</code>.
            Place your PDF file at <code className="mx-1 rounded bg-black/50 px-1">public/resume.pdf</code> and refresh, or provide an external URL.
          </div>
        </div>
      ) : (
        <div className="glass-strong p-5 text-white/60">Checking for PDF…</div>
      )}

      <div>
        {available ? (
          <a className="underline decoration-accent-1/50 underline-offset-4 hover:decoration-accent-1" href="/resume.pdf" download>
            Download PDF
          </a>
        ) : (
          <span className="text-white/40">PDF not available</span>
        )}
      </div>
    </div>
  )
}

