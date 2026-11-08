// Melete 的主机半侧：在 DSH 自己的本地服务器上注册 /melete 路由，给页面读写 ~/.melete。
// 不联网，不上报任何数据；只有"开始复盘"时，才把摘要交给你在 DSH 里选的模型。
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDigest, queryContext } from './digest.js'
import { buildPrompt, extractJson, loadLens, normalize, toMarkdown } from './review.js'
import { ROOT, SAFE_FILENAME, SHARES, deleteAll, deleteReview, listReviews, readReview, readSettings, revealInFinder, saveReview, saveSettings, saveShareFile, writeDiagnostics } from './store.js'

export const name = 'dsh-plugin-melete'
const VERSION = '0.1.1'
const EDITION = 'Telos Ultra'
const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')

/** 读取 DSH 当前选择的模型（和对话里用的是同一个）。 */
function modelInfo(ctx) {
  try {
    const selection = ctx.get('agentDefaultModel')?.currentSelection()
    if (!ctx.get('llm') || !selection?.provider || !selection?.model) return null
    return { provider: selection.provider, model: selection.model }
  } catch {
    return null
  }
}

function approxTokens(s) {
  const str = String(s || '')
  let cjk = 0
  for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) > 0x2e80) cjk++
  return Math.max(1, Math.round(cjk * 0.65 + (str.length - cjk) * 0.28))
}

async function callModel(ctx, { system, user, maxTokens, signal }) {
  const info = modelInfo(ctx)
  if (!info) throw new Error('no-model')
  const llm = ctx.get('llm')
  // 思考用最低档：复盘需要的是写作，不是长推理；把输出额度留给正文
  const call = await llm.prepareCall({ provider: info.provider, model: info.model, maxTokens }, signal, (controls, model) => {
    const effort = model?.reasoning?.efforts?.[0]?.id
    return { ...controls, ...(effort === undefined ? {} : { reasoningEffort: effort }) }
  })
  let text = ''
  const seen = {}
  let finish = ''
  let rawUsage = null
  for await (const chunk of call.stream({
    ...call.config,
    system,
    messages: [{ role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'dsh-plugin-melete' } }],
    signal,
  })) {
    seen[chunk.type] = (seen[chunk.type] ?? 0) + 1
    if (chunk.type === 'text-delta') text += chunk.text
    else if (chunk.type === 'usage' && chunk.usage) rawUsage = chunk.usage
    else if (chunk.type === 'finish') {
      finish = chunk.reason?.kind ?? ''
      if (['error', 'aborted'].includes(finish)) throw new Error(chunk.reason.failure?.message || 'model-failed')
    }
  }
  const inTok = Number(rawUsage?.inputTokens) || 0
  const cacheRead = Number(rawUsage?.cacheReadTokens) || 0
  const cacheWrite = Number(rawUsage?.cacheWriteTokens) || 0
  const outTok = Number(rawUsage?.outputTokens) || 0
  const totalTok = Number(rawUsage?.totalTokens) || (inTok + cacheRead + cacheWrite + outTok)
  const usage = totalTok > 0
    ? { inputTokens: inTok, cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite, outputTokens: outTok, totalTokens: totalTok, estimated: false }
    : (() => {
        const ei = approxTokens(system) + approxTokens(user)
        const eo = approxTokens(text)
        return { inputTokens: ei, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: eo, totalTokens: ei + eo, estimated: true }
      })()
  return { text, model: info.model, usage, diag: { chunks: seen, finish, textLength: text.length } }
}

/** 同一时间只跑一次复盘；状态放在内存里，页面轮询读取。 */
const job = { state: 'idle', error: '', reviewId: '', startedAt: 0, stats: null, usage: null }

/**
 * 把页面传来的回看范围换成起止时间。
 * kind：days（7/30/90/365 天）、all（全部）、year（按年份）、custom（手选 from~to，含当天）。
 */
function parseRange(r) {
  const now = Date.now()
  if (!r || typeof r !== 'object') return { kind: 'days', days: 30, since: now - 30 * 86400000, until: now, label: '最近 30 天' }
  if (r.kind === 'all') return { kind: 'all', days: null, since: 0, until: now, label: '全部记录' }
  if (r.kind === 'year') {
    const y = Number(r.year)
    if (!Number.isInteger(y) || y < 2000 || y > 2100) return null
    const since = new Date(`${y}-01-01T00:00:00`).getTime()
    const until = Math.min(new Date(`${y}-12-31T23:59:59.999`).getTime(), now)
    return { kind: 'year', year: y, since, until, label: `${y} 年` }
  }
  if (r.kind === 'custom') {
    const ok = /^\d{4}-\d{2}-\d{2}$/
    if (!ok.test(String(r.from)) || !ok.test(String(r.to))) return null
    const since = new Date(`${r.from}T00:00:00`).getTime()
    const until = Math.min(new Date(`${r.to}T23:59:59.999`).getTime(), now)
    if (!Number.isFinite(since) || !Number.isFinite(until) || since > until) return null
    return { kind: 'custom', days: null, since, until, label: `${r.from} 至 ${r.to}` }
  }
  const n = Number(r.days)
  if (![7, 30, 90, 365].includes(n)) return null
  return { kind: 'days', days: n, since: now - n * 86400000, until: now, label: n === 365 ? '最近 1 年' : `最近 ${n} 天` }
}

const dayText = ms => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function runReview(ctx, { range, intention, lang, region }) {
  Object.assign(job, { state: 'reading', error: '', reviewId: '', startedAt: Date.now(), stats: null, usage: null })
  try {
    const digest = buildDigest({ since: range.since, until: range.until, label: range.label, maxChars: 60000 })
    job.stats = digest.stats
    if (digest.stats.withUserInput === 0) throw new Error('no-records')
    const lens = loadLens()
    const info = modelInfo(ctx)
    if (!info) throw new Error('no-model')
    job.state = 'writing'
    const prompt = buildPrompt({ lens: lens.text, digest: digest.text, intention, lang, model: info.model, region })
    const { text, model, usage, diag } = await callModel(ctx, { ...prompt, maxTokens: 16000 })
    job.state = 'saving'
    let parsed
    try {
      parsed = extractJson(text)
    } catch (err) {
      // 只记诊断信息（长度、结束原因、分块类型），不记任何内容
      await writeDiagnostics({ at: new Date().toISOString(), error: err.message, ...diag, hasBrace: text.includes('{') })
      throw new Error('bad-output')
    }
    const now = new Date()
    const id = now.toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19)
    const body = normalize(parsed, { region, lang, seed: id })
    if (body.mirrors.length === 0) throw new Error('empty-review')
    const end = dayText(range.until)
    const start = range.since > 0 ? dayText(range.since) : (digest.stats.earliest || end)
    const review = {
      meta: {
        format: 1, id, createdAt: now.toISOString(), lens: `melete-official@${lens.version}`, range: `${start} ~ ${end}`,
        days: range.days, rangeKind: range.kind, by: model, sources: ['dsh'], lang, intention: intention || '', plugin: VERSION,
        stats: digest.stats, usage, shareStats: digest.stats.shareStats, rhythm: digest.stats.rhythm,
      },
      ...body,
    }
    await saveReview(review, toMarkdown(review))
    Object.assign(job, { state: 'done', reviewId: id, usage })
  } catch (err) {
    Object.assign(job, { state: 'error', error: err?.message || String(err) })
  }
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

async function readBody(req, limit = 10 * 1024 * 1024) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw Object.assign(new Error('body too large'), { status: 413 })
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function isInnerMirror(m) {
  if (!m) return true
  const dim = String(m.dimension || '').trim().toUpperCase()
  const dom = String(m.domain || '').trim().toUpperCase()
  const code = String(m.code || '').trim().toUpperCase()
  const title = String(m.title || '')
  if (dim.startsWith('I') || dom.startsWith('I') || code.startsWith('I')) return true
  if (dim.includes('本心') || dom.includes('本心') || title.includes('本心')) return true
  if (dim.includes('心') || dom.includes('心')) return true
  // 必须明确判定为 H, A, S 域之一；无法可靠判定时默认归为本心，防止误导出
  const isH = dim.startsWith('H') || dom.startsWith('H') || code.startsWith('H')
  const isA = dim.startsWith('A') || dom.startsWith('A') || code.startsWith('A')
  const isS = dim.startsWith('S') || dom.startsWith('S') || code.startsWith('S')
  if (!isH && !isA && !isS) return true
  return false
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function collectProjects(review) {
  const projs = new Set()
  if (!review) return projs
  if (review.meta?.project) projs.add(String(review.meta.project).trim())
  if (Array.isArray(review.meta?.projects)) {
    review.meta.projects.forEach(p => p && projs.add(String(p).trim()))
  }
  const allMirrors = [
    ...(review.mirrors || []),
    ...(review.ai_side?.mirrors || []),
    ...(review.society || []),
    ...(review.inner || []),
  ]
  for (const m of allMirrors) {
    for (const e of (m.evidence || [])) {
      if (typeof e?.where === 'string') {
        const parts = e.where.split(/\s*·\s*/)
        if (parts.length >= 3) {
          const p = parts[1].trim()
          if (p && p !== '未知项目') projs.add(p)
        } else if (parts.length === 2) {
          const p = parts[0].trim()
          if (p && !/^\d{4}-\d{2}-\d{2}$/.test(p) && p !== '未知项目') projs.add(p)
        }
      }
    }
  }
  if (typeof review.who === 'string') {
    const m = /DSH[「(（]([^」)）]+)[」)）]/.exec(review.who)
    if (m && m[1]) projs.add(m[1].trim())
  }
  if (typeof review.scope === 'string') {
    const m = /范围[：:]\s*([^\s，,。]+?)(?:工作区|的|\s)/.exec(review.scope)
    if (m && m[1] && m[1].length >= 2 && m[1].length <= 25) projs.add(m[1].trim())
  }
  return projs
}

function sanitizeExportText(s, projects = null) {
  if (typeof s !== 'string') return ''
  let out = s
    .replace(/\[(?:邮箱|电话|密钥|长串|项目|出处|密码|私密|token|key|secret)[^\]]*\]/gi, '')
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '')
    .replace(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,5}\b/g, '')
    .replace(/\b[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\b/g, '')
    .replace(/\b[0-9a-fA-F]{6,}\b/g, '')
    .replace(/#\d+\b/g, '')
    .replace(/(?:[A-Za-z]:)?[\/\\~](?:[^\s\/\\:*?"<>|\r\n]+[\/\\])+[^\s\/\\:*?"<>|\r\n]*/g, '')
    .replace(/[“「]?([A-Za-z0-9_\u4e00-\u9fa5]{2,12}(?:计划|工程|项目|工作区|研究中心))[”」]?/g, '')

  if (projects && typeof projects[Symbol.iterator] === 'function') {
    for (const p of projects) {
      if (typeof p === 'string' && p.trim().length >= 2) {
        const escaped = p.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        out = out.replace(new RegExp(escaped, 'g'), '')
      }
    }
  }

  return out.replace(/\s+/g, ' ').trim()
}

function generateReviewHtml(review) {
  const meta = review.meta || {}
  const projs = collectProjects(review)
  const clean = s => escapeHtml(sanitizeExportText(s, projs))

  // 严格杜绝未知项目名（如 Orion）借由未经验证的自由标题泄露；导出复盘统一采用标准规范标题
  const isZh = (meta.lang || 'zh').startsWith('zh')
  const title = isZh ? 'Melete 复盘' : 'Melete Review'
  const range = clean(meta.range || '')
  
  // 严格过滤掉本心 (I 域)，只保留明确肯定属于 H, A, S 域的镜子
  const mirrors = (review.mirrors || []).filter(m => !isInnerMirror(m))
  const aiMirrors = (review.ai_side?.mirrors || []).filter(m => !isInnerMirror(m))
  const societyMirrors = (review.society || []).filter(m => !isInnerMirror(m))
  const allMirrors = [...mirrors, ...aiMirrors, ...societyMirrors]

  const mirrorCards = allMirrors.map(m => {
    const dim = clean(m.dimension || '')
    const t = clean(m.title || '')
    const b = clean(m.body || '').replace(/\n/g, '<br/>')
    const q = clean(m.ask || m.question || '')
    return `
    <article class="card">
      ${dim ? `<div class="kicker">${dim}</div>` : ''}
      ${t ? `<h3>${t}</h3>` : ''}
      ${b ? `<p class="body">${b}</p>` : ''}
      ${q ? `<blockquote class="q">${q}</blockquote>` : ''}
    </article>`
  }).join('')

  const openQ = clean(review.question || (review.questions && review.questions[0]) || '')

  return `<!doctype html>
<html lang="${escapeHtml(meta.lang || 'zh')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Melete</title>
<style>
:root{--bg:#f8f6f0;--card:#ffffff;--ink:#222120;--sub:#66625c;--line:rgba(0,0,0,0.08);--ac:#3a6a9a}
@media(prefers-color-scheme:dark){:root{--bg:#1a191c;--card:#242328;--ink:#ede9df;--sub:#a39d93;--line:rgba(255,255,255,0.1);--ac:#8fb0d2}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 system-ui,-apple-system,sans-serif;padding:40px 20px}
.wrap{max-width:760px;margin:0 auto}
header{margin-bottom:36px;border-bottom:1px solid var(--line);padding-bottom:24px}
.brand{font-size:22px;font-weight:600;letter-spacing:0.04em}
.range{font-size:14px;color:var(--sub);margin:8px 0 16px}
h1{font-size:32px;line-height:1.3;margin:0 0 12px}
.desc{color:var(--sub);font-size:15px;margin:4px 0}
.cards{display:flex;flex-direction:column;gap:20px;margin-top:28px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px 28px;box-shadow:0 4px 16px rgba(0,0,0,0.03)}
.kicker{font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ac);margin-bottom:8px}
h3{font-size:20px;margin:0 0 12px}
.body{margin:0 0 16px;font-size:15px;line-height:1.75}
.q{margin:16px 0 0;padding:12px 18px;border-left:3px solid var(--ac);background:rgba(0,0,0,0.02);font-style:italic;color:var(--ink)}
.question-card{margin-top:24px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px;text-align:center;font-size:18px}
footer{margin-top:48px;padding-top:24px;border-top:1px solid var(--line);font-size:13px;color:var(--sub);text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand">Melete</div>
    <div class="range">${range}</div>
    <h1>${title}</h1>
  </header>
  <main class="cards">
    ${mirrorCards}
    ${openQ ? `<div class="question-card"><div class="kicker">留给自己的问题</div><p>${openQ}</p></div>` : ''}
  </main>
  <footer>
    <p>Melete · 在你的设备上生成</p>
  </footer>
</div>
</body>
</html>`
}

/** DSH 的 Web 服务不替插件路由鉴权，每个请求都要先过 DSH 自己的连接检查；拿不到检查服务就拒绝。 */
function requestRejection(ctx, req) {
  const connection = ctx.get('connection')
  if (typeof connection?.requestRejection !== 'function') return 403
  return connection.requestRejection({ headers: req.headers })
}

async function route(ctx, req, res) {
  const url = new URL(req.url, 'http://local')
  const path = url.pathname.replace(/^\/melete/, '') || '/'
  const method = req.method || 'GET'

  if (method === 'GET' && path === '/state') {
    const info = modelInfo(ctx)
    let lensVersion = ''
    try { lensVersion = loadLens().version } catch { /* 图谱缺失时页面会提示 */ }
    return json(res, 200, {
      version: VERSION, edition: EDITION, lensVersion, dataDir: ROOT, model: info?.model ?? null,
      settings: await readSettings(), reviews: await listReviews(), job,
    })
  }
  if (method === 'GET' && path.startsWith('/asset/')) {
    const filename = path.replace(/^\/asset\//, '')
    const ALLOWED = new Set([
      'xinjiang-01-fir-forest.jpg',
      'xinjiang-02-moon-bay.jpg',
      'xinjiang-03-foggy-lake.jpg',
      'xinjiang-04-autumn-lake.jpg',
    ])
    if (!ALLOWED.has(filename)) return json(res, 404, { error: 'not-found' })
    const file = join(ASSETS_DIR, filename)
    if (!existsSync(file)) return json(res, 404, { error: 'file-not-found' })
    const buf = readFileSync(file)
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400',
    })
    return res.end(buf)
  }
  if (method === 'GET' && path === '/context') {
    const where = url.searchParams.get('where') || ''
    const session = url.searchParams.get('session') || ''
    const seq = url.searchParams.get('seq')
    const result = queryContext({ where, sessionId: session, seq })
    return json(res, 200, result)
  }
  if (method === 'GET' && path === '/review') {
    const review = await readReview(url.searchParams.get('id'))
    return review ? json(res, 200, review) : json(res, 404, { error: 'not-found' })
  }
  if (method === 'GET' && path === '/job') return json(res, 200, job)
  if (method === 'POST' && path === '/review') {
    if (['reading', 'writing', 'saving'].includes(job.state)) return json(res, 409, { error: 'busy' })
    const body = await readBody(req)
    const range = parseRange(body.range)
    if (!range) return json(res, 400, { error: 'bad-range' })
    const intention = typeof body.intention === 'string' ? body.intention.slice(0, 500) : ''
    const lang = typeof body.lang === 'string' ? body.lang : 'en'
    const region = typeof body.region === 'string' ? body.region : ''
    void runReview(ctx, { range, intention, lang, region })
    return json(res, 202, { ok: true })
  }
  if (method === 'POST' && path === '/settings') return json(res, 200, await saveSettings(await readBody(req)))
  if (method === 'POST' && path === '/delete-review') {
    const body = await readBody(req)
    if (body.confirm !== 'delete') return json(res, 400, { error: 'confirm-required' })
    return (await deleteReview(body.id)) ? json(res, 200, { ok: true }) : json(res, 400, { error: 'bad-id' })
  }
  if (method === 'POST' && path === '/delete-all') {
    const body = await readBody(req)
    if (body.confirm !== 'delete') return json(res, 400, { error: 'confirm-required' })
    await deleteAll()
    Object.assign(job, { state: 'idle', error: '', reviewId: '', stats: null })
    return json(res, 200, { ok: true })
  }
  if (method === 'POST' && path === '/share/save') {
    const body = await readBody(req)
    const { filename, data, isBase64 } = body
    if (!filename || typeof data !== 'string') return json(res, 400, { error: 'bad-args' })
    try {
      const savedPath = await saveShareFile({ filename, data, isBase64: Boolean(isBase64) })
      return json(res, 200, { ok: true, filename, path: savedPath })
    } catch (err) {
      return json(res, 400, { error: err.message })
    }
  }
  if (method === 'POST' && path === '/share/reveal') {
    const body = await readBody(req)
    const filename = body.filename
    if (!filename || !SAFE_FILENAME.test(filename)) return json(res, 400, { error: 'bad-filename' })
    revealInFinder(join(SHARES, filename))
    return json(res, 200, { ok: true })
  }
  if (method === 'POST' && path === '/export/review') {
    const body = await readBody(req)
    const review = await readReview(body.id)
    if (!review) return json(res, 404, { error: 'review-not-found' })
    const html = generateReviewHtml(review)
    const filename = `Melete-Review-${review.meta?.id || body.id}.html`
    const savedPath = await saveShareFile({ filename, data: html, isBase64: false })
    return json(res, 200, { ok: true, filename, path: savedPath })
  }
  return json(res, 404, { error: 'not-found' })
}

export default {
  inject: ['webServer', 'connection'],
  apply(ctx) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: '/melete',
      handler: async (req, res) => {
        try {
          const rejection = requestRejection(ctx, req)
          if (rejection) return json(res, rejection, { error: 'unauthorized' })
          await route(ctx, req, res)
        } catch (err) {
          if (res.headersSent) return res.end()
          json(res, err.status || 500, { error: err.message })
        }
      },
    }), 'dsh-plugin-melete: /melete routes')
  },
}
