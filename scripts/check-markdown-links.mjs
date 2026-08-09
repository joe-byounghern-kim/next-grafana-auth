import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'

const repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()
const anchorCache = new Map()

function trackedMarkdownFiles() {
  const output = execFileSync('git', ['ls-files', '*.md'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).trim()
  return output ? output.split('\n').map((file) => resolve(repositoryRoot, file)) : []
}

function withoutFencedCode(markdown) {
  let fence = null
  return markdown
    .split('\n')
    .map((line) => {
      const match = line.match(/^ {0,3}(`{3,}|~{3,})/)
      if (match) {
        const marker = match[1][0]
        if (fence === null) fence = marker
        else if (fence === marker) fence = null
        return ''
      }
      return fence === null ? line : ''
    })
    .join('\n')
}

function githubSlug(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

function anchorsFor(markdownFile) {
  if (anchorCache.has(markdownFile)) return anchorCache.get(markdownFile)

  const markdown = withoutFencedCode(readFileSync(markdownFile, 'utf8'))
  const anchors = new Set()
  const duplicates = new Map()
  for (const line of markdown.split('\n')) {
    const match = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/)
    if (!match) continue
    const base = githubSlug(match[1])
    const duplicate = duplicates.get(base) ?? 0
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`)
    duplicates.set(base, duplicate + 1)
  }
  anchorCache.set(markdownFile, anchors)
  return anchors
}

function markdownTargets(markdown) {
  const targets = []
  const patterns = [
    /!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g,
    /^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm,
  ]

  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      targets.push({ index: match.index ?? 0, target: match[1] })
    }
  }
  return targets
}

function checkMarkdownFile(markdownFile) {
  const absoluteSource = resolve(markdownFile)
  if (!existsSync(absoluteSource)) {
    return [`${relative(repositoryRoot, absoluteSource)}:1 -> file missing`]
  }

  const markdown = withoutFencedCode(readFileSync(absoluteSource, 'utf8'))
  const failures = []
  for (const { index, target: rawTarget } of markdownTargets(markdown)) {
    const line = markdown.slice(0, index).split('\n').length
    const target = rawTarget.replace(/^<|>$/g, '')
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) continue

    const hashIndex = target.indexOf('#')
    const rawPath = (hashIndex === -1 ? target : target.slice(0, hashIndex)).split('?')[0]
    const rawFragment = hashIndex === -1 ? '' : target.slice(hashIndex + 1)
    let decodedPath
    let decodedFragment
    try {
      decodedPath = decodeURIComponent(rawPath)
      decodedFragment = decodeURIComponent(rawFragment)
    } catch {
      failures.push(
        `${relative(repositoryRoot, absoluteSource)}:${line} -> ${target} (invalid URI encoding)`
      )
      continue
    }

    let resolvedTarget = decodedPath
      ? decodedPath.startsWith('/')
        ? resolve(repositoryRoot, `.${decodedPath}`)
        : resolve(dirname(absoluteSource), decodedPath)
      : absoluteSource

    if (!existsSync(resolvedTarget)) {
      failures.push(
        `${relative(repositoryRoot, absoluteSource)}:${line} -> ${target} (target missing)`
      )
      continue
    }

    if (statSync(resolvedTarget).isDirectory()) {
      const readme = resolve(resolvedTarget, 'README.md')
      if (!decodedFragment || !existsSync(readme)) continue
      resolvedTarget = readme
    }

    if (decodedFragment && extname(resolvedTarget).toLowerCase() === '.md') {
      const anchors = anchorsFor(resolvedTarget)
      const exact = decodedFragment.toLowerCase()
      const normalized = githubSlug(decodedFragment)
      if (!anchors.has(exact) && !anchors.has(normalized)) {
        failures.push(
          `${relative(repositoryRoot, absoluteSource)}:${line} -> ${target} (anchor missing)`
        )
      }
    }
  }
  return failures
}

const requestedFiles = process.argv.slice(2)
const markdownFiles = requestedFiles.length > 0
  ? requestedFiles.map((file) => resolve(process.cwd(), file))
  : trackedMarkdownFiles()
const failures = markdownFiles.flatMap(checkMarkdownFile)

if (failures.length > 0) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}

console.log(`Checked ${markdownFiles.length} Markdown files`)
