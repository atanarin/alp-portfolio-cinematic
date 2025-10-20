import { ReactNode } from 'react'
export default function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {subtitle && <p className="text-white/60">{subtitle}</p>}
      </div>
      <div className="grid gap-6">{children}</div>
    </section>
  )
}
