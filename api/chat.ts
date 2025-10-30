// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { neon } from '@neondatabase/serverless';

const systemPrompt = `You are Alp's portfolio assistant.
Prefer using retrieved context. If none is relevant, still give a brief accurate answer and note it's general knowledge.
Be concise, specific, and helpful.`;

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const missing = ['OPENAI_API_KEY', 'POSTGRES_URL'].filter(k => !process.env[k]);
    if (missing.length) return res.status(500).json({ error: 'Missing env vars', details: missing });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const question: string = body?.question?.trim?.();
    if (!question) return res.status(400).json({ error: 'Missing question' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const sql = neon(process.env.POSTGRES_URL!); // include sslmode=require in this URL on Vercel

    // 1) Embed the query
    const emb = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: question });
    const qvec = emb.data[0].embedding;

    // 2) Retrieve from Neon (docs table, cosine distance)
    const THRESHOLD = body?.threshold ?? 0.45; // raise to ~0.7 if your KB is tiny
    const LIMIT = body?.k ?? 8;

    const rows = await sql/* sql */`
      SELECT source, chunk, (embedding <=> ${qvec as any}) AS distance
      FROM docs
      ORDER BY embedding <=> ${qvec as any}
      LIMIT ${LIMIT};
    ` as unknown as Array<{ source: string; chunk: string; distance: number }>;

    const hits = rows.filter(r => r.distance <= THRESHOLD);
    const context = hits.map(h => `Source: ${h.source}\n${h.chunk}`).join('\n---\n');

    // 3) Build messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      context
        ? { role: 'system', content: `Context:\n${context}\n\nUse only if relevant.` }
        : { role: 'system', content: 'No retrieval context available.' },
      { role: 'user', content: question },
    ];

    // 4) Ask the model
    const chat = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages,
    });

    const answer = chat.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';
    return res.status(200).json({
      answer,
      sources: hits.map(h => h.source),
      diag: {
        usedContext: hits.length > 0,
        top3Distances: rows.slice(0, 3).map(r => Number(r.distance.toFixed(4))),
        threshold: THRESHOLD,
        k: LIMIT,
        embeddingModel: EMBEDDING_MODEL,
        chatModel: CHAT_MODEL,
      },
    });
  } catch (err: any) {
    console.error('API ERROR:', err);
    return res.status(500).json({ error: 'Unhandled error', details: err?.message ?? String(err) });
  }
}
