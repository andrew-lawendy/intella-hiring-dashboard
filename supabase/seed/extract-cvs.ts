import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

function extractCvData(
  html: string,
): Record<string, { mime: string; filename: string; data: string }> {
  const startIdx = html.indexOf('const CV_DATA = {')
  if (startIdx === -1) throw new Error('CV_DATA not found in HTML file')
  let depth = 0
  let inString = false
  let stringChar = ''
  let i = startIdx + 'const CV_DATA = '.length
  for (; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (ch === '\\') {
        i++
        continue
      }
      if (ch === stringChar) inString = false
    } else {
      if (ch === '"' || ch === "'") {
        inString = true
        stringChar = ch
        continue
      }
      if (ch === '{') depth++
      if (ch === '}') {
        depth--
        if (depth === 0) break
      }
    }
  }
  const objStr = html.slice(startIdx + 'const CV_DATA = '.length, i + 1)

  return eval(`(${objStr})`)
}

async function uploadCvs() {
  const htmlPath = join(process.cwd(), 'Intella Dashboard.html')
  console.log(`Reading HTML file from ${htmlPath}...`)
  const html = readFileSync(htmlPath, 'utf-8')

  console.log('Extracting CV data...')
  const cvData = extractCvData(html)
  const candidateIds = Object.keys(cvData)
  console.log(`Found ${candidateIds.length} CVs: ${candidateIds.join(', ')}`)

  for (const id of candidateIds) {
    const cv = cvData[id]
    if (!cv || !cv.data) {
      console.log(`  Skipping ${id} — no data`)
      continue
    }
    console.log(`  Uploading ${id}.pdf (${cv.filename})...`)
    const buffer = Buffer.from(cv.data, 'base64')
    const { error } = await supabase.storage.from('candidate-cvs').upload(`${id}.pdf`, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (error) {
      console.error(`  Failed to upload ${id}: ${error.message}`)
    } else {
      console.log(`  ✓ ${id}.pdf uploaded`)
    }
  }
  console.log('CV upload complete.')
}

uploadCvs().catch((err) => {
  console.error('CV extraction failed:', err)
  process.exit(1)
})
