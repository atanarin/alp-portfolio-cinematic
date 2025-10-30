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

if (!url) throw new Error('Missing Postgres URL in env (POSTGRES_URL or DATABASE_URL)');

const sql = neon(url);

if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Replace with your real transformed data
const RAW_DOCS: { source: string; text: string }[] = [
  { source: 'about.md',    text: `Alp is a CS + Computational Biology student ...` },
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
  console.log('Ensuring extensions and table...');
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
}

async function main() {
  // quick DB ping
  const [{ now }] = await sql`SELECT NOW() AS now;`;
  console.log('DB OK @', now);

  await ensureSchema();

  // Naive chunking
  const chunks = RAW_DOCS.flatMap(({ source, text }) => {
    const parts = text.match(/[\s\S]{1,1200}/g) || [];
    return parts.map(p => ({ source, chunk: p }));
  });

  console.log(`Embedding ${chunks.length} chunks...`);
  const embeddings = await embed(chunks.map(c => c.chunk));

  console.log('Inserting...');
  for (let i = 0; i < chunks.length; i++) {
    const { source, chunk } = chunks[i];
    const v = `[${embeddings[i].join(',')}]`; // vector literal string
    await sql/* sql */`
      INSERT INTO docs (source, chunk, embedding)
      VALUES (${source}, ${chunk}, ${v}::vector);
    `;
  }

  // Analyze table stats
  await sql`ANALYZE docs;`;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM docs;` as any;
  console.log(`Inserted ${chunks.length} chunks. Total rows now: ${count}.`);
}

main().catch(err => {
  console.error('INGEST ERROR:', err);
  process.exit(1);
});
