import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk'

const manualRun = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'Manual Run',
    position: [220, 180],
  },
  output: [{}],
})

const rowAddedTrigger = trigger({
  type: 'n8n-nodes-base.googleSheetsTrigger',
  version: 1,
  config: {
    name: 'Row Added Trigger',
    position: [220, 420],
    parameters: {
      event: 'rowAdded',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '19A1DCQEEKa97NzcK8XBdsqk8LXC03jVMQSI0jHwfmFI',
      },
      sheetName: {
        __rl: true,
        mode: 'id',
        value: '0',
      },
      options: {
        dataLocationOnSheet: {
          values: {
            rangeDefinition: 'specifyRangeA1',
            range: 'A:R',
          },
        },
        valueRender: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      },
    },
  },
  output: [{}],
})

const workflowConfig = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Workflow Config',
    position: [500, 300],
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'sourceSpreadsheetId', name: 'sourceSpreadsheetId', type: 'string', value: '19A1DCQEEKa97NzcK8XBdsqk8LXC03jVMQSI0jHwfmFI' },
          { id: 'sourceReadRange', name: 'sourceReadRange', type: 'string', value: 'MASTERLIST!A1:R' },
          { id: 'targetSpreadsheetId', name: 'targetSpreadsheetId', type: 'string', value: '1uIpT3WTbjPNnyF4LkKuJ0dzbqynUnztwS9EF8MshehI' },
          { id: 'targetSheetName', name: 'targetSheetName', type: 'string', value: 'WEEKLY IR BY LOCATION' },
          { id: 'targetClearRange', name: 'targetClearRange', type: 'string', value: "'WEEKLY IR BY LOCATION'!A1:K80" },
          { id: 'summaryStartDate', name: 'summaryStartDate', type: 'string', value: '2026-06-28' },
          { id: 'summaryEndDate', name: 'summaryEndDate', type: 'string', value: '2026-07-02' },
          { id: 'locationOrder', name: 'locationOrder', type: 'array', value: ['COG Marilag', 'COG Trece', 'COG Jabez', 'COG Silang'] },
          { id: 'teamOrder', name: 'teamOrder', type: 'array', value: ['Audio', 'Broadcast', 'Stage Management', 'Arts', 'Tech', 'Maintenance', 'Light', 'Musician', 'Praise and Worship', 'Ushering', 'Housekeeping', 'Theatre'] },
        ],
      },
      options: {},
    },
  },
  output: [
    {
      sourceSpreadsheetId: '19A1DCQEEKa97NzcK8XBdsqk8LXC03jVMQSI0jHwfmFI',
      sourceReadRange: 'MASTERLIST!A1:R',
      targetSpreadsheetId: '1uIpT3WTbjPNnyF4LkKuJ0dzbqynUnztwS9EF8MshehI',
      targetSheetName: 'WEEKLY IR BY LOCATION',
      targetClearRange: "'WEEKLY IR BY LOCATION'!A1:K80",
      summaryStartDate: '2026-06-28',
      summaryEndDate: '2026-07-02',
      locationOrder: ['COG Marilag', 'COG Trece', 'COG Jabez', 'COG Silang'],
      teamOrder: ['Audio', 'Broadcast', 'Stage Management', 'Arts', 'Tech', 'Maintenance'],
    },
  ],
})

const readSourceRows = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  credentials: {
    googleApi: newCredential('Google Service Account account'),
  },
  config: {
    name: 'Read Source Rows',
    position: [1300, 300],
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: expr('{{ $("Workflow Config").item.json.sourceSpreadsheetId }}'),
      },
      sheetName: {
        __rl: true,
        mode: 'name',
        value: 'MASTERLIST',
      },
      options: {
        dataLocationOnSheet: {
          values: {
            rangeDefinition: 'specifyRangeA1',
            range: 'A1:R',
          },
        },
        outputFormatting: {
          values: {
            general: 'UNFORMATTED_VALUE',
            date: 'FORMATTED_STRING',
          },
        },
        returnAllMatches: 'returnAllMatches',
      },
    },
  },
  output: [
    {
      Timestamp: '6/28/2026 13:26:12',
      LOCATION: 'COG Marilag',
      'UNIT CONCERN': 'Broadcast',
      'PRODUCTION EVENT': 'Production Sunday Midslot',
      'Brief Description of Concern': 'The 3:30 PM Sunday Midslot Preferred Service telecast was not recorded by Karl Hanson.',
      'Criticality Levels (Church Production)': 'High-Show-stopper issues affecting the main service (e.g., no sound, no visuals, power failure). Requires immediate action before or during live service.',
      'ACTION TAKEN': 'Used the Empowered Service for the telecast instead.',
      'Corrective Action report required? ': 'Yes',
      REMARKS: 'Pending',
    },
  ],
})

const buildWeeklySummary = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Weekly Summary',
    position: [1560, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `\
const config = $('Workflow Config').item.json
const allItems = $input.all()
const sheetHeaders = allItems.length > 0 ? Object.keys(allItems[0].json) : []
const sheetRows = allItems.map((item) => sheetHeaders.map((key) => item.json[key] ?? ''))
const rawValues = sheetHeaders.length > 0 ? [sheetHeaders, ...sheetRows] : []

const NL = String.fromCharCode(10)
const SPACES = /[ \t]+/g
const SPACES_PUNCT = /[ \t]+([,.;:!?])/g
const PROD_START = /^production[ \t]+/i
const PROD_SHORT = /^prod[ \t]+/i
const WHOLEDAY = /(?<!\\w)Wholeday(?!\\w)/gi
const MULTI_SPACE = /[ ]{2,}/g

if (rawValues.length === 0) {
  return {
    json: {
      targetSpreadsheetId: config.targetSpreadsheetId,
      targetClearRange: config.targetClearRange,
      targetWriteRange: "'WEEKLY IR BY LOCATION'!A1:K6",
      values: [
        ['WEEKLY IR REPORT LOGS'],
        [' 06/28/2026 - 07/02/2026'],
        [],
        ['NO INCIDENTS FOUND'],
        ['PREACHER:' + NL + 'WORSHIP LEADER:'],
        ['Team', 'Event', 'Severity', 'Issue Summary', 'Action Taken', 'Follow-up', 'Status', '', 'Tech Crew per Unit', '', 'Notes'],
      ],
    },
  }
}

const [headers, ...rows] = rawValues
const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]))
const locationOrder = Array.isArray(config.locationOrder) ? config.locationOrder : []
const teamOrder = Array.isArray(config.teamOrder) ? config.teamOrder : []

const sourceFields = {
  timestamp: headerIndex['Timestamp'],
  location: headerIndex['LOCATION'],
  team: headerIndex['UNIT CONCERN'],
  event: headerIndex['PRODUCTION EVENT'],
  summary: headerIndex['Brief Description of Concern'],
  severity: headerIndex['Criticality Levels (Church Production)'],
  actionTaken: headerIndex['ACTION TAKEN'],
  followUp: headerIndex['Corrective Action report required? '],
  status: headerIndex['REMARKS'],
}

const toDate = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed
  return null
}

const startDate = new Date(config.summaryStartDate + 'T00:00:00')
const endDate = new Date(config.summaryEndDate + 'T23:59:59')

const pad = (value) => String(value).padStart(2, '0')
const formatDate = (date) => pad(date.getMonth() + 1) + '/' + pad(date.getDate()) + '/' + date.getFullYear()

const normalizeEvent = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  return raw
    .replace(PROD_START, '')
    .replace(PROD_SHORT, '')
    .replace(WHOLEDAY, 'Whole Day')
    .replace(SPACES, ' ')
    .trim()
}

const normalizeSeverity = (value) => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw.startsWith('high')) return 'High'
  if (raw.startsWith('medium')) return 'Medium'
  if (raw.startsWith('low')) return 'Low'
  return 'Medium'
}

const cleanText = (value) => {
  return String(value ?? '')
    .replace(SPACES, ' ')
    .replace(SPACES_PUNCT, '$1')
    .trim()
}

const normalizeYesNo = (value) => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'yes') return 'Yes'
  if (raw === 'no') return 'No'
  return ''
}

const normalizeStatus = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

const locationRank = (value) => {
  const index = locationOrder.findIndex((entry) => String(entry).toLowerCase() === String(value).toLowerCase())
  return index === -1 ? 999 : index
}

const teamRank = (value) => {
  const index = teamOrder.findIndex((entry) => String(entry).toLowerCase() === String(value).toLowerCase())
  return index === -1 ? 999 : index
}

const normalizedRows = rows
  .map((row) => {
    const timestamp = row[sourceFields.timestamp] ?? ''
    const parsedDate = toDate(timestamp)
    if (!parsedDate) return null
    if (parsedDate < startDate || parsedDate > endDate) return null

    return {
      sourceTimestamp: parsedDate,
      location: cleanText(row[sourceFields.location]),
      team: cleanText(row[sourceFields.team]),
      event: normalizeEvent(row[sourceFields.event]),
      severity: normalizeSeverity(row[sourceFields.severity]),
      issueSummary: cleanText(row[sourceFields.summary]),
      actionTaken: cleanText(row[sourceFields.actionTaken]),
      followUp: normalizeYesNo(row[sourceFields.followUp]),
      status: normalizeStatus(row[sourceFields.status]),
    }
  })
  .filter(Boolean)

normalizedRows.sort((left, right) => {
  const byLocation = locationRank(left.location) - locationRank(right.location)
  if (byLocation !== 0) return byLocation
  const byTeam = teamRank(left.team) - teamRank(right.team)
  if (byTeam !== 0) return byTeam
  const byEvent = left.event.localeCompare(right.event)
  if (byEvent !== 0) return byEvent
  return left.sourceTimestamp.getTime() - right.sourceTimestamp.getTime()
})

const groupedByLocation = normalizedRows.reduce((accumulator, row) => {
  if (!accumulator[row.location]) accumulator[row.location] = []
  accumulator[row.location].push(row)
  return accumulator
}, {})

const summaryRows = [
  ['WEEKLY IR REPORT LOGS'],
  [' ' + formatDate(startDate) + ' - ' + formatDate(endDate)],
  [],
]

const orderedLocations = Object.keys(groupedByLocation).sort((left, right) => locationRank(left) - locationRank(right))

if (orderedLocations.length === 0) {
  summaryRows.push(['NO INCIDENTS FOUND'])
  summaryRows.push(['PREACHER:' + NL + 'WORSHIP LEADER:'])
  summaryRows.push(['Team', 'Event', 'Severity', 'Issue Summary', 'Action Taken', 'Follow-up', 'Status', '', 'Tech Crew per Unit', '', 'Notes'])
} else {
  orderedLocations.forEach((location, locationIndex) => {
    summaryRows.push([String(location).toUpperCase()])
    summaryRows.push(['PREACHER:' + NL + 'WORSHIP LEADER:'])
    summaryRows.push(['Team', 'Event', 'Severity', 'Issue Summary', 'Action Taken', 'Follow-up', 'Status', '', 'Tech Crew per Unit', '', 'Notes'])

    let previousTeam = ''
    groupedByLocation[location].forEach((row) => {
      const displayTeam = row.team === previousTeam ? '' : row.team
      previousTeam = row.team
      summaryRows.push([
        displayTeam,
        row.event,
        row.severity,
        row.issueSummary,
        row.actionTaken,
        row.followUp,
        row.status,
        '',
        '',
        '',
        '',
      ])
    })

    if (locationIndex < orderedLocations.length - 1) {
      summaryRows.push([])
      summaryRows.push([])
    }
  })
}

return {
  json: {
    targetSpreadsheetId: config.targetSpreadsheetId,
    targetClearRange: config.targetClearRange,
    targetWriteRange: "'" + config.targetSheetName + "'!A1:K" + summaryRows.length,
    values: summaryRows,
  },
}
`,
    },
  },
  output: [
    {
      targetSpreadsheetId: '1uIpT3WTbjPNnyF4LkKuJ0dzbqynUnztwS9EF8MshehI',
      targetClearRange: "'WEEKLY IR BY LOCATION'!A1:K80",
      targetWriteRange: "'WEEKLY IR BY LOCATION'!A1:K25",
      values: [
        ['WEEKLY IR REPORT LOGS'],
        [' 06/28/2026 - 07/02/2026'],
        [],
        ['COG MARILAG'],
        ['PREACHER:\nWORSHIP LEADER:'],
        ['Team', 'Event', 'Severity', 'Issue Summary', 'Action Taken', 'Follow-up', 'Status', '', 'Tech Crew per Unit', '', 'Notes'],
      ],
    },
  ],
})

const clearTargetRange = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  credentials: {
    googleApi: newCredential('Google Service Account account'),
  },
  config: {
    name: 'Clear Target Range',
    position: [1820, 300],
    parameters: {
      method: 'POST',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      url: expr('https://sheets.googleapis.com/v4/spreadsheets/{{ $("Build Weekly Summary").item.json.targetSpreadsheetId }}/values/{{ encodeURIComponent($("Build Weekly Summary").item.json.targetClearRange) }}:clear'),
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ ({}) }}'),
      options: {
        response: {
          response: {
            responseFormat: 'json',
          },
        },
      },
    },
  },
  output: [{ clearedRange: "'WEEKLY IR BY LOCATION'!A1:K80" }],
})

const writeSummaryRange = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  credentials: {
    googleApi: newCredential('Google Service Account account'),
  },
  config: {
    name: 'Write Summary Range',
    position: [2080, 300],
    parameters: {
      method: 'PUT',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      url: expr('https://sheets.googleapis.com/v4/spreadsheets/{{ $("Build Weekly Summary").item.json.targetSpreadsheetId }}/values/{{ encodeURIComponent($("Build Weekly Summary").item.json.targetWriteRange) }}'),
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'valueInputOption', value: 'USER_ENTERED' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ ({ values: $("Build Weekly Summary").item.json.values }) }}'),
      options: {
        response: {
          response: {
            responseFormat: 'json',
          },
        },
      },
    },
  },
  output: [{ updatedRange: "'WEEKLY IR BY LOCATION'!A1:K25" }],
})

const usageNote = sticky(
  'Backfill/test window set to 2026-06-28 through 2026-07-02. Update date fields in Workflow Config later for new weekly runs. Right-side crew columns stay blank on purpose because source sheet has no matching crew roster data.',
  [workflowConfig, buildWeeklySummary],
  { color: 5, width: 520, height: 180 },
)

export default workflow('weekly-ir-by-location-summary', 'Weekly IR By Location Summary')
  .add(manualRun)
  .to(workflowConfig)
  .to(readSourceRows)
  .to(buildWeeklySummary)
  .to(clearTargetRange)
  .to(writeSummaryRange)
  .add(rowAddedTrigger)
  .to(workflowConfig)
  .add(usageNote)
