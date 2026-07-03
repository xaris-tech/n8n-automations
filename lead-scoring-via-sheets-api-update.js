import { workflow, node, trigger } from '@n8n/workflow-sdk';

const start = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'Start',
    position: [240, 304],
  },
  output: [{}],
});

const workflowConfig = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Workflow Config',
    position: [480, 304],
    parameters: {
      assignments: {
        assignments: [
          { id: 'spreadsheetId', name: 'spreadsheetId', type: 'string', value: '1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A' },
          { id: 'readRange', name: 'readRange', type: 'string', value: 'Leads!A2:G' },
          { id: 'writeRange', name: 'writeRange', type: 'string', value: 'Leads!A2:I' },
          { id: 'googleScope', name: 'googleScope', type: 'string', value: 'https://www.googleapis.com/auth/spreadsheets' },
          { id: 'tokenUrl', name: 'tokenUrl', type: 'string', value: 'https://oauth2.googleapis.com/token' },
          { id: 'serviceAccountEmail', name: 'serviceAccountEmail', type: 'string', value: 'n8n-portfolio@operating-bolt-453212-b6.iam.gserviceaccount.com' },
          { id: 'weightBudgetHigh', name: 'weightBudgetHigh', type: 'number', value: 40 },
          { id: 'weightBudgetMedium', name: 'weightBudgetMedium', type: 'number', value: 25 },
          { id: 'weightBudgetLow', name: 'weightBudgetLow', type: 'number', value: 10 },
          { id: 'weightBudgetDefault', name: 'weightBudgetDefault', type: 'number', value: 5 },
          { id: 'weightSourceReferral', name: 'weightSourceReferral', type: 'number', value: 25 },
          { id: 'weightSourceLinkedin', name: 'weightSourceLinkedin', type: 'number', value: 15 },
          { id: 'weightSourceWebsite', name: 'weightSourceWebsite', type: 'number', value: 10 },
          { id: 'weightSourceOther', name: 'weightSourceOther', type: 'number', value: 5 },
          { id: 'weightInterestAutomation', name: 'weightInterestAutomation', type: 'number', value: 20 },
          { id: 'weightInterestAi', name: 'weightInterestAi', type: 'number', value: 20 },
          { id: 'weightInterestConsulting', name: 'weightInterestConsulting', type: 'number', value: 10 },
          { id: 'weightInterestDefault', name: 'weightInterestDefault', type: 'number', value: 5 },
        ],
      },
      options: {},
    },
  },
  output: [
    {
      spreadsheetId: '1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A',
      readRange: 'Leads!A2:G',
      writeRange: 'Leads!A2:I',
      googleScope: 'https://www.googleapis.com/auth/spreadsheets',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      serviceAccountEmail: 'n8n-portfolio@operating-bolt-453212-b6.iam.gserviceaccount.com',
    },
  ],
});

const buildJwtAssertion = node({
  type: 'n8n-nodes-base.jwt',
  version: 1,
  config: {
    name: 'Build JWT Assertion',
    position: [720, 304],
    parameters: {
      useJson: true,
      claimsJson: "={{ ({ iss: 'n8n-portfolio@operating-bolt-453212-b6.iam.gserviceaccount.com', scope: $json.googleScope, aud: $json.tokenUrl, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }) }}",
      options: {
        algorithm: 'RS256',
      },
    },
    credentials: {
      jwtAuth: newCredential('JWT Auth account'),
    },
  },
  output: [{ token: 'signed-jwt' }],
});

const exchangeAccessToken = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Exchange Access Token',
    position: [992, 304],
    parameters: {
      method: 'POST',
      url: 'https://oauth2.googleapis.com/token',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
      },
      sendBody: true,
      contentType: 'form-urlencoded',
      bodyParameters: {
        parameters: [
          { name: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:jwt-bearer' },
          { name: 'assertion', value: '={{ $json.token }}' },
        ],
      },
      options: {
        response: {
          response: {
            responseFormat: 'json',
          },
        },
      },
    },
  },
  output: [{ access_token: 'token' }],
});

const readLeadRows = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Read Lead Rows',
    position: [1248, 304],
    parameters: {
      url: "=https://sheets.googleapis.com/v4/spreadsheets/{{ $('Workflow Config').item.json.spreadsheetId }}/values/{{ encodeURIComponent($('Workflow Config').item.json.readRange) }}",
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Authorization', value: "=Bearer {{ $('Exchange Access Token').item.json.access_token }}" }],
      },
      options: {
        response: {
          response: {
            responseFormat: 'json',
          },
        },
      },
    },
  },
  output: [{ values: [['Ava', 'ava@example.com']] }],
});

const scoreLeadRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Score Lead Rows',
    position: [1504, 304],
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: `const config = $('Workflow Config').item.json;
const accessToken = $('Exchange Access Token').item.json.access_token;
const rows = $json.values ?? [];
const scoredRows = rows.map((row) => {
  const name = row[0] ?? '';
  const email = row[1] ?? '';
  const company = row[2] ?? '';
  const source = String(row[3] ?? '').trim().toLowerCase();
  const budgetRaw = String(row[4] ?? '').trim().toLowerCase();
  const interest = String(row[5] ?? '').trim().toLowerCase();
  const notes = row[6] ?? '';
  const budgetNumber = Number(budgetRaw.replace(/[^0-9.]/g, ''));

  let budgetScore = Number(config.weightBudgetDefault ?? 0);
  if (budgetNumber >= 5000 || budgetRaw.includes('high')) budgetScore = Number(config.weightBudgetHigh ?? 0);
  else if (budgetNumber >= 2000 || budgetRaw.includes('medium')) budgetScore = Number(config.weightBudgetMedium ?? 0);
  else if (budgetNumber > 0 || budgetRaw.includes('low')) budgetScore = Number(config.weightBudgetLow ?? 0);

  let sourceScore = Number(config.weightSourceOther ?? 0);
  if (source.includes('referral')) sourceScore = Number(config.weightSourceReferral ?? 0);
  else if (source.includes('linkedin')) sourceScore = Number(config.weightSourceLinkedin ?? 0);
  else if (source.includes('website')) sourceScore = Number(config.weightSourceWebsite ?? 0);

  let interestScore = Number(config.weightInterestDefault ?? 0);
  if (interest.includes('automation')) interestScore = Number(config.weightInterestAutomation ?? 0);
  else if (interest.includes('ai')) interestScore = Number(config.weightInterestAi ?? 0);
  else if (interest.includes('consult')) interestScore = Number(config.weightInterestConsulting ?? 0);

  const score = budgetScore + sourceScore + interestScore;
  let tier = 'cold';
  if (score >= 70) tier = 'hot';
  else if (score >= 40) tier = 'warm';

  return [name, email, company, row[3] ?? '', row[4] ?? '', row[5] ?? '', notes, String(score), tier];
});

return {
  json: {
    spreadsheetId: config.spreadsheetId,
    writeRange: config.writeRange,
    access_token: accessToken,
    values: scoredRows,
  },
};`,
    },
  },
  output: [{
    spreadsheetId: '1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A',
    writeRange: 'Leads!A2:I',
    access_token: 'token',
    values: [['Ava', 'ava@example.com', 'Acme', 'Referral', '5000', 'Automation', 'Note', '85', 'hot']],
  }],
});

const writeScoredRows = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write Scored Rows',
    position: [1760, 304],
    parameters: {
      method: 'PUT',
      url: "=https://sheets.googleapis.com/v4/spreadsheets/{{ $('Score Lead Rows').item.json.spreadsheetId }}/values/{{ encodeURIComponent($('Score Lead Rows').item.json.writeRange) }}",
      sendQuery: true,
      queryParameters: {
        parameters: [{ name: 'valueInputOption', value: 'USER_ENTERED' }],
      },
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: "=Bearer {{ $('Score Lead Rows').item.json.access_token }}" },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "= {{ ({ values: $('Score Lead Rows').item.json.values }) }}",
      options: {
        response: {
          response: {
            responseFormat: 'json',
          },
        },
      },
    },
  },
  output: [{ updatedRange: 'Leads!A2:I6' }],
});

export default workflow('lead-scoring-via-sheets-api-portfolio', 'Lead Scoring via Sheets API Portfolio')
  .add(start)
  .to(workflowConfig)
  .to(buildJwtAssertion)
  .to(exchangeAccessToken)
  .to(readLeadRows)
  .to(scoreLeadRows)
  .to(writeScoredRows);
