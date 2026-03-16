import fs from 'fs'
import path from 'path'

const projectRoot = path.resolve('d:/AAA大创/GradBot')
const linesPerPage = 58
const targetPages = 60
const outputDir = path.join(projectRoot, 'deliverables')
const outputFile = path.join(outputDir, 'GradBot_V1.0_软著源代码.txt')

const allowedRoots = [path.join(projectRoot, 'backend', 'src'), path.join(projectRoot, 'frontend', 'src')]
const allowedExtensions = new Set(['.js', '.ts', '.tsx'])
const excludedFiles = new Set(['env.d.ts'])

const preferredStart = [
  'backend/src/index.js',
  'backend/src/config/database.js',
  'backend/src/models/index.js',
  'backend/src/routes/auth.js',
  'frontend/src/main.tsx',
  'frontend/src/App.tsx',
]

const preferredEnd = [
  'frontend/src/pages/student/TaskBookGeneration.tsx',
  'frontend/src/pages/student/ProposalGeneration.tsx',
  'frontend/src/pages/student/MidtermReportGeneration.tsx',
  'frontend/src/utils/api.ts',
  'backend/src/routes/teacher.js',
  'backend/src/routes/admin.js',
  'backend/src/routes/taskBook.js',
  'backend/src/routes/proposal.js',
  'backend/src/routes/midterm.js',
  'backend/src/services/aiService.js',
]

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
      continue
    }

    const ext = path.extname(entry.name)
    if (allowedExtensions.has(ext) && !excludedFiles.has(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function relativeProjectPath(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/')
}

function orderFiles(allFiles) {
  const byRelative = new Map(allFiles.map((file) => [relativeProjectPath(file), file]))
  const selected = []
  const used = new Set()

  for (const relPath of preferredStart) {
    if (byRelative.has(relPath)) {
      selected.push(byRelative.get(relPath))
      used.add(relPath)
    }
  }

  const middle = allFiles
    .map(relativeProjectPath)
    .filter((relPath) => !used.has(relPath) && !preferredEnd.includes(relPath))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  for (const relPath of middle) {
    selected.push(byRelative.get(relPath))
    used.add(relPath)
  }

  for (const relPath of preferredEnd) {
    if (byRelative.has(relPath) && !used.has(relPath)) {
      selected.push(byRelative.get(relPath))
      used.add(relPath)
    }
  }

  return selected
}

function sanitizeLine(line) {
  return line
    .replace(/[A-Za-z0-9._%+-]+@gradbot\.local/g, '[REDACTED_EMAIL]')
    .replace(/@gradbot\.local/g, '@[REDACTED_DOMAIN]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\b1[3-9]\d{9}\b/g, '[REDACTED_PHONE]')
    .replace(/GradBot123!/g, '[REDACTED_PASSWORD]')
    .replace(/gradbot-secret/g, '[REDACTED_SECRET]')
    .replace(/DEEPSEEK_API_KEY/g, 'DEEPSEEK_API_KEY')
}

function buildSourceLines(files) {
  const result = []

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((line) => {
      if (!line.trim()) {
        return
      }

      result.push(sanitizeLine(line))
    })
  }

  return result
}

function paginate(lines) {
  const pages = []
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage))
  }
  return pages
}

function selectPages(pages) {
  if (pages.length <= targetPages) {
    return pages.map((page) => ({ page }))
  }

  const frontPages = pages.slice(0, targetPages / 2).map((page) => ({ page }))
  const backPages = pages.slice(-(targetPages / 2)).map((page) => ({ page }))

  return [...frontPages, ...backPages]
}

function renumberLines(selectedPages) {
  const mergedLines = selectedPages.flatMap(({ page }) => page)
  return mergedLines.map((line, index) => `${index + 1} ${line}`)
}

function main() {
  const files = orderFiles(allowedRoots.flatMap(walkFiles))
  const sourceLines = buildSourceLines(files)
  const pages = paginate(sourceLines)
  const selectedPages = selectPages(pages)
  const content = renumberLines(selectedPages).join('\n')

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputFile, content, 'utf8')

  console.log(`Exported ${selectedPages.length} pages, ${selectedPages.flatMap(({ page }) => page).length} lines to: ${outputFile}`)
}

main()
