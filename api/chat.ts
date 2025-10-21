// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const systemPrompt = `You are Alp's portfolio assistant.
Answer ONLY using the provided context. If the answer isn't in the context, say you don't know and suggest what to ask Alp.
Be concise, specific, and helpful.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  const { question } = (req.body ?? {}) as { question?: string }
  if (!question?.trim()) return res.status(400).json({ error: 'Missing question' })

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
  const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini'

  // 1) Embed the question
  const e = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: question })
  const qvec = e.data[0].embedding

  // 2) Retrieve top matches (via RPC defined earlier)
  const { data: rows, error } = await supabase.rpc('match_documents', {
    query_embedding: qvec,
    match_count: 5,
    sim_threshold: 0.72
  })
  if (error) return res.status(500).json({ error: 'Search failed', details: error.message })

  const context = (rows ?? [])
    .map((r: any) => `Source: ${r.source}\n${r.chunk}`)
    .join('\n---\n')

  // 3) Ask the model with RAG
  const chat = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
    ]
  })

  const answer = chat.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'
  res.status(200).json({ answer, sources: (rows ?? []).map((r:any) => r.source) })
}
