/**
 * Drop-in shim for `@supabase/supabase-js` — translates the subset of methods
 * the FOFiTOS app actually uses into fetch() calls to the in-repo Express API.
 *
 * Exported `sb` keeps the same shape (`sb.from(...)`, `sb.storage.from(...)`,
 * `sb.auth.*`) so existing components keep working without code changes.
 *
 * Auth is intentionally a no-op — the admin section is treated as open.
 */

// Vite dev server proxies /api to the backend (see vite.config.js).
// In production, the same-origin /api path serves the API.
const API_BASE = '/api'
// Storage base — backend serves uploads at /uploads
const STORAGE_BASE = ''

/* ──────────────────────────────────────────────────────────────────────────
   Query builder for sb.from(table)
   ────────────────────────────────────────────────────────────────────────── */
class Query {
  constructor(table) {
    this.table = table
    this._method = 'GET'
    this._select = null
    this._filters = []          // [{col, op, val}]
    this._order = null
    this._limit = null
    this._offset = null
    this._body = null
    this._wantCount = null
    this._headOnly = false
    this._upsertOnConflict = null
  }

  // --- SELECT ---
  select(cols = '*', opts = {}) {
    this._method = 'GET'
    this._select = cols || '*'
    if (opts.count) this._wantCount = opts.count   // 'exact'
    if (opts.head)  this._headOnly  = true
    return this
  }

  // --- FILTERS ---
  eq(col, val)  { this._filters.push({col, op:'eq',  val}); return this }
  neq(col, val) { this._filters.push({col, op:'neq', val}); return this }
  gt(col, val)  { this._filters.push({col, op:'gt',  val}); return this }
  gte(col, val) { this._filters.push({col, op:'gte', val}); return this }
  lt(col, val)  { this._filters.push({col, op:'lt',  val}); return this }
  lte(col, val) { this._filters.push({col, op:'lte', val}); return this }
  like(col, p)  { this._filters.push({col, op:'like',  val:p}); return this }
  ilike(col, p) { this._filters.push({col, op:'ilike', val:p}); return this }
  is(col, val)  { this._filters.push({col, op:'is',  val: String(val)}); return this }

  // --- ORDER / LIMIT ---
  order(col, { ascending = true } = {}) {
    this._order = `${col}.${ascending ? 'asc' : 'desc'}`
    return this
  }
  limit(n)  { this._limit = n; return this }
  offset(n) { this._offset = n; return this }

  // --- WRITE METHODS ---
  insert(data) {
    this._method = 'POST'
    this._body = data
    return this
  }
  update(data) {
    this._method = 'PATCH'
    this._body = data
    return this
  }
  delete() {
    this._method = 'DELETE'
    return this
  }
  upsert(data, opts = {}) {
    this._method = 'PUT'
    this._body = data
    this._upsertOnConflict = opts.onConflict || 'id'
    return this
  }

  // --- TERMINAL: explicitly request single/maybeSingle ---
  single()       { this._wantSingle = 'single';     return this._execute() }
  maybeSingle()  { this._wantSingle = 'maybeSingle';return this._execute() }

  // --- Make it awaitable: implicit terminal for `await query` ---
  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected)
  }

  async _execute() {
    try {
      let url, init = { method: this._method, headers: {} }

      if (this._method === 'GET') {
        const params = new URLSearchParams()
        if (this._select && this._select !== '*') params.set('select', this._select)
        for (const f of this._filters) params.set(f.col, `${f.op}.${f.val}`)
        if (this._order) params.set('order', this._order)
        if (this._limit != null) params.set('limit', String(this._limit))
        if (this._offset != null) params.set('offset', String(this._offset))
        if (this._wantCount) params.set('count', this._wantCount)
        if (this._headOnly) params.set('head', 'true')
        const qs = params.toString()
        url = `${API_BASE}/${this.table}${qs ? '?' + qs : ''}`
      } else if (this._method === 'POST') {
        url = `${API_BASE}/${this.table}`
        init.headers['Content-Type'] = 'application/json'
        init.body = JSON.stringify(this._body)
      } else if (this._method === 'PATCH') {
        // PATCH requires a single .eq(pk, value) filter to identify the row
        const idFilter = this._filters.find(f => f.op === 'eq')
        if (!idFilter) throw new Error('UPDATE requires .eq(pk, value)')
        url = `${API_BASE}/${this.table}/${encodeURIComponent(idFilter.val)}`
        init.headers['Content-Type'] = 'application/json'
        init.body = JSON.stringify(this._body)
      } else if (this._method === 'DELETE') {
        const idFilter = this._filters.find(f => f.op === 'eq')
        if (!idFilter) throw new Error('DELETE requires .eq(pk, value)')
        url = `${API_BASE}/${this.table}/${encodeURIComponent(idFilter.val)}`
      } else if (this._method === 'PUT') {
        url = `${API_BASE}/${this.table}`
        init.headers['Content-Type'] = 'application/json'
        init.body = JSON.stringify(this._body)
      }

      const res = await fetch(url, init)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { data: null, error: { message: json.error || res.statusText }, count: null }
      }
      let data = json.data
      const count = json.count ?? null
      if (this._wantSingle === 'single') {
        if (Array.isArray(data)) data = data[0] || null
        if (!data) return { data: null, error: { message: 'No rows', code: 'PGRST116' }, count }
        return { data, error: null, count }
      }
      if (this._wantSingle === 'maybeSingle') {
        if (Array.isArray(data)) data = data[0] || null
        return { data, error: null, count }
      }
      return { data, error: null, count }
    } catch (e) {
      return { data: null, error: { message: e.message }, count: null }
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Storage shim — uploads go to backend, public URL points to /uploads/*
   ────────────────────────────────────────────────────────────────────────── */
const storage = {
  from(_bucket) {
    return {
      async upload(filename, file, _opts = {}) {
        const fd = new FormData()
        fd.append('file', file, filename)
        try {
          const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd })
          const json = await res.json().catch(() => ({}))
          if (!res.ok) return { data: null, error: { message: json.error || res.statusText } }
          // Save server-assigned filename so getPublicUrl can find it again
          uploadedUrls.set(filename, json.data.url)
          return { data: { path: filename }, error: null }
        } catch (e) {
          return { data: null, error: { message: e.message } }
        }
      },
      getPublicUrl(filename) {
        const url = uploadedUrls.get(filename) || `${STORAGE_BASE}/api/uploads/${filename}`
        return { data: { publicUrl: url } }
      },
    }
  },
}
const uploadedUrls = new Map()

/* ──────────────────────────────────────────────────────────────────────────
   Auth shim — no auth, always "signed in" as an anonymous admin
   ────────────────────────────────────────────────────────────────────────── */
const fakeSession = { user: { id: 'local-admin', email: 'admin@local' }, access_token: 'local' }
const auth = {
  getSession() {
    return Promise.resolve({ data: { session: fakeSession }, error: null })
  },
  onAuthStateChange(_cb) {
    // No real subscription — return a stub
    return { data: { subscription: { unsubscribe() {} } } }
  },
  async signInWithPassword(_creds) {
    return { data: { session: fakeSession, user: fakeSession.user }, error: null }
  },
  async signOut() {
    return { error: null }
  },
  async resetPasswordForEmail(_email, _opts) {
    return { data: null, error: { message: 'Auth disabled in self-hosted build' } }
  },
  async updateUser(_attrs) {
    return { data: { user: fakeSession.user }, error: null }
  },
}

/* ──────────────────────────────────────────────────────────────────────────
   Realtime stub — Supabase realtime is not implemented in the self-hosted
   build, but `.channel(...).on(...).subscribe()` chains need to be valid.
   ────────────────────────────────────────────────────────────────────────── */
function makeChannelStub() {
  const ch = {
    on(_event, _filter, _cb) { return ch },
    subscribe(_cb) { return ch },
    unsubscribe() { return ch },
  }
  return ch
}

/* ──────────────────────────────────────────────────────────────────────────
   Exported client
   ────────────────────────────────────────────────────────────────────────── */
export const sb = {
  from(table) { return new Query(table) },
  storage,
  auth,
  channel(_name) { return makeChannelStub() },
  removeChannel(_ch) { /* no-op */ },
}
