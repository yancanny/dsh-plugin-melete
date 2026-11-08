// Melete 的本地存储：~/.melete/ 下的设置与复盘。只读写这个文件夹，不碰其他任何地方。
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { execFile } from 'node:child_process'

export const ROOT = join(homedir(), '.melete')
export const SHARES = join(ROOT, 'shares')
const REVIEWS = join(ROOT, 'reviews')
const SETTINGS = join(ROOT, 'settings.json')

export const DEFAULT_SETTINGS = Object.freeze({
  format: 1,
  language: 'auto', // auto = 跟随 DSH
  style: 'auto', // auto = 按地区；greek | chinese | babylonian | indian | egyptian | roman | maya | inca
  occasionalSwitch: true,
  defaultDays: 30, // 0 = 全部
})

const LANGS = new Set(['auto', 'zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt'])
const STYLES = new Set(['auto', 'greek', 'chinese', 'babylonian', 'indian', 'egyptian', 'roman', 'maya', 'inca'])

export async function readSettings() {
  try {
    const raw = JSON.parse(await readFile(SETTINGS, 'utf8'))
    return { ...DEFAULT_SETTINGS, ...raw }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function saveSettings(patch) {
  const next = { ...(await readSettings()) }
  if (patch && typeof patch === 'object') {
    if (LANGS.has(patch.language)) next.language = patch.language
    if (patch.style !== undefined && !STYLES.has(patch.style)) throw new Error('bad-style')
    if (STYLES.has(patch.style)) next.style = patch.style
    if (typeof patch.occasionalSwitch === 'boolean') next.occasionalSwitch = patch.occasionalSwitch
    if ([7, 30, 90, 365, 0].includes(Number(patch.defaultDays))) next.defaultDays = Number(patch.defaultDays)
  }
  await mkdir(ROOT, { recursive: true })
  await writeFile(SETTINGS, JSON.stringify(next, null, 2))
  return next
}

/** 复盘的编号就是生成时间，只允许数字、字母和连字符，防止拼出别的路径。 */
const SAFE_ID = /^[0-9A-Za-z-]{6,40}$/

export async function listReviews() {
  if (!existsSync(REVIEWS)) return []
  const out = []
  for (const f of await readdir(REVIEWS)) {
    if (!f.endsWith('.json')) continue
    try {
      const r = JSON.parse(await readFile(join(REVIEWS, f), 'utf8'))
      out.push({ id: r.meta?.id ?? f.slice(0, -5), createdAt: r.meta?.createdAt, range: r.meta?.range, title: r.title ?? '' })
    } catch {
      // 读不了的文件跳过，不影响其他复盘
    }
  }
  return out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export async function readReview(id) {
  if (!SAFE_ID.test(String(id))) return null
  try {
    return JSON.parse(await readFile(join(REVIEWS, `${id}.json`), 'utf8'))
  } catch {
    return null
  }
}

export async function saveReview(review, markdown) {
  await mkdir(REVIEWS, { recursive: true })
  const id = review.meta.id
  if (!SAFE_ID.test(id)) throw new Error('bad review id')
  await writeFile(join(REVIEWS, `${id}.json`), JSON.stringify(review, null, 2))
  await writeFile(join(REVIEWS, `${id}.md`), markdown)
}

/** 删除某一期复盘：只删 reviews 文件夹里编号对应的两个文件。 */
export async function deleteReview(id) {
  if (!SAFE_ID.test(String(id))) return false
  await rm(join(REVIEWS, `${id}.json`), { force: true })
  await rm(join(REVIEWS, `${id}.md`), { force: true })
  return true
}

/** 失败时的诊断：只有长度、结束原因这类数字，不含任何对话内容。 */
export async function writeDiagnostics(info) {
  await mkdir(ROOT, { recursive: true })
  await writeFile(join(ROOT, 'last-error.json'), JSON.stringify(info, null, 2))
}

/** 一键删除：只删 ~/.melete 这一个文件夹。 */
export async function deleteAll() {
  const target = resolve(ROOT)
  if (!target.endsWith(`${sep}.melete`) || resolve(homedir()) === target) throw new Error('refusing to delete unexpected path')
  await rm(target, { recursive: true, force: true })
}

export const SAFE_FILENAME = /^[0-9A-Za-z_.\-\u4e00-\u9fa5]{1,120}$/

export async function saveShareFile({ filename, data, isBase64 = false }) {
  if (!SAFE_FILENAME.test(filename)) throw new Error('bad filename')
  await mkdir(SHARES, { recursive: true })
  const fullPath = join(SHARES, filename)
  if (isBase64) {
    const clean = data.replace(/^data:[^;]+;base64,/, '')
    await writeFile(fullPath, Buffer.from(clean, 'base64'))
  } else {
    await writeFile(fullPath, data, 'utf8')
  }
  return fullPath
}

export function revealInFinder(filePath) {
  if (process.platform === 'darwin' && typeof filePath === 'string' && existsSync(filePath)) {
    execFile('open', ['-R', filePath], () => {})
  }
}

