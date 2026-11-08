// Synchronizes dsh-digest-core.js from the canonical kernel source in melete/scripts/
// to dsh-plugin-melete/src/ for plugin packaging and standalone distribution.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const sourcePath = join(__dir, '../../melete/scripts/dsh-digest-core.js')
const targetPath = join(__dir, '../src/dsh-digest-core.js')

const HEADER = `// AUTO-GENERATED from melete/scripts/dsh-digest-core.js - DO NOT EDIT DIRECTLY.\n// Run 'npm run sync-core' in dsh-plugin-melete to update.\n\n`

const isCheck = process.argv.includes('--check')

if (!existsSync(sourcePath)) {
  // If source does not exist (e.g. standalone distribution tarball), target must exist
  if (!existsSync(targetPath)) {
    console.error(`[sync-core] Neither canonical source (${sourcePath}) nor target (${targetPath}) exists!`)
    process.exit(1)
  }
  // Standalone mode: target is self-sufficient
  console.log('[sync-core] Standalone package mode: using bundled dsh-digest-core.js.')
  process.exit(0)
}

const sourceContent = readFileSync(sourcePath, 'utf8')
const expectedContent = HEADER + sourceContent

if (isCheck) {
  if (!existsSync(targetPath)) {
    console.error('[sync-core] Target dsh-plugin-melete/src/dsh-digest-core.js does not exist.')
    process.exit(1)
  }
  const currentContent = readFileSync(targetPath, 'utf8')
  if (currentContent !== expectedContent) {
    console.error('[sync-core] Target dsh-plugin-melete/src/dsh-digest-core.js is out of sync with melete/scripts/dsh-digest-core.js.')
    console.error('[sync-core] Run "npm run sync-core" in dsh-plugin-melete to synchronize.')
    process.exit(1)
  }
  console.log('[sync-core] Verification passed: dsh-digest-core.js is up to date.')
  process.exit(0)
}

writeFileSync(targetPath, expectedContent, 'utf8')
console.log(`[sync-core] Successfully synchronized ${sourcePath} -> ${targetPath}`)
