import { access } from 'node:fs/promises'

const files = [
  'electron/main.js',
  'electron/preload.js',
  '.output/server/index.mjs',
]

let ok = true
for (const f of files) {
  try {
    await access(f)
    console.log(`✓ ${f}`)
  } catch {
    console.error(`✗ ${f} not found`)
    ok = false
  }
}

if (!ok) {
  console.error('\nMissing files. Run "nuxt build" first.')
  process.exit(1)
}

console.log('\nElectron files ready.')
