import fs from "node:fs/promises";
import path from "node:path";

const INDEX_PATH = path.resolve("data", "n8n-templates", "importable-by-type", "index.jsonl");
const SOURCE_ROOT = path.resolve("data", "n8n-templates", "importable-by-type");
const OUTPUT_ROOT = path.resolve("data", "n8n-templates", "reference-packs");

const PACKS = [
  {
    slug: "ai-agents",
    description: "Agent-style workflows using AI Agent, chat models, tools, memory, or agent patterns.",
    match(entry) {
      return (
        entry.primaryType === "ai-relevant" &&
        /(agent|chatbot|assistant|copilot|workflow mcp server)/i.test(entry.name)
      );
    },
  },
  {
    slug: "rag",
    description: "Retrieval-augmented generation patterns using vector stores, documents, or knowledge-base chat.",
    match(entry) {
      return /(rag|vector|embedding|knowledge base|documents|pdf|retrieval|search your docs)/i.test(entry.name);
    },
  },
  {
    slug: "lead-gen",
    description: "Lead capture, enrichment, qualification, outreach, and CRM workflows.",
    match(entry) {
      return (
        /(lead|outreach|crm|hubspot|pipedrive|salesforce|cold email|prospect|qualification)/i.test(entry.name) ||
        entry.primaryType === "sales"
      );
    },
  },
  {
    slug: "social-content",
    description: "Social media content creation, posting, scheduling, and short-form video workflows.",
    match(entry) {
      return /(social|linkedin|instagram|tiktok|youtube|twitter|x |shorts|reels|content creation|viral videos?)/i.test(
        entry.name,
      );
    },
  },
  {
    slug: "email-agents",
    description: "Email triage, summaries, labels, replies, and inbox automation workflows.",
    match(entry) {
      return /(gmail|email|inbox|mailbox|newsletter|mail)/i.test(entry.name);
    },
  },
];

async function ensureCleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function readIndex() {
  const raw = await fs.readFile(INDEX_PATH, "utf8");
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function copyPackFiles(pack, entries) {
  const packDir = path.join(OUTPUT_ROOT, pack.slug);
  const workflowsDir = path.join(packDir, "workflows");
  const manifestPath = path.join(packDir, "manifest.json");
  const indexPath = path.join(packDir, "index.jsonl");

  await fs.mkdir(workflowsDir, { recursive: true });

  for (const entry of entries) {
    const src = path.join(SOURCE_ROOT, entry.file);
    const dest = path.join(workflowsDir, path.basename(entry.file));
    await fs.copyFile(src, dest);
  }

  await fs.writeFile(indexPath, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        slug: pack.slug,
        description: pack.description,
        count: entries.length,
        topWorkflows: entries.slice(0, 30).map((entry) => ({
          id: entry.id,
          name: entry.name,
          creator: entry.creator,
          totalViews: entry.totalViews,
          recentViews: entry.recentViews,
          nodeCount: entry.nodeCount,
          file: `workflows/${path.basename(entry.file)}`,
        })),
      },
      null,
      2,
    )}\n`,
  );
}

async function main() {
  const entries = await readIndex();
  await ensureCleanDir(OUTPUT_ROOT);

  const summary = [];

  for (const pack of PACKS) {
    const matched = entries
      .filter((entry) => pack.match(entry))
      .sort((a, b) => (b.totalViews - a.totalViews) || (b.recentViews - a.recentViews));

    await copyPackFiles(pack, matched);

    summary.push({
      slug: pack.slug,
      description: pack.description,
      count: matched.length,
      folder: `reference-packs/${pack.slug}`,
    });

    console.log(`Built ${pack.slug}: ${matched.length}`);
  }

  await fs.writeFile(path.join(OUTPUT_ROOT, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Wrote ${path.join(OUTPUT_ROOT, "summary.json")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
