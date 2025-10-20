import { Home, FolderKanban, FileText, User, Mail } from 'lucide-react'
import { NavLink } from 'react-router-dom'

function RailItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:text-white ${isActive ? 'ring-2 ring-accent-1/50' : ''}`
      }
      aria-label={label}
      title={label}
    >
      <Icon size={20} />
      <span className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 translate-x-full whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-xs text-white shadow-soft group-hover:block">
        {label}
      </span>
    </NavLink>
  )
}

export default function Rail() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 sm:w-20 flex-col items-center gap-3 border-r border-white/10 bg-base-dark/70 p-2 backdrop-blur-xl">
      <div className="mt-2 mb-2 h-10 w-10 rounded-xl border border-white/15 bg-white/10 text-center font-black text-accent-1/90 leading-10">A</div>
      <nav className="flex flex-col gap-2">
        <RailItem to="/" icon={Home} label="Home" />
        <RailItem to="/projects" icon={FolderKanban} label="Projects" />
        <RailItem to="/resume" icon={FileText} label="Résumé" />
        <RailItem to="/about" icon={User} label="About" />
        <RailItem to="/contact" icon={Mail} label="Contact" />
      </nav>
      <div className="mt-auto pb-4 text-[10px] text-white/40">v0.1</div>
    </aside>
  )
}
