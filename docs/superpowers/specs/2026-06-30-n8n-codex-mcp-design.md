# n8n Codex MCP Design

**Status:** Approved in conversation, written for review

## Goal

Set up Codex so it can connect directly to the user's local n8n instance through n8n's built-in instance-level MCP server, authenticated with a bearer token, so the user can prompt Codex to create and iterate on n8n workflows and agents.

## Scope

This design covers:

- registering the local n8n MCP server in Codex
- storing the bearer token outside inline config
- verifying the MCP connection from Codex
- adding lightweight workspace guidance for consistent prompting
- preserving a simple upgrade path from local `localhost` access to a future `ngrok` URL

This design does not cover:

- a custom Codex plugin or wrapper layer yet
- team sharing or multi-user auth
- production hardening beyond basic local safety
- building actual user workflows yet

## Recommended Approach

Use n8n's built-in instance-level MCP server directly as a streamable HTTP MCP server in Codex. Register it with Codex using the local n8n MCP URL and a bearer token loaded from an environment variable instead of embedding the token directly into a config file.

This keeps the first version simple and close to n8n's supported flow while leaving room to add a custom prompt layer later.

## Why This Approach

### Pros

- minimal moving parts
- aligned with n8n's supported MCP connection flow
- easy to swap from `localhost` to `ngrok` later by changing only the MCP URL
- avoids building a custom plugin before the base connection is proven
- good enough for the user's immediate goal of prompting Codex to create workflows

### Cons

- prompts may still be somewhat verbose until a wrapper layer is added
- Codex behavior will depend on the raw n8n MCP tool surface and current n8n limitations
- permissions are tied to the connected n8n user or token

## Architecture

### Components

1. **Local n8n instance**
   Hosts the built-in instance-level MCP server and exposes the MCP HTTP endpoint.

2. **Codex MCP registration**
   Codex stores a named MCP server entry pointing at the local n8n MCP URL.

3. **Local secret storage**
   The bearer token is stored in a user environment variable on Windows instead of being written inline in project docs or shell history where avoidable.

4. **Workspace guidance files**
   Small local markdown notes describe preferred prompting style, workflow conventions, and future setup notes.

### Data Flow

1. User prompts Codex to build or modify an n8n workflow.
2. Codex calls n8n MCP tools over HTTP against the local n8n MCP endpoint.
3. n8n validates, creates, updates, or executes workflows according to the connected token's permissions.
4. Codex reports results and iterates with the user.

## Configuration Decisions

### Initial URL

Assume the local n8n instance is reachable at:

- `http://localhost:5678`

Assume the built-in n8n MCP endpoint is:

- `http://localhost:5678/mcp-server/http`

If the user's n8n exposes a different MCP path, only the registered MCP URL needs to change.

### Authentication

Use a bearer token the user already provided. Store it in a Windows user environment variable, for example:

- `N8N_MCP_TOKEN`

Codex should reference that environment variable in the MCP registration rather than storing the raw token inline in the registration command history or docs.

### Naming

Register the MCP server in Codex as:

- `n8n-local`

This keeps the naming clear now and leaves room for a future `n8n-ngrok` or production entry.

## Safety and Security

- treat the provided bearer token as sensitive
- do not commit the token into the workspace
- prefer user-level environment storage over project files for the token
- keep the first setup local-only
- when moving to `ngrok`, re-check exposure, auth scope, and whether the token should be rotated

## Limitations

This setup inherits the current limitations of n8n's built-in MCP server, including:

- credential secrets are not returned through MCP
- HTTP Request credential auto-assignment is limited
- some workflow execution patterns and long-running interactions are constrained by n8n MCP behavior
- Codex can only do what the connected n8n token is allowed to do

## Verification Plan

The implementation should verify:

1. Codex can list the registered MCP server.
2. Codex reports the n8n MCP server as enabled.
3. A simple prompt can cause Codex to inspect available n8n tools or workflows through MCP.
4. No workspace file contains the raw bearer token after setup.

## Future Iteration Path

After the direct connection is working, a later phase can add:

- a custom Codex plugin or prompt wrapper
- reusable prompt templates for common workflow categories
- a project memory file with preferred node choices and coding style
- a second MCP registration for an `ngrok` tunnel endpoint

## Implementation Outcome

When complete, the user should be able to open Codex in this workspace and prompt for n8n workflows using the built-in n8n MCP connection without manually copying workflow JSON around.

## Current Environment Note

On June 30, 2026, the local n8n base URL at `http://localhost:5678` responded successfully, but the assumed MCP endpoint at `http://localhost:5678/mcp-server/http` returned `404` during verification. This means the Codex-side MCP registration can be created now, but the n8n-side MCP feature still needs to be enabled or its actual MCP URL needs to be copied from n8n's MCP settings before live tool use will work.
