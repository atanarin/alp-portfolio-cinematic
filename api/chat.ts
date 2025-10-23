// api/chat.ts
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const systemPrompt = `You are Alp's portfolio assistant.
Answer ONLY from the provided context. If the answer isn't in the context, say you don't know and suggest what to ask Alp.
Be concise, specific, and helpful.`

interface DocRow { id: string; source: string; chunk: string; similarity?: number }

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

    // Fetch one stored embedding to compare dimensions + probe RPC
    const one = await supabase.from('documents').select('id, source, embedding').limit(1)
    const firstEmb = one.data?.[0]?.embedding as number[] | undefined
    const firstEmbLen = Array.isArray(firstEmb) ? firstEmb.length : 0

    let probeLooseRows = -1
    if (firstEmbLen > 0) {
      const test = await supabase.rpc('match_documents_loose', {
        query_embedding: firstEmb,
        match_count: 3,
      })
      probeLooseRows = Array.isArray(test.data) ? test.data.length : -3
    } else {
      probeLooseRows = -2
    }

    // 1) Embed the question
    const e = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: question })
    const qvec = e.data[0].embedding
    const qLen = qvec?.length ?? 0

    // 2) Retrieval
    let rows: DocRow[] = []
    let used: 'threshold' | 'loose' | 'none' = 'none'

    // thresholded first
    {
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: qvec,
        match_count: 8,
        sim_threshold: 0.45,
      })
      if (error) {
        return res.status(500).json({
          error: 'Search failed',
          details: error.message,
          diag: { supabaseUrl, docCount, qLen, firstEmbLen, probeLooseRows }
        })
      }
      if (Array.isArray(data)) rows = data as DocRow[]
      used = 'threshold'
    }

    // fallback to loose
    if (rows.length === 0) {
      const { data, error } = await supabase.rpc('match_documents_loose', {
        query_embedding: qvec,
        match_count: 10,
      })
      if (error) {
        return res.status(500).json({
          error: 'Loose search failed',
          details: error.message,
          diag: { supabaseUrl, docCount, qLen, firstEmbLen, probeLooseRows }
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
