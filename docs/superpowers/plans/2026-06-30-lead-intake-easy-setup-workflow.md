# Lead Intake Easy Setup Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the lead intake scoring portfolio workflow around native Google Sheets nodes so setup feels like a normal `Connect with Google` flow.

**Architecture:** Reuse the existing Google Sheets-based workflow `pCeEpAo1ozqgUl1I` as the foundation, keep the scoring logic in simple workflow nodes, and remove the JWT/API path from the public-facing setup. Add plain-English sticky-note guidance so the canvas itself teaches a first-time user how to connect Google and run the workflow.

**Tech Stack:** n8n local MCP, Google Sheets Trigger node, Google Sheets update node, Set node, Code node, sticky notes, PowerShell

---

### Task 1: Document The Existing Workflow Baseline

**Files:**
- Modify: `C:\Users\Vidad\Documents\n8n-portfolio\docs\superpowers\plans\2026-06-30-lead-intake-easy-setup-workflow.md`
- Verify: existing n8n workflow `pCeEpAo1ozqgUl1I`

- [ ] **Step 1: Confirm the current Google Sheets workflow details**

Run:

```powershell
@'
import os, json, requests, subprocess
url = 'http://localhost:5678/mcp-server/http'
ps = subprocess.run(['powershell','-NoProfile','-Command',"[Environment]::GetEnvironmentVariable('N8N_MCP_TOKEN','User')"], capture_output=True, text=True)
token = ps.stdout.strip()
payload = {'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'get_workflow_details','arguments':{'workflowId':'pCeEpAo1ozqgUl1I'}}}
resp = requests.post(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}, json=payload, stream=True, timeout=60)
for line in resp.iter_lines(decode_unicode=True):
    if line and line.startswith('data: '):
        print(line)
        break
resp.close()
'@ | python -
```

Expected: workflow JSON describing `Lead Intake Scoring Portfolio` with Google Sheets nodes, Set node, and Code node.

- [ ] **Step 2: Confirm the JWT/API workflow remains separate**

Run:

```powershell
@'
import os, json, requests, subprocess
url = 'http://localhost:5678/mcp-server/http'
ps = subprocess.run(['powershell','-NoProfile','-Command',"[Environment]::GetEnvironmentVariable('N8N_MCP_TOKEN','User')"], capture_output=True, text=True)
token = ps.stdout.strip()
payload = {'jsonrpc':'2.0','id':2,'method':'tools/call','params':{'name':'search_workflows','arguments':{'query':'Lead', 'limit':20}}}
resp = requests.post(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}, json=payload, stream=True, timeout=60)
for line in resp.iter_lines(decode_unicode=True):
    if line and line.startswith('data: '):
        print(line)
        break
resp.close()
'@ | python -
```

Expected: both the Google Sheets workflow and the JWT/API workflow appear, confirming the easy-setup work should target the Google Sheets workflow.

### Task 2: Rebuild The Workflow As The Easy-Setup Variant

**Files:**
- Modify: n8n workflow `pCeEpAo1ozqgUl1I`
- Verify: `C:\Users\Vidad\Documents\n8n-portfolio\docs\superpowers\specs\2026-06-30-lead-intake-easy-setup-design.md`

- [ ] **Step 1: Keep the scoring logic shape and rename the workflow**

Target workflow shape:

```text
Manual Trigger
Google Sheets Trigger (optional/live path)
Scoring Weights
Calculate Lead Score
Prepare Sheet Update
Update Lead Row
```

Expected changes:
- rename workflow to `Lead Intake Scoring (Easy Setup)`
- keep the existing scoring weights and code logic
- keep the target Google Sheet `1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A`

- [ ] **Step 2: Add a Manual Trigger branch for first-run demo use**

Implementation intent:

```text
Manual Trigger -> sample or selected row path -> scoring -> update
Google Sheets Trigger -> scoring -> update
```

Expected: a first-time user can run the workflow manually before enabling the live trigger.

- [ ] **Step 3: Keep the Google Sheets Trigger but treat it as optional**

Node settings to preserve or clarify:

```text
event: rowAdded
polling: every minute
headerRow: 1
firstDataRow: 2
sheet: Leads
```

Expected: the workflow still demonstrates real automation, but the user is not forced to start there.

### Task 3: Make The Setup Non-Technical On The Canvas

**Files:**
- Modify: n8n workflow `pCeEpAo1ozqgUl1I`

- [ ] **Step 1: Add a `Start Here` sticky note**

Sticky note content:

```text
Start Here

1. Open the Google Sheets nodes
2. Click Connect with Google
3. Sign in with your Google account
4. Select the spreadsheet and Leads tab
5. Run the workflow once with Manual Trigger
```

Expected: a first-time user can understand setup from the canvas without outside explanation.

- [ ] **Step 2: Add a `What This Workflow Does` sticky note**

Sticky note content:

```text
What This Workflow Does

Reads lead information from Google Sheets,
applies simple weighted scoring,
assigns hot / warm / cold,
and writes score and tier back to the sheet.
```

Expected: the portfolio story is visible on the canvas.

- [ ] **Step 3: Add an `Optional: Turn On Live Trigger` sticky note**

Sticky note content:

```text
Optional: Turn On Live Trigger

After Google is connected and manual testing works,
enable the Google Sheets Trigger
to score new rows automatically.
```

Expected: the upgrade path to real automation is obvious but low-pressure.

### Task 4: Improve Credential Friendliness

**Files:**
- Modify: n8n workflow `pCeEpAo1ozqgUl1I`

- [ ] **Step 1: Ensure Google Sheets nodes point at OAuth-based Google credential flow**

Expected node behavior:

```text
User opens node
User sees normal Google credential picker
User clicks Connect with Google
```

Expected: no JWT, service-account, PEM, or bearer-token concepts appear in the main setup path.

- [ ] **Step 2: Keep sheet selection prefilled where possible**

Prefill targets:

```text
Spreadsheet: Portfolio Lead Intake Data
Spreadsheet ID: 1LK_cqSMbgxwvclU7TgPCa-nJ6xqKKdQPDD3N90hdI9A
Sheet: Leads
```

Expected: after connecting Google, a user has little or nothing else to configure.

### Task 5: Update Workflow Description

**Files:**
- Modify: n8n workflow `pCeEpAo1ozqgUl1I`

- [ ] **Step 1: Replace the technical description with a setup-friendly version**

Use this description text:

```text
Connect Google Sheets, run once with the Manual Trigger, and this workflow will score leads and write hot, warm, or cold back to the Leads sheet. After setup, you can enable the Google Sheets trigger for live automation.
```

Expected: the workflow description matches the non-technical setup goal.

### Task 6: Verify The Rebuilt Workflow

**Files:**
- Verify: n8n workflow `pCeEpAo1ozqgUl1I`

- [ ] **Step 1: Inspect the updated workflow details**

Run:

```powershell
@'
import os, json, requests, subprocess
url = 'http://localhost:5678/mcp-server/http'
ps = subprocess.run(['powershell','-NoProfile','-Command',"[Environment]::GetEnvironmentVariable('N8N_MCP_TOKEN','User')"], capture_output=True, text=True)
token = ps.stdout.strip()
payload = {'jsonrpc':'2.0','id':3,'method':'tools/call','params':{'name':'get_workflow_details','arguments':{'workflowId':'pCeEpAo1ozqgUl1I'}}}
resp = requests.post(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}, json=payload, stream=True, timeout=60)
for line in resp.iter_lines(decode_unicode=True):
    if line and line.startswith('data: '):
        print(line)
        break
resp.close()
'@ | python -
```

Expected: updated workflow name, description, and node graph.

- [ ] **Step 2: Verify manual execution is still available**

Run:

```powershell
@'
import os, json, requests, subprocess
url = 'http://localhost:5678/mcp-server/http'
ps = subprocess.run(['powershell','-NoProfile','-Command',"[Environment]::GetEnvironmentVariable('N8N_MCP_TOKEN','User')"], capture_output=True, text=True)
token = ps.stdout.strip()
payload = {'jsonrpc':'2.0','id':4,'method':'tools/call','params':{'name':'execute_workflow','arguments':{'workflowId':'pCeEpAo1ozqgUl1I','executionMode':'manual'}}}
resp = requests.post(url, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}, json=payload, stream=True, timeout=60)
for line in resp.iter_lines(decode_unicode=True):
    if line and line.startswith('data: '):
        print(line)
        break
resp.close()
'@ | python -
```

Expected: either a successful manual execution or a clear Google credential prompt from the Sheets node.

- [ ] **Step 3: Confirm local git is unavailable and skip commit steps**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

Expected: `fatal: not a git repository ...`

This workspace is not a git repo, so do not add commit steps during execution.
