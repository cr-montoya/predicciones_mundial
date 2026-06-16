import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const specsDir = path.join(root, 'specs')
const indexPath = path.join(specsDir, 'README.md')

const requiredFiles = ['requirements.md', 'design.md', 'tasks.md']
const validStatuses = new Set([
  'pending',
  'active',
  'blocked',
  'in_review',
  'completed',
  'deferred',
  'historical',
])

const statusAliases: Record<string, string> = {
  completada: 'completed',
  completado: 'completed',
  completed: 'completed',
  pendiente: 'pending',
  pending: 'pending',
  activa: 'active',
  activo: 'active',
  active: 'active',
  bloqueada: 'blocked',
  bloqueado: 'blocked',
  blocked: 'blocked',
  revision: 'in_review',
  'en revision': 'in_review',
  in_review: 'in_review',
  diferida: 'deferred',
  diferido: 'deferred',
  deferred: 'deferred',
  historica: 'historical',
  historico: 'historical',
  historical: 'historical',
}

type Finding = {
  level: 'error' | 'warning'
  spec?: string
  message: string
}

const findings: Finding[] = []

function add(level: Finding['level'], message: string, spec?: string) {
  findings.push({ level, message, spec })
}

function normalizeStatus(value: string | undefined) {
  if (!value) return undefined
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[.`]/g, '')
    .replace(/\s+/g, ' ')
  if (statusAliases[cleaned]) return statusAliases[cleaned]

  for (const [alias, status] of Object.entries(statusAliases)) {
    if (cleaned.startsWith(`${alias} `) || cleaned.startsWith(`${alias} /`)) {
      return status
    }
  }

  return cleaned
}

function extractFrontmatterStatus(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return undefined
  const status = match[1].match(/^status:\s*([^\n#]+)/m)
  return normalizeStatus(status?.[1])
}

function extractSectionStatus(content: string) {
  const lines = content.split(/\r?\n/)
  const statusHeadingIndex = lines.findIndex((line) =>
    /^##\s+(Status|Estado)\s*$/i.test(line.trim()),
  )
  if (statusHeadingIndex === -1) return undefined

  for (const line of lines.slice(statusHeadingIndex + 1)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('## ')) return undefined
    return normalizeStatus(trimmed)
  }

  return undefined
}

function hasOpenTasks(content: string) {
  return /^- \[ \]/m.test(content)
}

if (!existsSync(specsDir)) {
  console.error('spec:check failed: specs/ does not exist')
  process.exit(1)
}

if (!existsSync(indexPath)) {
  add('error', 'specs/README.md is missing')
}

const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : ''
const specDirs = readdirSync(specsDir)
  .filter((entry) => {
    const fullPath = path.join(specsDir, entry)
    return statSync(fullPath).isDirectory()
  })
  .sort()

for (const spec of specDirs) {
  const specPath = path.join(specsDir, spec)

  for (const file of requiredFiles) {
    if (!existsSync(path.join(specPath, file))) {
      add('error', `missing ${file}`, spec)
    }
  }

  if (!index.includes(spec)) {
    add('error', 'not listed in specs/README.md', spec)
  }

  const requirementsPath = path.join(specPath, 'requirements.md')
  const tasksPath = path.join(specPath, 'tasks.md')

  if (!existsSync(requirementsPath)) continue

  const requirements = readFileSync(requirementsPath, 'utf8')
  const frontmatterStatus = extractFrontmatterStatus(requirements)
  const sectionStatus = extractSectionStatus(requirements)
  const status = frontmatterStatus ?? sectionStatus

  if (!frontmatterStatus) {
    add('warning', 'requirements.md has no YAML status metadata', spec)
  }

  if (!status) {
    add('warning', 'could not determine spec status', spec)
  } else if (!validStatuses.has(status)) {
    add('error', `invalid status "${status}"`, spec)
  }

  if (status === 'completed' && existsSync(tasksPath)) {
    const tasks = readFileSync(tasksPath, 'utf8')
    if (hasOpenTasks(tasks)) {
      add('error', 'status is completed but tasks.md has open tasks', spec)
    }
  }
}

const errors = findings.filter((finding) => finding.level === 'error')
const warnings = findings.filter((finding) => finding.level === 'warning')

for (const finding of findings) {
  const prefix = finding.level === 'error' ? 'ERROR' : 'WARN'
  const target = finding.spec ? `${finding.spec}: ` : ''
  console.log(`${prefix}: ${target}${finding.message}`)
}

console.log(
  `spec:check inspected ${specDirs.length} specs, ${errors.length} errors, ${warnings.length} warnings`,
)

if (errors.length > 0) {
  process.exit(1)
}
