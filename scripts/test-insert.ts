// scripts/test-insert.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE! // must be service role

const sb = createClient(url, key)

async function main() {
  const { data, error } = await sb.from('documents').insert([{
    source: 'debug',
    chunk: 'Hello from test insert',
    embedding: Array(1536).fill(0) // dimension must match your table
  }]).select('id')
  if (error) {
    console.error('Insert error:', error)
    process.exit(1)
  }
  console.log('Inserted row id:', data?.[0]?.id)
}
main()
