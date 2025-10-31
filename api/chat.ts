// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'nodejs', // Node runtime on Vercel
};

const systemPrompt = `You are Alp's portfolio assistant.
Prefer using retrieved context. If none is relevant, still give a brief accurate answer and note it's general knowledge.
Be concise, specific, and helpful.`;

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';

// --- helpers ---
function cors(res: VercelResponse) {
  // Only needed if your frontend is on a different domain; harmless otherwise
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
}

function parseBody(req: VercelRequest) {
  try {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return (req.body ?? {}) as any;
  } catch {
    return {} as any;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Simple GET healthcheck so you can hit /api/chat in a browser
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      route: '/api/chat',
      note: 'POST { question: "...", threshold?: number, k?: number } to query.',
    });
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const missing = ['OPENAI_API_KEY', 'POSTGRES_URL'].filter(k => !process.env[k]);
    if (missing.length) {
      console.error('Missing env vars:', missing);
      return res.status(500).json({ error: 'Missing env vars', details: missing });
    }

    const body = parseBody(req);
    const question: string | undefined =
      body?.question?.trim?.() ||
      body?.query?.trim?.() ||
      (Array.isArray(body?.messages)
        ? body.messages.find((m: any) => m.role === 'user')?.content?.trim?.()
        : undefined);

    if (!question) {
      return res.status(400).json({ error: 'Missing question' });
    }

    // Quick path to prove frontend wiring
    if (question === '__ping__') {
      return res.status(200).json({
        answer: 'pong',
        sources: [],
        diag: { ping: true, ts: new Date().toISOString() },
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const sql = neon(process.env.POSTGRES_URL!); // include ?sslmode=require in the URL

    // DB ping
    const [{ now }] = await sql`SELECT NOW() AS now;`.catch((e: any) => {
      console.error('DB ping failed:', e);
      throw new Error('Database connection failed: ' + (e?.message || e));
    });
    console.log('DB OK @', now);

    // 1) Embed the query
    const emb = await openai.embeddings
      .create({ model: EMBEDDING_MODEL, input: question })
      .catch((e: any) => {
        console.error('Embedding error:', e);
        throw new Error('Embedding failed: ' + (e?.message || e));
      });

    const qvec = emb.data?.[0]?.embedding;
    if (!qvec?.length) {
      return res.status(500).json({ error: 'No embedding returned from OpenAI' });
    }

    // 2) Retrieve from Neon (cosine distance)
    const THRESHOLD = typeof body?.threshold === 'number' ? body.threshold : 0.45;
    const LIMIT = typeof body?.k === 'number' ? body.k : 8;

    let rows: Array<{ source: string; chunk: string; distance: number }> = [];
    try {
      rows = (await sql/* sql */`
        SELECT source, chunk, (embedding <=> ${qvec as any}) AS distance
        FROM docs
        ORDER BY embedding <=> ${qvec as any}
        LIMIT ${LIMIT};
      `) as any;
    } catch (e: any) {
      console.error('Retrieval SQL error:', e);
      return res.status(500).json({ error: 'Retrieval failed', details: e?.message || String(e) });
    }

    const hits = (rows || []).filter(r => typeof r.distance === 'number' && r.distance <= THRESHOLD);
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
    const chat = await openai.chat.completions
      .create({ model: CHAT_MODEL, temperature: 0.2, messages })
      .catch((e: any) => {
        console.error('Chat error:', e);
        throw new Error('Chat completion failed: ' + (e?.message || e));
      });

    const answer = chat.choices?.[0]?.message?.content ?? '';
    if (!answer) {
      console.error('Empty model answer. Diag:', {
        top3Distances: (rows || []).slice(0, 3).map(r => r.distance),
        hits: hits.length,
      });
    }

    return res.status(200).json({
      answer: answer || 'Sorry, I could not generate a response.',
      sources: hits.map(h => h.source),
      diag: {
        usedContext: hits.length > 0,
        top3Distances: (rows || []).slice(0, 3).map(r => Number((r.distance ?? NaN).toFixed?.(4) ?? r.distance)),
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
