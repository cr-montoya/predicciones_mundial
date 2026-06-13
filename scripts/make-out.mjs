import { cpSync, mkdirSync, readdirSync, copyFileSync, statSync, rmSync } from 'fs'
import { join, dirname, relative } from 'path'

const SRC = '.next/server/app'
const OUT = 'out'

rmSync(OUT, { recursive: true, force: true })
mkdirSync(`${OUT}/_next`, { recursive: true })

// Copy static assets (_next/static → out/_next/static)
cpSync('.next/static', `${OUT}/_next/static`, { recursive: true })

// Copy only .html files preserving directory structure
function copyHtml(src, dest) {
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true })
      copyHtml(srcPath, destPath)
    } else if (entry.name.endsWith('.html')) {
      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(srcPath, destPath)
    }
  }
}

copyHtml(SRC, OUT)

console.log('Static export assembled in out/')
