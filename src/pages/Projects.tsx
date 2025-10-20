import Section from '@/components/Section'
import ProjectCard from '@/components/ProjectCard'

const current = [
  {
    title: 'Fantasy Football Live',
    description: 'Real-time dashboard using Flask + MySQL backend, SSE for live updates, React front-end, and cache-aside with Redis.',
    tags: ['React', 'Flask', 'MySQL', 'SSE', 'Redis', 'Docker'],
    github: 'https://github.com/alpatanarin',
    status: 'current',
    highlight: 'Reduced TTFB under load with caching + connection pooling.'
  },
]
const past = [
  {
    title: 'PAML Workflow',
    description: 'Reproducible pipeline for evolutionary rate analysis across Saccharomyces proteomes using PAML & Tranalign.',
    tags: ['Python', 'PAML', 'Bioinformatics', 'HPC'],
    github: 'https://github.com/alpatanarin',
    status: 'past',
  },
  {
    title: 'Cache-Aside Example',
    description: 'FastAPI + SQLAlchemy + Redis demo with TTLs, invalidation, and stampede protection (advisory locks).',
    tags: ['FastAPI', 'Redis', 'SQLAlchemy'],
    github: 'https://github.com/alpatanarin',
    status: 'past',
  }
]

export default function Projects() {
  return (
    <div>
      <Section title="Currently Building">
        <div className="grid gap-4 sm:grid-cols-2">
          {current.map((p) => <ProjectCard key={p.title} project={p} />)}
        </div>
      </Section>
      <Section title="Past Projects">
        <div className="grid gap-4 sm:grid-cols-2">
          {past.map((p) => <ProjectCard key={p.title} project={p} />)}
        </div>
      </Section>
    </div>
  )
}
