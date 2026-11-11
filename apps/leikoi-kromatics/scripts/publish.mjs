// Copies the Vite build into the static site:
//   dist/index.html -> /demo-leikoi-kromatics.html
//   dist/*          -> /demo/leikoi-kromatics/
import { cpSync, rmSync, renameSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../..')
const out = resolve(root, 'demo/leikoi-kromatics')
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(resolve(here, '../dist'), out, { recursive: true })
renameSync(resolve(out, 'index.html'), resolve(root, 'demo-leikoi-kromatics.html'))
console.log('Published to', out)
