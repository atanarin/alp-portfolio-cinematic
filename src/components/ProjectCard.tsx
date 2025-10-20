import { ExternalLink, Github } from 'lucide-react'
import { motion } from 'framer-motion'

export interface Project {
  title: string
  description: string
  tags: string[]
  github?: string
  demo?: string
  highlight?: string
  status?: 'current' | 'past'
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
      transition={{ duration: 0.25 }}
      className="glass hover-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">{project.status === 'current' ? 'Currently Building' : 'Project'}</div>
          <h3 className="mt-1 text-lg font-semibold">{project.title}</h3>
          <p className="mt-1 text-sm text-white/70">{project.description}</p>
          {project.highlight && <p className="mt-2 text-xs text-accent-1">• {project.highlight}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {project.github && (
            <a className="rounded-lg border border-white/10 bg-white/5 p-2 hover:shadow-glow" href={project.github} target="_blank" aria-label="GitHub">
              <Github size={18} />
            </a>
          )}
          {project.demo && (
            <a className="rounded-lg border border-white/10 bg-white/5 p-2 hover:shadow-glow" href={project.demo} target="_blank" aria-label="Live Demo">
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}
