import { Command, Github, Linkedin } from 'lucide-react'

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-base-dark/70 backdrop-blur-xl">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="hidden sm:inline">Alp’s Space</span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span className="opacity-60">Cinematic UI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-cmd'))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:shadow-glow inline-flex items-center gap-2"
          >
            <Command size={16} /> <span className="hidden sm:inline">Command</span> <kbd className="ml-1 rounded bg-black/50 px-1">⌘K</kbd>
          </button>
          <a href="https://github.com/alpatanarin" target="_blank" className="rounded-xl border border-white/10 bg-white/5 p-2 hover:shadow-glow" aria-label="GitHub"><Github size={16} /></a>
          <a href="https://www.linkedin.com/in/alpatanarin" target="_blank" className="rounded-xl border border-white/10 bg-white/5 p-2 hover:shadow-glow" aria-label="LinkedIn"><Linkedin size={16} /></a>
        </div>
      </div>
    </header>
  )
}
