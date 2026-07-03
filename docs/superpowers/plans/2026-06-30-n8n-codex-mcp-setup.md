# n8n Codex MCP Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register the user's local n8n built-in MCP server in Codex using a bearer token stored outside the workspace, then verify Codex can see and use that MCP entry.

**Architecture:** Store the n8n bearer token in a Windows user environment variable, register the n8n instance-level MCP endpoint in Codex as a streamable HTTP MCP server, and validate the resulting Codex configuration. Keep the setup local-first and make the future `ngrok` migration a URL-only change.

**Tech Stack:** Codex CLI, PowerShell, n8n built-in MCP server, Windows user environment variables, Markdown docs

---

### Task 1: Confirm the reachable local n8n MCP endpoint

**Files:**
- Modify: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/plans/2026-06-30-n8n-codex-mcp-setup.md`

- [ ] **Step 1: Probe the default local n8n base URL**

Run: `Invoke-WebRequest -UseBasicParsing http://localhost:5678`
Expected: HTTP response from the local n8n instance or a clear connection failure.

- [ ] **Step 2: Probe the default MCP endpoint**

Run: `Invoke-WebRequest -UseBasicParsing http://localhost:5678/mcp-server/http`
Expected: HTTP response, auth-related response, or a clear path failure that confirms whether the default endpoint exists.

- [ ] **Step 3: If the default path fails, inspect the error and stop before registration**

Expected: Do not register a broken URL. Use the verified endpoint only.

### Task 2: Store the bearer token outside the workspace

**Files:**
- Modify: Windows user environment variables
- Test: Codex process environment via PowerShell

- [ ] **Step 1: Write the token to a user environment variable**

Run a PowerShell command equivalent to:

```powershell
[Environment]::SetEnvironmentVariable(
  "N8N_MCP_TOKEN",
  "<redacted-token>",
  "User"
)
```

Expected: No error.

- [ ] **Step 2: Verify the environment variable was written**

Run: `[Environment]::GetEnvironmentVariable("N8N_MCP_TOKEN", "User")`
Expected: A non-empty token value is returned.

- [ ] **Step 3: Avoid writing the raw token to any workspace file**

Expected: No `.md`, `.json`, `.toml`, `.env`, or other repo file contains the token.

### Task 3: Register the n8n MCP server in Codex

**Files:**
- Modify: `C:/Users/Vidad/.codex/config.toml` indirectly via Codex CLI

- [ ] **Step 1: Remove any stale `n8n-local` entry if present**

Run: `codex mcp remove n8n-local`
Expected: Either successful removal or a harmless "not found" style result.

- [ ] **Step 2: Add the local n8n MCP registration**

Run:

```powershell
codex mcp add n8n-local `
  --url http://localhost:5678/mcp-server/http `
  --bearer-token-env-var N8N_MCP_TOKEN
```

Expected: Codex records a new MCP server named `n8n-local`.

- [ ] **Step 3: List MCP servers to confirm registration**

Run: `codex mcp list`
Expected: `n8n-local` appears in the output.

### Task 4: Inspect the stored configuration and connection metadata

**Files:**
- Modify: none
- Test: `C:/Users/Vidad/.codex/config.toml`

- [ ] **Step 1: Read the Codex MCP configuration**

Run: `Get-Content C:\Users\Vidad\.codex\config.toml`
Expected: An `mcp_servers` entry for `n8n-local` exists and references the bearer-token environment variable rather than the raw token.

- [ ] **Step 2: Read the detailed MCP entry**

Run: `codex mcp get n8n-local`
Expected: The MCP entry resolves to the correct URL and auth mode.

### Task 5: Verify the setup is clean and usable

**Files:**
- Create: `C:/Users/Vidad/Documents/n8n-portfolio/README.md`

- [ ] **Step 1: Search the workspace for accidental token leakage**

Run a search command that checks for the exact token string within `C:\Users\Vidad\Documents\n8n-portfolio`.
Expected: No matches.

- [ ] **Step 2: Add a short local README for future use**

Create a README with:

```md
# n8n Portfolio

This workspace is configured to use the local `n8n-local` MCP server in Codex.

Default local n8n MCP URL:

- `http://localhost:5678/mcp-server/http`

Later, when exposing n8n through `ngrok`, update the MCP server URL instead of rebuilding the whole setup.
```

- [ ] **Step 3: Tell the user the exact next prompt to try**

Suggested prompt:

```text
Use the n8n-local MCP server to create an n8n workflow that starts with a Manual Trigger, fetches a JSON placeholder todo list over HTTP, transforms the result, and writes a clean summary to a Set node.
```

### Task 6: Note environment-specific gaps

**Files:**
- Modify: `C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/specs/2026-06-30-n8n-codex-mcp-design.md`

- [ ] **Step 1: Record any endpoint mismatch or verification caveat**

If the local n8n endpoint differs from the assumed default or the MCP endpoint is not yet enabled in n8n, append a short note to the spec so future work starts from the real state.

