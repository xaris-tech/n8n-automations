import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const manualStart = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'Manual Demo Trigger',
    position: [220, 180],
  },
  output: [{}],
});

const liveTrigger = trigger({
  type: 'n8n-nodes-base.googleSheetsTrigger',
  version: 1,
  credentials: {
    googleSheetsTriggerOAuth2Api: newCredential('rajienomoto'),
  },
  config: {
    name: 'Live Lead Trigger',
    position: [220, 420],
    parameters: {
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A',
        cachedResultName: 'Portfolio Lead Intake Data',
      },
      sheetName: {
        __rl: true,
        mode: 'id',
        value: '334893456',
        cachedResultName: 'Leads',
      },
      event: 'rowAdded',
      pollTimes: {
        item: [{ mode: 'everyMinute' }],
      },
      options: {
        dataLocationOnSheet: {
          values: {
            rangeDefinition: 'specifyRange',
            headerRow: 1,
            firstDataRow: 2,
          },
        },
      },
    },
  },
  output: [
    {
      name: 'Ava Cruz',
      email: 'ava@example.com',
      company: 'Acme Ops',
      source: 'Referral',
      budget: '5000',
      interest: 'Automation',
      notes: 'Wants proposal this week',
    },
  ],
});

const readLeadsForDemo = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  credentials: {
    googleSheetsOAuth2Api: newCredential('rajienomoto'),
  },
  config: {
    name: 'Read Leads For Demo',
    position: [480, 180],
    parameters: {
      resource: 'sheet',
      operation: 'read',
      authentication: 'oAuth2',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A',
        cachedResultName: 'Portfolio Lead Intake Data',
      },
      sheetName: {
        __rl: true,
        mode: 'name',
        value: 'Leads',
        cachedResultName: 'Leads',
      },
      options: {
        dataLocationOnSheet: {
          values: {
            rangeDefinition: 'specifyRange',
            headerRow: 1,
            firstDataRow: 2,
          },
        },
        returnAllMatches: 'returnAllMatches',
      },
    },
  },
  output: [
    {
      name: 'Ava Cruz',
      email: 'ava@example.com',
      company: 'Acme Ops',
      source: 'Referral',
      budget: '5000',
      interest: 'Automation',
      notes: 'Wants proposal this week',
    },
  ],
});

const scoringWeights = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Scoring Weights',
    position: [760, 300],
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
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
    },
  },
  output: [
    {
      name: 'Ava Cruz',
      email: 'ava@example.com',
      company: 'Acme Ops',
      source: 'Referral',
      budget: '5000',
      interest: 'Automation',
      notes: 'Wants proposal this week',
      weightBudgetHigh: 40,
      weightBudgetMedium: 25,
      weightBudgetLow: 10,
      weightBudgetDefault: 5,
      weightSourceReferral: 25,
      weightSourceLinkedin: 15,
      weightSourceWebsite: 10,
      weightSourceOther: 5,
      weightInterestAutomation: 20,
      weightInterestAi: 20,
      weightInterestConsulting: 10,
      weightInterestDefault: 5,
    },
  ],
});

const calculateLeadScore = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Calculate Lead Score',
    position: [1040, 300],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const source = String($json.source ?? '').trim().toLowerCase();
const interest = String($json.interest ?? '').trim().toLowerCase();
const budgetRaw = String($json.budget ?? '').trim().toLowerCase();
const budgetNumber = Number(budgetRaw.replace(/[^0-9.]/g, ''));

let budgetScore = Number($json.weightBudgetDefault ?? 0);
if (budgetNumber >= 5000 || budgetRaw.includes('high')) {
  budgetScore = Number($json.weightBudgetHigh ?? 0);
} else if (budgetNumber >= 2000 || budgetRaw.includes('medium')) {
  budgetScore = Number($json.weightBudgetMedium ?? 0);
} else if (budgetNumber > 0 || budgetRaw.includes('low')) {
  budgetScore = Number($json.weightBudgetLow ?? 0);
}

let sourceScore = Number($json.weightSourceOther ?? 0);
if (source.includes('referral')) {
  sourceScore = Number($json.weightSourceReferral ?? 0);
} else if (source.includes('linkedin')) {
  sourceScore = Number($json.weightSourceLinkedin ?? 0);
} else if (source.includes('website')) {
  sourceScore = Number($json.weightSourceWebsite ?? 0);
}

let interestScore = Number($json.weightInterestDefault ?? 0);
if (interest.includes('automation')) {
  interestScore = Number($json.weightInterestAutomation ?? 0);
} else if (interest.includes('ai')) {
  interestScore = Number($json.weightInterestAi ?? 0);
} else if (interest.includes('consult')) {
  interestScore = Number($json.weightInterestConsulting ?? 0);
}

const score = budgetScore + sourceScore + interestScore;
let tier = 'cold';
if (score >= 70) {
  tier = 'hot';
} else if (score >= 40) {
  tier = 'warm';
}

return { json: { ...$json, score, tier } };`,
    },
  },
  output: [
    {
      name: 'Ava Cruz',
      email: 'ava@example.com',
      company: 'Acme Ops',
      source: 'Referral',
      budget: '5000',
      interest: 'Automation',
      notes: 'Wants proposal this week',
      score: 85,
      tier: 'hot',
    },
  ],
});

const prepareSheetUpdate = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Prepare Sheet Update',
    position: [1320, 300],
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      include: 'selected',
      includeFields: 'name,email,company,source,budget,interest,notes,score,tier',
    },
  },
  output: [
    {
      name: 'Ava Cruz',
      email: 'ava@example.com',
      company: 'Acme Ops',
      source: 'Referral',
      budget: '5000',
      interest: 'Automation',
      notes: 'Wants proposal this week',
      score: 85,
      tier: 'hot',
    },
  ],
});

const updateLeadRow = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  credentials: {
    googleSheetsOAuth2Api: newCredential('rajienomoto'),
  },
  config: {
    name: 'Update Lead Row',
    position: [1600, 300],
    parameters: {
      resource: 'sheet',
      operation: 'update',
      authentication: 'oAuth2',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A',
        cachedResultName: 'Portfolio Lead Intake Data',
      },
      sheetName: {
        __rl: true,
        mode: 'name',
        value: 'Leads',
        cachedResultName: 'Leads',
      },
      options: {
        cellFormat: 'USER_ENTERED',
        locationDefine: {
          values: {
            headerRow: 1,
            firstDataRow: 2,
          },
        },
      },
    },
  },
  output: [{ success: true }],
});

const startHere = sticky(
  `# Start Here

1. Open the Google Sheets nodes
2. Click Connect with Google
3. Sign in with your Google account
4. Select the spreadsheet and Leads tab
5. Run the workflow once with Manual Demo Trigger`,
  [manualStart, readLeadsForDemo, liveTrigger],
  { color: 7 },
);

const whatThisDoes = sticky(
  `# What This Workflow Does

Reads lead information from Google Sheets,
applies simple weighted scoring,
assigns hot / warm / cold,
and writes score and tier back to the sheet.`,
  [scoringWeights, calculateLeadScore, prepareSheetUpdate, updateLeadRow],
  { color: 4 },
);

const optionalLiveTrigger = sticky(
  `# Optional: Turn On Live Trigger

After Google is connected and manual testing works,
enable the Live Lead Trigger
to score new rows automatically.`,
  [liveTrigger],
  { color: 5 },
);

export default workflow('lead-intake-easy-setup', 'Lead Intake Scoring (Easy Setup)')
  .add(startHere)
  .add(whatThisDoes)
  .add(optionalLiveTrigger)
  .add(manualStart)
  .to(readLeadsForDemo)
  .to(scoringWeights)
  .to(calculateLeadScore)
  .to(prepareSheetUpdate)
  .to(updateLeadRow)
  .add(liveTrigger)
  .to(scoringWeights);
