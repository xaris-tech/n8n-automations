import fs from 'node:fs'

const input = JSON.parse(fs.readFileSync(new URL('./sample-input.json', import.meta.url), 'utf8'))

const SECTION_RE = /^(intro|verse(?:\s+\d+)?|pre[-\s]?chorus|chorus|bridge|tag|outro|instrumental|interlude|coda)(?:\s*[:\-].*)?$/i

function extractSpreadsheetId(url) {
  const value = String(url ?? '').trim()
  const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(value)) return value
  throw new Error('Invalid Google Sheets link or spreadsheet ID')
}

function normalizeSection(value) {
  return String(value ?? '')
    .replace(/[:\-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function parseLyrics(text) {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n')
  const rows = []
  let currentSong = ''
  let currentSection = null
  let currentLines = []

  const flush = () => {
    if (!currentSection) return
    rows.push({
      songTitle: currentSong,
      section: normalizeSection(currentSection),
      production: `${normalizeSection(currentSection)}:\n${currentLines.join('\n').trim()}`.trim(),
    })
    currentSection = null
    currentLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (SECTION_RE.test(line)) {
      flush()
      currentSection = line
      currentLines = []
      continue
    }
    if (!currentSection) {
      currentSong = line
      rows.push({ songTitle: currentSong, section: 'SONG', production: currentSong })
      continue
    }
    currentLines.push(line)
  }
  flush()

  return rows.map((row, index) => ({
    seq: index + 1,
    production: row.production,
    who: '',
    section: row.section,
    songTitle: row.songTitle,
  }))
}

const parsed = parseLyrics(input.lyricsText)

console.log(JSON.stringify({
  vaSpreadsheetId: extractSpreadsheetId(input.vaLink),
  targetSheetName: input.targetSheetName,
  startRow: input.startRow,
  rows: parsed,
}, null, 2))

