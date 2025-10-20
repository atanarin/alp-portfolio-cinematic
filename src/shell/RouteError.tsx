import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router-dom'

export default function RouteError() {
  const error = useRouteError()
  const location = useLocation()

  let title = 'Something went wrong'
  let message = 'An unexpected error occurred.'
  let status = 500

  if (isRouteErrorResponse(error)) {
    status = error.status
    title = `${error.status} ${error.statusText}`
    message = error.data || message
  }

  return (
    <div className="min-h-screen bg-cinematic">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid" />
      </div>
      <div className="container py-16">
        <div className="glass-strong p-6">
          <div className="text-xs uppercase tracking-widest text-white/50">Router Error</div>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-white/70">{message}</p>
          <p className="mt-3 text-sm text-white/50">Path: {location.pathname}</p>
          {location.pathname.endsWith('.pdf') && (
            <div className="mt-4 text-sm text-white/70">
              If you were trying to open the resume, place a file at <code className="mx-1 rounded bg-black/50 px-1">public/resume.pdf</code> and retry.
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <a href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:shadow-glow">Go Home</a>
          </div>
        </div>
      </div>
    </div>
  )
}

