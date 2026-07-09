const AUTOMATION_SHEET = 'Automation'
const DEFAULT_WEBHOOK_URL = 'https://9b76-123-253-51-223.ngrok-free.app/webhook/no-show-sync'

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('No Show Sync')
    .addItem('Run for selected month', 'runNoShowSync')
    .addToUi()
}

function runNoShowSync() {
  const spreadsheet = SpreadsheetApp.getActive()
  const sheet = spreadsheet.getSheetByName(AUTOMATION_SHEET)
  if (!sheet) throw new Error(`Missing ${AUTOMATION_SHEET} sheet`)

  const settings = Object.fromEntries(
    sheet.getRange('A1:B20').getDisplayValues()
      .filter((row) => row[0])
      .map((row) => [String(row[0]).trim().toLowerCase(), String(row[1]).trim()])
  )
  const fillWhat = settings['fill what?'] || 'No Show'
  const month = settings.month
  const year = settings.year
  const configuredWebhookUrl = settings['webhook url']
  const webhookUrl = isPublicWebhookUrl(configuredWebhookUrl)
    ? configuredWebhookUrl
    : DEFAULT_WEBHOOK_URL

  if (!month) throw new Error('Missing Month setting in Automation!A:B')
  if (!year) throw new Error('Missing Year setting in Automation!A:B')
  if (!isPublicWebhookUrl(webhookUrl)) {
    throw new Error('Webhook URL must be a public HTTPS n8n webhook URL')
  }

  setSetting(sheet, 'Last Run Status', 'Running...')

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      spreadsheetId: spreadsheet.getId(),
      fillWhat,
      month,
      year,
    }),
  })

  const status = response.getResponseCode()
  const body = response.getContentText()
  if (status >= 200 && status < 300) {
    setSetting(sheet, 'Last Run Status', `Accepted (${status})`)
    return
  }

  setSetting(sheet, 'Last Run Status', `Failed (${status})`)
  throw new Error(body || `Webhook failed with status ${status}`)
}

function isPublicWebhookUrl(value) {
  return /^https:\/\/[^/\s]+\/webhook\/[^\s]+$/i.test(value)
}

function setSetting(sheet, label, value) {
  const labels = sheet.getRange('A1:A20').getDisplayValues().flat()
  const rowIndex = labels.findIndex((cell) => String(cell).trim().toLowerCase() === label.toLowerCase())
  if (rowIndex === -1) throw new Error(`Missing ${label} setting in Automation!A:A`)
  sheet.getRange(rowIndex + 1, 2).setValue(value)
}
