// api/probe-select.ts
import { createClient } from '@supabase/supabase-js'

function toNumberArray(x: any): number[] | null {
  if (Array.isArray(x)) return x as number[]
  if (typeof x === 'string') {
    const s = x.trim()
    try {
      if (s.startsWith('[') && s.endsWith(']')) return JSON.parse(s) as number[]
      if (s.startsWith('(') && s.endsWith(')')) {
        return s.slice(1, -1).split(',').map(v => Number(v.trim()))
      }
    } catch { /* fall through */ }
  }
  return null
}

export default async function handler(_req: any, res: any) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const sel = await supabase.from('documents').select('id,source,chunk,embedding').limit(1)
  const row = sel.data?.[0]
  const embArr = toNumberArray(row?.embedding)
  res.status(sel.error ? 500 : 200).json({
    ok: !sel.error,
    error: sel.error?.message ?? null,
    firstEmbLen: embArr ? embArr.length : 0,
    row: row ? { id: row.id, source: row.source } : null,
    rawType: typeof row?.embedding,
  })
}
