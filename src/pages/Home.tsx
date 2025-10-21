import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
        <div className="pointer-events-none absolute -inset-16 -z-10 blur-3xl" style={{background: 'radial-gradient(800px 400px at 10% 10%, rgba(124,108,255,0.25), transparent), radial-gradient(800px 400px at 90% 0%, rgba(11,194,255,0.18), transparent)'}} />
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight"
        >
          Hi, I'm Alp. I build professional software.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 max-w-2xl text-white/70"
        >
          Full‑stack and data‑driven projects with an eye for UX polish: real‑time systems, scalable pipelines, and delightful front‑ends.
        </motion.p>
        <div className="mt-6 flex gap-3 text-sm">
          <a className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 hover:shadow-glow" href="/projects">Explore Projects</a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:shadow-glow" href="/resume">View Résumé</a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Fantasy Football Live', 'SSE • MySQL • Flask • React'],
          ['PAML Workflow', 'PAML • HPC • Python'],
          ['Cache‑Aside Demo', 'FastAPI • Redis • SQLAlchemy'],
        ].map(([title, sub]) => (
          <div key={title} className="glass hover-card p-5">
            <div className="text-xs uppercase tracking-widest text-white/50">Highlight</div>
            <div className="mt-1 font-medium">{title}</div>
            <div className="text-sm text-white/60">{sub}</div>
          </div>
        ))}
      </section>
    </div>
  )
}
