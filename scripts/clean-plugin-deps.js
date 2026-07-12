#!/usr/bin/env node
/**
 * 清理 plugin/node_modules 中的非运行时文件，减小插件体积。
 * 删除：*.map、*.js.gz、*.md
 */
import { readdirSync, unlinkSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const targetDir = resolve(root, 'plugin/node_modules')

/** @type {RegExp[]} */
const REMOVE_PATTERNS = [
  /\.map$/i,
  /\.js\.gz$/i,
  /\.md$/i,
]

function shouldRemove(filename) {
  return REMOVE_PATTERNS.some((re) => re.test(filename))
}

/**
 * @param {string} dir
 * @returns {{ path: string, size: number }[]}
 */
function collect(dir) {
  /** @type {{ path: string, size: number }[]} */
  const hits = []
  if (!existsSync(dir)) return hits

  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }

    if (st.isDirectory()) {
      hits.push(...collect(full))
    } else if (st.isFile() && shouldRemove(name)) {
      hits.push({ path: full, size: st.size })
    }
  }
  return hits
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function main() {
  const dryRun = process.argv.includes('--dry-run')

  if (!existsSync(targetDir)) {
    console.error(`目录不存在: ${relative(root, targetDir)}`)
    process.exit(1)
  }

  const files = collect(targetDir)
  if (files.length === 0) {
    console.log('没有需要清理的文件。')
    return
  }

  let totalSize = 0
  for (const f of files) {
    totalSize += f.size
    const rel = relative(root, f.path)
    if (dryRun) {
      console.log(`[dry-run] ${rel} (${formatSize(f.size)})`)
    } else {
      unlinkSync(f.path)
      console.log(`删除 ${rel}`)
    }
  }

  console.log(
    `\n${dryRun ? '将删除' : '已删除'} ${files.length} 个文件，共 ${formatSize(totalSize)}`,
  )
}

main()
