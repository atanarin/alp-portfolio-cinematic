export default function About() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="glass-strong p-6 md:col-span-2">
        <h2 className="text-2xl font-semibold">About Alp</h2>
        <p className="mt-3 text-white/70">
          New‑grad software engineer (CS + Computational Biology). Focused on data‑intensive systems and delightful UX.
          I ship fast, keep things simple, and measure what matters.
        </p>
        <p className="mt-3 text-white/70">
          Recent work spans real‑time fantasy dashboards, HPC‑backed bioinformatics, and caching patterns for low‑latency APIs.
        </p>
      </div>
      <div className="glass p-6">
        <h3 className="text-sm uppercase tracking-widest text-white/50">Skills</h3>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {['React/TS','Node/Python','SQL','Redis','Docker','AWS','PAML','HPC'].map(s => (
            <li key={s} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">{s}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
