const config = $('Workflow Config').item.json
const sourcePayload = $('Read Source Values').item.json
const targetPayload = $('Read Existing Target Rows').item.json
const automationPayload = $('Read Automation Settings').item.json
const triggerPayload = (() => {
  try {
    return $('Run From Sheet').item.json.body ?? $('Run From Sheet').item.json ?? {}
  } catch (error) {
    return {}
  }
})()

const clean = (value) => String(value ?? '')
  .replace(/\r/g, '')
  .replace(/[ \t]+/g, ' ')
  .trim()

const normalizePerson = (value) => {
  const text = clean(value)
  if (!text) return ''
  if (text.toLowerCase() === 'n/a') return ''
  return text
}

const monthNames = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
const monthAliases = new Map([
  ['jan', 1], ['january', 1],
  ['feb', 2], ['february', 2],
  ['mar', 3], ['march', 3],
  ['apr', 4], ['april', 4],
  ['may', 5],
  ['jun', 6], ['june', 6],
  ['jul', 7], ['july', 7],
  ['aug', 8], ['august', 8],
  ['sep', 9], ['sept', 9], ['september', 9],
  ['oct', 10], ['october', 10],
  ['nov', 11], ['november', 11],
  ['dec', 12], ['december', 12],
])

const parseDate = (value) => {
  const text = clean(value)
  if (!text) return null
  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) return parsed
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!match) return null
  const year = Number(match[3].length === 2 ? '20' + match[3] : match[3])
  return new Date(year, Number(match[1]) - 1, Number(match[2]))
}

const formatDate = (value) => {
  const parsed = parseDate(value)
  if (!parsed) return clean(value)
  return monthNames[parsed.getMonth()] + ' ' + parsed.getDate()
}

const normalizeMonth = (value) => {
  const text = clean(value).toLowerCase()
  if (!text) return null
  if (/^\d+$/.test(text)) {
    const month = Number(text)
    return month >= 1 && month <= 12 ? month : null
  }
  return monthAliases.get(text) ?? null
}

const automationRows = Array.isArray(automationPayload.values) ? automationPayload.values : []
const automationSettings = Object.fromEntries(
  automationRows
    .filter((row) => row.length >= 2)
    .map((row) => [clean(row[0]).toLowerCase(), clean(row[1])])
)

const triggerMonth = normalizeMonth(triggerPayload.month ?? triggerPayload.Month)
const settingsMonth = normalizeMonth(automationSettings.month ?? automationSettings['date range'])
const selectedMonth = triggerMonth ?? settingsMonth

const normalizeYear = (value) => {
  const year = Number(clean(value))
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null
}
const triggerYear = normalizeYear(triggerPayload.year ?? triggerPayload.Year)
const settingsYear = normalizeYear(
  automationSettings.year ?? automationSettings['date year'] ?? automationSettings['date range year']
)
const selectedYear = triggerYear ?? settingsYear

const requestedFillWhat = clean(triggerPayload.fillWhat ?? triggerPayload['Fill What?'])
const settingsFillWhat = clean(automationSettings['fill what?'])
const fillWhat = [requestedFillWhat, settingsFillWhat, 'No Show']
  .find((value) => value.toLowerCase() === 'no show')

const rawValues = Array.isArray(sourcePayload.values) ? sourcePayload.values : []
if (rawValues.length < 3) return [{ json: { appendedCount: 0, values: [], reason: 'No source rows found' } }]
const [, headers, ...rows] = rawValues

const normalizeSlot = (value) => {
  const raw = clean(value)
  const lower = raw.toLowerCase()
  if (lower.includes('main slot')) return 'Mainslot'
  if (lower.includes('mid slot')) return 'Midslot'
  if (lower.includes('tws') || lower.includes('revival night')) return 'TWS'
  if (lower.includes('empowered night')) return 'Enight'
  return raw
    .replace(/^production\s+/i, '')
    .replace(/^prod\s+/i, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const targetValues = Array.isArray(targetPayload.values) ? targetPayload.values : []
const [targetHeaders = [], ...targetRows] = targetValues
const targetIndex = Object.fromEntries(targetHeaders.map((header, index) => [clean(header).toUpperCase(), index]))
const existingKeys = new Set(
  targetRows
    .map((row) => {
      const date = clean(row[targetIndex.DATE])
      const slot = clean(row[targetIndex.SLOT])
      const name = clean(row[targetIndex.NAME])
      const floorDirector = clean(row[targetIndex['FLOOR DIRECTOR']])
      const technicalDirector = clean(row[targetIndex['TECHNICAL DIRECTOR']])
      return [date, slot, name, floorDirector, technicalDirector].join(' | ')
    })
    .filter((key) => key !== ' |  |  |  | ')
)

const outputRows = []
for (const row of rows) {
  const sourceDate = parseDate(row[2])
  if (!sourceDate) continue
  if (selectedMonth && sourceDate.getMonth() + 1 !== selectedMonth) continue
  if (selectedYear && sourceDate.getFullYear() !== selectedYear) continue

  const productionName = clean(row[1])
  const date = formatDate(row[2])
  const technicalDirector = normalizePerson(row[3])
  const floorDirector = normalizePerson(row[5])
  const slot = normalizeSlot(productionName)
  const noShowNames = [row[15], row[16], row[17]].map(normalizePerson).filter(Boolean)

  for (const name of noShowNames) {
    const key = [date, slot, name, floorDirector, technicalDirector].join(' | ')
    if (existingKeys.has(key)) continue
    existingKeys.add(key)
    outputRows.push(['', '', date, slot, name, floorDirector, technicalDirector])
  }
}

if (outputRows.length === 0) return []

return [{
  json: {
    targetSpreadsheetId: config.targetSpreadsheetId,
    targetAppendRange: config.targetAppendRange,
    values: outputRows,
    appendedCount: outputRows.length,
    selectedMonth,
    selectedYear,
  },
}]
