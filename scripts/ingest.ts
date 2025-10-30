// scripts/ingest.ts
import { config } from 'dotenv';
config({ path: '.env.development.local' });  // local dev only

import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';

const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!url) throw new Error('Missing Postgres URL in env');

const sql = neon(url);

if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Replace with your real transformed data
const RAW_DOCS: { source: string; text: string }[] = [
  { source: 'about.md',   text: `Alp is a CS + Computational Biology student ...` },
  { source: 'project1.md', text: `Project: Fantasy Football app. Uses Flask/React, SSE, Redis ...` },
];

async function embed(texts: string[]): Promise<number[][]> {
  const resp = await openai.embeddings.create({
    model: 'text-embedding-3-small', // 1536 dims
    input: texts,
  });
  return resp.data.map(d => d.embedding);
}

async function ensureSchema() {
  // Needed for gen_random_uuid()
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS docs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      source text,
      chunk  text NOT NULL,
      embedding vector(1536),
      created_at timestamptz DEFAULT now()
    );
  `;
  // Optional: after you have some data, create ANN index for faster search
  // (creating before inserts is okay, but it's typically better after initial load)
  // await sql`CREATE INDEX IF NOT EXISTS docs_embedding_ivfflat ON docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`;
}

async function main() {
  await ensureSchema();

  // Naive chunking
  const chunks = RAW_DOCS.flatMap(({ source, text }) => {
    const parts = text.match(/[\s\S]{1,1200}/g) || [];
    return parts.map(p => ({ source, chunk: p }));
  });

  const embeddings = await embed(chunks.map(c => c.chunk));

  for (let i = 0; i < chunks.length; i++) {
    const { source, chunk } = chunks[i];
    const v = `[${embeddings[i].join(',')}]`; // vector literal string
    await sql/* sql */`
      INSERT INTO docs (source, chunk, embedding)
      VALUES (${source}, ${chunk}, ${v}::vector);
    `;
  }

  // Analyze table stats; helps planner + ANN later
  await sql`ANALYZE docs;`;

  // Optional: create ANN index after load (uncomment if you want it now)
  // await sql`CREATE INDEX IF NOT EXISTS docs_embedding_ivfflat ON docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`;

  console.log(`Inserted ${chunks.length} chunks.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
