// api/chat.ts
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const systemPrompt = `You are Alp's portfolio assistant.
Answer ONLY from the provided context. If the answer isn't in the context, say you don't know and suggest what to ask Alp.
Be concise, specific, and helpful.`

interface DocRow {
  id: string
  source: string
  chunk: string
  similarity?: number
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY'].filter(
    (k) => !process.env[k]
  )
  if (missing.length) {
    res.status(500).json({ error: 'Missing env vars', details: missing })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const question: string = body?.question?.trim?.()
    if (!question) {
      res.status(400).json({ error: 'Missing question' })
      return
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
    const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini'

    // 1) Embed the question
    const e = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: question })
    const qvec = e.data[0].embedding

    // 2) Try main RPC first
    let rows: DocRow[] = []
    {
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: qvec,
        match_count: 10,
        sim_threshold: 0,
      })
      if (error) {
        return res.status(500).json({ error: 'Search failed', details: error.message })
      }
      if (Array.isArray(data)) rows = data as DocRow[]
    }

    // 3) Fallback RPC if empty
    if (rows.length === 0) {
      const { data, error } = await supabase.rpc('match_documents_loose', {
        query_embedding: qvec,
        match_count: 10,
      })
      if (error) {
        return res.status(500).json({ error: 'Loose search failed', details: error.message })
      }
      if (Array.isArray(data)) rows = data as DocRow[]
    }

    // 4) No context found
    if (rows.length === 0) {
      res.status(200).json({
        answer: 'No matching documents found in my knowledge base yet.',
        sources: [],
      })
      return
    }

    const context = rows
      .map((r) => `Source: ${r.source}\n${r.chunk}`)
      .join('\n---\n')

    // 5) Ask OpenAI with RAG context
    const chat = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
    })

    const answer =
      chat.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'

    res.status(200).json({
      answer,
      sources: rows.map((r) => r.source),
    })
  } catch (err: any) {
    res.status(500).json({
      error: 'Unhandled error',
      details: err?.message ?? String(err),
    })
  }
}
