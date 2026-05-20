import pg from 'pg'
import 'dotenv/config'

const { Pool, types } = pg

// Parse NUMERIC (OID 1700) and INT8/BIGINT (OID 20) as JS numbers
// instead of strings. Safe for ratings/counts in this app.
types.setTypeParser(1700, v => v == null ? null : parseFloat(v))
types.setTypeParser(20,   v => v == null ? null : parseInt(v, 10))

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
})

pool.on('error', (err) => {
  console.error('[pg] unexpected pool error', err)
})

export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const ms = Date.now() - start
  if (process.env.DEBUG_SQL) console.log('[sql]', ms + 'ms', text.slice(0, 80), params)
  return res
}
