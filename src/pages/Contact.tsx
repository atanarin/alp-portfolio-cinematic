import { useState } from 'react'

const EMAIL = 'alp.ata.narin@gmail.com'

export default function Contact() {
  const [copied, setCopied] = useState(false)
  return (
    <div className="glass p-6">
      <h2 className="text-2xl font-semibold">Contact</h2>
      <p className="mt-2 text-white/70">
        Email me at{' '}
        <a className="underline decoration-accent-1/50 underline-offset-4 hover:decoration-accent-1" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>
      </p>
      <button
        onClick={async () => { await navigator.clipboard?.writeText(EMAIL); setCopied(true); setTimeout(()=>setCopied(false), 1500) }}
        className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:shadow-glow"
      >
        {copied ? 'Copied!' : 'Copy email'}
      </button>
    </div>
  )
}
