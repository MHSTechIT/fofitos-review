import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import 'dotenv/config'
import { query, pool } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// Uploads live alongside this file (backend/uploads) regardless of cwd
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(__dirname, process.env.UPLOADS_DIR)
  : path.join(__dirname, 'uploads')
const PORT = parseInt(process.env.API_PORT || '8080', 10)

// Whitelist tables that the API will accept — protects against arbitrary SQL
const ALLOWED_TABLES = new Set(['categories', 'products', 'reviews', 'qr_links', 'links'])

// Whitelist of columns per table — used to filter unknown keys in incoming JSON
const TABLE_COLUMNS = {
  categories: ['id','name','description','img','sort_order','video_url','group_name','active'],
  products:   ['id','cat','name','img','tagline','price','rating','reviews','tags','cal','pro','carb','fat','fibre','nutrition','nutrition_visible','ingr','revs','bg_color','arch_color','sort_order','is_veg','created_at','updated_at','done_by','active'],
  reviews:    ['id','product_id','name','rating','text','verified','created_at','phone','visible'],
  qr_links:   ['id','url','label'],
  links:      ['id','zomato_url','swiggy_url','review_url','footer_company','footer_fssai','footer_gst','footer_phone1','footer_phone2','footer_email','media_images','media_videos'],
}

const JSONB_COLUMNS = {
  products: new Set(['tags','nutrition','ingr','revs']),
  links:    new Set(['media_images','media_videos']),
}

const PK_COLUMN = {
  categories: 'id',
  products:   'id',
  reviews:    'id',
  qr_links:   'id',
  links:      'id',
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Ensure uploads dir exists. Files are served under /api/uploads so they ride
// the same /api route that is already proxied to this backend in production.
// /uploads is kept as a back-compat alias for any older direct links.
fs.mkdirSync(UPLOADS_DIR, { recursive: true })
app.use('/api/uploads', express.static(UPLOADS_DIR, { maxAge: '1y' }))
app.use('/uploads',     express.static(UPLOADS_DIR, { maxAge: '1y' }))

// --- Health check ---
app.get('/api/health', async (_req, res) => {
  try {
    const r = await query('SELECT 1 AS ok')
    res.json({ ok: true, db: r.rows[0].ok === 1 })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// --- Parse a PostgREST-style filter ?col=op.value into SQL fragment ---
function parseFilters(reqQuery, allowedCols) {
  const wheres = []
  const params = []
  for (const [k, v] of Object.entries(reqQuery)) {
    if (['select','order','limit','offset','single','maybeSingle','count'].includes(k)) continue
    if (!allowedCols.includes(k)) continue
    // value like "eq.5" or just "5" — default to eq
    let op = 'eq', val = v
    const m = typeof v === 'string' && v.match(/^(eq|neq|gt|gte|lt|lte|like|ilike|in|is)\.(.*)$/)
    if (m) { op = m[1]; val = m[2] }
    const ph = `$${params.length + 1}`
    switch (op) {
      case 'eq':   wheres.push(`"${k}" = ${ph}`); params.push(val); break
      case 'neq':  wheres.push(`"${k}" <> ${ph}`); params.push(val); break
      case 'gt':   wheres.push(`"${k}" > ${ph}`); params.push(val); break
      case 'gte':  wheres.push(`"${k}" >= ${ph}`); params.push(val); break
      case 'lt':   wheres.push(`"${k}" < ${ph}`); params.push(val); break
      case 'lte':  wheres.push(`"${k}" <= ${ph}`); params.push(val); break
      case 'like': wheres.push(`"${k}" LIKE ${ph}`); params.push(val); break
      case 'ilike':wheres.push(`"${k}" ILIKE ${ph}`); params.push(val); break
      case 'is':
        if (val === 'null')      wheres.push(`"${k}" IS NULL`)
        else if (val === 'true') wheres.push(`"${k}" IS TRUE`)
        else if (val === 'false')wheres.push(`"${k}" IS FALSE`)
        break
    }
  }
  return { wheres, params }
}

function parseSelect(selectStr) {
  if (!selectStr || selectStr === '*') return '*'
  // selectStr like "id, name, img" — sanitize to bare identifiers
  const cols = selectStr.split(',').map(s => s.trim()).filter(Boolean)
  return cols.map(c => `"${c}"`).join(', ')
}

function parseOrder(orderStr, allowedCols) {
  if (!orderStr) return ''
  // "col" or "col.asc" or "col.desc"
  const parts = orderStr.split('.')
  const col = parts[0]
  if (!allowedCols.includes(col)) return ''
  const dir = parts[1] === 'desc' ? 'DESC' : 'ASC'
  return ` ORDER BY "${col}" ${dir}`
}

// Sanitize a row payload to only whitelisted columns; serialize JSONB cols
function sanitizeRow(table, body) {
  const cols = TABLE_COLUMNS[table]
  const jsonbCols = JSONB_COLUMNS[table] || new Set()
  const out = {}
  for (const c of cols) {
    if (!(c in body)) continue
    let v = body[c]
    if (jsonbCols.has(c) && v !== null && v !== undefined && typeof v !== 'string') {
      v = JSON.stringify(v)
    }
    out[c] = v
  }
  return out
}

// Heal legacy image URLs saved before uploads moved under /api/uploads:
//   http://localhost:PORT/uploads/<file>  →  /api/uploads/<file>
//   /uploads/<file>                       →  /api/uploads/<file>
// Runs on every GET response so old DB rows render correctly without a migration.
function healUrls(value) {
  if (typeof value === 'string') {
    return value
      .replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//i, '/api/uploads/')
      .replace(/^\/uploads\//, '/api/uploads/')
  }
  if (Array.isArray(value)) return value.map(healUrls)
  // Only recurse into plain objects (e.g. JSONB columns). Date and other class
  // instances must pass through untouched — walking a Date flattens it to {}.
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {}
    for (const k of Object.keys(value)) out[k] = healUrls(value[k])
    return out
  }
  return value
}

// --- File upload: POST /api/upload (multipart) ---
// Registered BEFORE the generic /api/:table routes so "upload" is not
// interpreted as a table name.
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename:    (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-z0-9._-]/gi, '_')
      cb(null, `${Date.now()}_${safe}`)
    },
  }),
  // Images stay small; videos (uploaded by admin and played natively on the
  // customer pages) need much more headroom.
  limits: { fileSize: 200 * 1024 * 1024 },
})

app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const tooBig = err.code === 'LIMIT_FILE_SIZE'
      return res.status(tooBig ? 413 : 400).json({
        error: tooBig ? 'File too large (max 200 MB)' : (err.message || 'Upload failed'),
      })
    }
    if (!req.file) return res.status(400).json({ error: 'No file' })
    // Relative URL — works on any host without baking in a base URL
    const url = `/api/uploads/${req.file.filename}`
    res.json({ data: { url, filename: req.file.filename, size: req.file.size } })
  })
})

// --- Storage cleanup: delete orphaned upload files (never referenced in the DB) ---
// Without this, replacing or deleting a video/image leaves the old file on disk
// forever — with 200 MB videos that grows unbounded and can fill the disk.
//
// SAFETY (this NEVER touches anything a printed QR code depends on):
//   • QR codes encode /go/N and resolve via the qr_links table — they are never
//     stored as upload files, so a sweep of /uploads cannot remove a QR image.
//   • The protected set is built by scanning EVERY row of EVERY table, including
//     qr_links — so any file a QR *destination* points to is referenced and kept.
//   • If ANY table read fails, the sweep aborts and deletes NOTHING (so a momentary
//     DB hiccup can never be mistaken for "nothing is referenced").
//   • Only files older than graceHours (default 24h) are eligible — protects
//     in-flight uploads that haven't been saved to a row yet.
//   • Dry-run by default. Pass ?confirm=1 to actually delete.
const UPLOAD_REF_RE = /\/(?:api\/)?uploads\/([^\s"'?#)\\]+)/g

async function collectReferencedFilenames() {
  const referenced = new Set()
  for (const table of ALLOWED_TABLES) {
    // Throws on failure → caller aborts without deleting anything.
    const r = await query(`SELECT * FROM public."${table}"`)
    for (const row of r.rows) {
      const json = JSON.stringify(row)
      let m
      while ((m = UPLOAD_REF_RE.exec(json)) !== null) {
        try { referenced.add(decodeURIComponent(m[1])) } catch { referenced.add(m[1]) }
      }
    }
  }
  return referenced
}

app.post('/api/uploads/cleanup', async (req, res) => {
  const confirm = req.query.confirm === '1' || req.body?.confirm === true
  const graceHours = Math.max(0, parseFloat(req.query.graceHours ?? req.body?.graceHours ?? '24'))
  const GRACE_MS = graceHours * 3600 * 1000
  try {
    const referenced = await collectReferencedFilenames()   // aborts on DB error
    const files = await fs.promises.readdir(UPLOADS_DIR)
    const now = Date.now()
    const orphans = []
    let protectedInGrace = 0
    for (const name of files) {
      if (referenced.has(name)) continue                     // referenced (incl. QR) → keep
      const full = path.join(UPLOADS_DIR, name)
      let stat
      try { stat = await fs.promises.stat(full) } catch { continue }
      if (!stat.isFile()) continue
      if (now - stat.mtimeMs < GRACE_MS) { protectedInGrace++; continue }
      orphans.push({ name, sizeBytes: stat.size, ageHours: +((now - stat.mtimeMs) / 3600000).toFixed(1) })
    }
    const deleted = []
    if (confirm) {
      for (const o of orphans) {
        try { await fs.promises.unlink(path.join(UPLOADS_DIR, o.name)); deleted.push(o.name) }
        catch (e) { o.error = e.message }
      }
    }
    res.json({ data: {
      mode: confirm ? 'deleted' : 'dry-run',
      totalFiles: files.length,
      referencedCount: referenced.size,
      protectedInGrace,
      graceHours,
      orphanCount: orphans.length,
      orphanBytes: orphans.reduce((a, b) => a + b.sizeBytes, 0),
      orphans,
      deleted,
    }})
  } catch (e) {
    // Could not confirm references → delete NOTHING.
    res.status(500).json({ error: `Cleanup aborted, no files deleted: ${e.message}` })
  }
})

// --- Admin auth (per-department passwords in the admin_auth table) ---
// Each department (Marketing, R&D) has its own row keyed by id = department.
// Registered before /api/:table so "admin" is not treated as a table name.

const VALID_DEPTS = new Set(['Marketing', 'R&D'])

// Verify a login password for one department. The password is never sent back.
app.post('/api/admin/login', async (req, res) => {
  const { department, password } = req.body || {}
  if (!VALID_DEPTS.has(department)) {
    return res.json({ ok: false, error: 'Unknown department' })
  }
  try {
    const r = await query('SELECT password FROM public.admin_auth WHERE id = $1 LIMIT 1', [department])
    const stored = r.rows[0]?.password
    res.json({ ok: stored != null && password === stored })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Change one department's password — does not affect the other department.
app.post('/api/admin/password', async (req, res) => {
  const { department, password } = req.body || {}
  if (!VALID_DEPTS.has(department)) {
    return res.status(400).json({ ok: false, error: 'Unknown department' })
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' })
  }
  try {
    await query(
      `INSERT INTO public.admin_auth (id, password) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password`,
      [department, password]
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// --- GET /api/:table (list) ---
app.get('/api/:table', async (req, res) => {
  const { table } = req.params
  if (!ALLOWED_TABLES.has(table)) return res.status(404).json({ error: 'Unknown table' })
  const cols = TABLE_COLUMNS[table]
  const selectSql = parseSelect(req.query.select)
  const { wheres, params } = parseFilters(req.query, cols)
  const whereSql = wheres.length ? ' WHERE ' + wheres.join(' AND ') : ''
  const orderSql = parseOrder(req.query.order, cols)
  const limit  = parseInt(req.query.limit  || '0', 10)
  const offset = parseInt(req.query.offset || '0', 10)
  const limitSql = limit  > 0 ? ` LIMIT ${limit}`  : ''
  const offsetSql= offset > 0 ? ` OFFSET ${offset}`: ''

  try {
    // For count=exact, also run a COUNT(*) query
    let total = null
    if (req.query.count === 'exact') {
      const countR = await query(`SELECT COUNT(*)::int AS n FROM public."${table}"${whereSql}`, params)
      total = countR.rows[0].n
    }
    if (req.query.head === 'true') {
      return res.json({ data: null, count: total })
    }
    const r = await query(
      `SELECT ${selectSql} FROM public."${table}"${whereSql}${orderSql}${limitSql}${offsetSql}`,
      params
    )
    res.json({ data: healUrls(r.rows), count: total })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- GET /api/:table/:id (single by primary key) ---
app.get('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params
  if (!ALLOWED_TABLES.has(table)) return res.status(404).json({ error: 'Unknown table' })
  const pk = PK_COLUMN[table]
  const selectSql = parseSelect(req.query.select)
  try {
    const r = await query(`SELECT ${selectSql} FROM public."${table}" WHERE "${pk}" = $1 LIMIT 1`, [id])
    res.json({ data: healUrls(r.rows[0] || null) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- POST /api/:table (insert) ---
app.post('/api/:table', async (req, res) => {
  const { table } = req.params
  if (!ALLOWED_TABLES.has(table)) return res.status(404).json({ error: 'Unknown table' })
  const rowsIn = Array.isArray(req.body) ? req.body : [req.body]
  const inserted = []
  try {
    for (const raw of rowsIn) {
      const row = sanitizeRow(table, raw)
      const cols = Object.keys(row)
      if (cols.length === 0) continue
      const params = cols.map(c => row[c])
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
      const r = await query(
        `INSERT INTO public."${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`,
        params
      )
      inserted.push(r.rows[0])
    }
    res.json({ data: inserted })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- PATCH /api/:table/:id (update) ---
app.patch('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params
  if (!ALLOWED_TABLES.has(table)) return res.status(404).json({ error: 'Unknown table' })
  const pk = PK_COLUMN[table]
  const row = sanitizeRow(table, req.body)
  const cols = Object.keys(row)
  if (cols.length === 0) return res.json({ data: [] })
  const sets = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ')
  const params = [...cols.map(c => row[c]), id]
  try {
    const r = await query(
      `UPDATE public."${table}" SET ${sets} WHERE "${pk}" = $${cols.length + 1} RETURNING *`,
      params
    )
    res.json({ data: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- DELETE /api/:table/:id ---
app.delete('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params
  if (!ALLOWED_TABLES.has(table)) return res.status(404).json({ error: 'Unknown table' })
  const pk = PK_COLUMN[table]
  try {
    const r = await query(`DELETE FROM public."${table}" WHERE "${pk}" = $1 RETURNING *`, [id])
    res.json({ data: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- PUT /api/:table (upsert; body may contain pk) ---
app.put('/api/:table', async (req, res) => {
  const { table } = req.params
  if (!ALLOWED_TABLES.has(table)) return res.status(404).json({ error: 'Unknown table' })
  const pk = PK_COLUMN[table]
  const rowsIn = Array.isArray(req.body) ? req.body : [req.body]
  const upserted = []
  try {
    for (const raw of rowsIn) {
      const row = sanitizeRow(table, raw)
      const cols = Object.keys(row)
      if (cols.length === 0) continue
      const params = cols.map(c => row[c])
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
      const updateSets = cols.filter(c => c !== pk).map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')
      const sql = `
        INSERT INTO public."${table}" (${cols.map(c => `"${c}"`).join(', ')})
        VALUES (${placeholders})
        ON CONFLICT ("${pk}") DO UPDATE SET ${updateSets || `"${pk}" = EXCLUDED."${pk}"`}
        RETURNING *
      `
      const r = await query(sql, params)
      upserted.push(r.rows[0])
    }
    res.json({ data: upserted })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- Start ---
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`)
  console.log(`[api] uploads dir: ${UPLOADS_DIR}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[api] shutting down')
  await pool.end()
  process.exit(0)
})
