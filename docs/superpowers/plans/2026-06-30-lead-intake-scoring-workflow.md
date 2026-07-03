# Lead Intake Scoring Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an n8n workflow that reads lead rows from Google Sheets, calculates a weighted lead score from configurable in-workflow weights, assigns a tier, and writes `score` and `tier` back to the same row.

**Architecture:** The workflow will use a Google Sheets trigger for intake, a self-contained transformation/scoring section for transparent weighted scoring, and a Google Sheets update step to write outputs back to the originating row. The scoring weights will live inside the workflow so the portfolio demo stays easy to explain and tune.

**Tech Stack:** n8n, Google Sheets nodes, Set/Edit Fields node, Code node, conditional logic

---

### Task 1: Discover the exact n8n node surface

**Files:**
- Create: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/specs/2026-06-30-lead-intake-scoring-workflow-design.md`
- Create: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/plans/2026-06-30-lead-intake-scoring-workflow.md`

- [ ] **Step 1: Search for the Google Sheets trigger and update nodes**

Run: use the `n8n-local` MCP `search_nodes` tool with queries for `google sheets trigger`, `google sheets update row`, `set`, and `code`.
Expected: node IDs and versions for the trigger, update action, and helper nodes.

- [ ] **Step 2: Fetch exact type definitions**

Run: use the `n8n-local` MCP `get_node_types` tool for the chosen node IDs and discriminators.
Expected: exact parameter names for the trigger, row update, Set, and Code nodes.

- [ ] **Step 3: Confirm the workflow shape against the spec**

Check that the chosen nodes support:
- reading a lead row
- carrying row identity forward
- computing weighted scores
- writing `score` and `tier` back to the same row

Expected: a node set that can implement the approved spec without introducing extra scope.

### Task 2: Write and validate the workflow code

**Files:**
- Create: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/specs/2026-06-30-lead-intake-scoring-workflow-design.md`
- Create: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/plans/2026-06-30-lead-intake-scoring-workflow.md`

- [ ] **Step 1: Write the workflow SDK code**

The workflow should include:
- Google Sheets trigger
- lead normalization step
- scoring config step
- weighted scoring step
- tier assignment step
- Google Sheets row update step

Expected behavior:
- input fields: `name`, `email`, `company`, `source`, `budget`, `interest`, `notes`
- output fields: `score`, `tier`
- transparent weights defined in-workflow

- [ ] **Step 2: Validate the workflow before creation**

Run: use the `n8n-local` MCP `validate_workflow` tool with the full SDK code.
Expected: `valid: true`

- [ ] **Step 3: Fix any schema mismatches**

If validation fails, update the workflow code to match the exact node parameter schema and re-run validation.
Expected: a clean validation result before saving anything to n8n.

### Task 3: Create and verify the workflow in n8n

**Files:**
- Create: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/specs/2026-06-30-lead-intake-scoring-workflow-design.md`
- Create: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/plans/2026-06-30-lead-intake-scoring-workflow.md`

- [ ] **Step 1: Create the workflow**

Run: use the `n8n-local` MCP `create_workflow_from_code` tool with the validated SDK code and a portfolio-friendly name and description.
Expected: workflow ID and n8n URL.

- [ ] **Step 2: Verify creation details**

Run: inspect the MCP creation result for workflow name, node count, and any credential auto-assignment note.
Expected: the workflow exists and any missing Google Sheets credential setup is clearly reported.

- [ ] **Step 3: Summarize what still needs manual setup**

Document any environment-specific requirements still needed in n8n, such as selecting a spreadsheet, sheet tab, or Google credential.
Expected: the user knows exactly what to click next if credentials or sheet IDs are not fully configured.
