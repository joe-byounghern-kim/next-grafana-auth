import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const budget = 15 * 1024

for (const file of ['dist/index.mjs', 'dist/component.mjs']) {
  try {
    const size = gzipSync(readFileSync(file)).byteLength
    console.log(`${file} (gzip): ${size} bytes, budget: ${budget} bytes`)
    if (size > budget) {
      console.error(`${file} exceeds the ${budget}-byte gzip budget: ${size} bytes`)
      process.exitCode = 1
    }
  } catch (error) {
    console.error(`Cannot measure ${file}: ${error.message}`)
    process.exitCode = 1
  }
}
