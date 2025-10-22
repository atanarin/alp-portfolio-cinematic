// scripts/ingest.ts
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE! // local only
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || 1536)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

function chunkText(text: string, maxChars = 1800) {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars))
  }
  return chunks
}

async function embed(input: string) {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  })
  return res.data[0].embedding
}

async function upsert(source: string, text: string) {
  const chunks = chunkText(text)
  for (const chunk of chunks) {
    const embedding = await embed(chunk)
    // optional: validate size
    if (EMBEDDING_DIM && embedding.length !== EMBEDDING_DIM) {
      throw new Error(`Embedding dim mismatch: got ${embedding.length}, expected ${EMBEDDING_DIM}`)
    }
    await supabase.from('documents').insert([{ source, chunk, embedding }])
  }
  console.log(`✓ ${source}: ${chunks.length} chunks`)
}

async function main() {
  // Resume
  const resume = await fs.readFile(path.join('data', 'resume.md'), 'utf8')
  await upsert('resume', resume)

  // Projects
  const projDir = path.join('data', 'projects')
  const files = await fs.readdir(projDir)
  for (const f of files) {
    if (!f.endsWith('.md')) continue
    const md = await fs.readFile(path.join(projDir, f), 'utf8')
    await upsert(`project:${f.replace('.md','')}`, md)
  }
  console.log('✅ Ingest complete')
}

main().catch((e) => { console.error(e); process.exit(1) })
