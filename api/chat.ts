// api/chat.ts
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const systemPrompt = `You are Alp's portfolio assistant.
Prefer using the provided context, but if the answer is general or biographical, you may use your general knowledge.
If the answer isn't in the context, say you don't know and suggest what to ask Alp.
Be concise, specific, and helpful.`

interface DocRow { id: string; source: string; chunk: string; similarity?: number }

// Accepts pgvector serialized as string or real array
function toNumberArray(x: any): number[] | null {
  if (Array.isArray(x)) return x as number[]
  if (typeof x === 'string') {
    const s = x.trim()
    try {
      if (s.startsWith('[') && s.endsWith(']')) return JSON.parse(s) as number[]
      if (s.startsWith('(') && s.endsWith(')')) return s.slice(1, -1).split(',').map(v => Number(v.trim()))
    } catch {}
  }
  return null
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY'].filter(k => !process.env[k])
  if (missing.length) return res.status(500).json({ error: 'Missing env vars', details: missing })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const question: string = body?.question?.trim?.()
    if (!question) return res.status(400).json({ error: 'Missing question' })

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
    const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini'

    // RLS-aware head count
    const head = await supabase.from('documents').select('id', { count: 'exact', head: true })
    const docCount = head.count ?? 0

    // Read one stored embedding to verify parsing + probe
    const one = await supabase.from('documents').select('id, source, embedding').limit(1)
    const storedArr = toNumberArray(one.data?.[0]?.embedding)
    const firstEmbLen = storedArr ? storedArr.length : 0

    // Probe: loose RPC with stored embedding via *_arr (should return rows)
    let probeLooseRows = -1
    if (storedArr) {
      const test = await supabase.rpc('match_documents_loose_arr', {
        query_embedding: storedArr,   // number[] known-good
        match_count: 3,
      })
      probeLooseRows = Array.isArray(test.data) ? test.data.length : -3
    } else {
      probeLooseRows = -2
    }

    // 1) Embed the question and normalize to number[]
    const e = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: question })
    const qvecRaw = e.data[0].embedding
    const qvec: number[] = Array.isArray(qvecRaw) ? qvecRaw.map(Number) : Array.from(qvecRaw as unknown as number[])
    const qLen = qvec.length

    // 2) Retrieval using *_arr RPCs (accept float8[] and cast to vector(1536) inside SQL)
    let rows: DocRow[] = []
    let used: 'threshold' | 'loose' | 'none' = 'none'

    // thresholded first
    {
      const { data, error } = await supabase.rpc('match_documents_arr', {
        query_embedding: qvec,   // plain number[]
        match_count: 10,
        sim_threshold: 0.2,
      })
      if (error) {
        return res.status(500).json({
          error: 'Search failed',
          details: error.message,
          diag: { supabaseUrl, docCount, qLen, firstEmbLen, probeLooseRows, mode: 'threshold_arr' }
        })
      }
      if (Array.isArray(data)) rows = data as DocRow[]
      used = 'threshold'
    }

    // fallback to loose
    if (rows.length === 0) {
      const { data, error } = await supabase.rpc('match_documents_loose_arr', {
        query_embedding: qvec,   // plain number[]
        match_count: 10,
      })
      if (error) {
        return res.status(500).json({
          error: 'Loose search failed',
          details: error.message,
          diag: { supabaseUrl, docCount, qLen, firstEmbLen, probeLooseRows, mode: 'loose_arr' }
        })
      }
      if (Array.isArray(data)) rows = data as DocRow[]
      used = 'loose'
    }

    if (rows.length === 0) {
      return res.status(200).json({
        answer: 'No matching documents found in my knowledge base yet.',
        sources: [],
        diag: { supabaseUrl, docCount, used, rowsLen: 0, qLen, firstEmbLen, model: EMBEDDING_MODEL, probeLooseRows }
      })
    }

    const context = rows.map(r => `Source: ${r.source}\n${r.chunk}`).join('\n---\n')

    // 3) Ask model
    const chat = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
    })

    const answer = chat.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'
    return res.status(200).json({
      answer,
      sources: rows.map(r => r.source),
      diag: { supabaseUrl, docCount, used, rowsLen: rows.length, qLen, firstEmbLen, model: EMBEDDING_MODEL, probeLooseRows }
    })
  } catch (err: any) {
    return res.status(500).json({ error: 'Unhandled error', details: err?.message ?? String(err) })
  }
}
