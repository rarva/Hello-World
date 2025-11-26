#!/usr/bin/env node
/*
 * Fetch SendGrid templates and populate `EMAILS/server/template_map.js` mapping.
 *
 * Usage (PowerShell):
 *  $env:SENDGRID_API_KEY = '<your key>' ; node .\EMAILS\server\populate_template_map.js
 *
 * Or to auto-map template names to aliases (lowercased, spaces->underscores):
 *  $env:SENDGRID_API_KEY = '<your key>' ; node .\EMAILS\server\populate_template_map.js --auto
 */

import fs from 'fs';
import readline from 'readline';

const SENDGRID_API = 'https://api.sendgrid.com/v3/templates';
const TEMPLATE_MAP_PATH = new URL('./template_map.js', import.meta.url).pathname;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (ans) => { rl.close(); res(ans); }));
}

async function fetchTemplates(apiKey) {
  const res = await fetch(SENDGRID_API, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error(`SendGrid API error ${res.status}`);
  const body = await res.json();
  return body?.templates || [];
}

function normalizeAlias(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function renderMappingObject(mapping) {
  // Pretty-print mapping object as JS literal
  const entries = Object.entries(mapping).map(([k, v]) => {
    if (typeof v === 'string') return `  "${k}": "${v}"`;
    // v can be an object with env keys
    const envEntries = Object.entries(v).map(([ek, ev]) => `      "${ek}": "${ev}"`).join(',\n');
    return `  "${k}": {\n${envEntries}\n  }`;
  });
  return `const mapping = {\n${entries.join(',\n')}\n};`;
}

async function main() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('ERROR: set SENDGRID_API_KEY environment variable and re-run.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const auto = args.includes('--auto');

  console.log('Fetching templates from SendGrid...');
  let templates;
  try {
    templates = await fetchTemplates(apiKey);
  } catch (err) {
    console.error('Failed fetching templates:', err.message || err);
    process.exit(1);
  }

  if (!templates.length) {
    console.log('No templates found in SendGrid account.');
    process.exit(0);
  }

  const mapping = {};

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    const id = t.id;
    const name = t.name || `template_${i}`;
    console.log(`\n[${i}] ${name}`);
    console.log(`    id: ${id}`);
    if (auto) {
      const alias = normalizeAlias(name);
      mapping[alias] = id;
      console.log(`    auto-mapped -> alias: ${alias}`);
      continue;
    }
    const ans = await ask('    Enter alias to map this template (blank to skip): ');
    if (!ans) {
      console.log('    skipped');
      continue;
    }
    // allow env-specific mapping using syntax alias:prod=ID,preview=ID (not implemented); keep simple
    mapping[ans] = id;
    console.log(`    mapped alias '${ans}' -> ${id}`);
  }

  if (!Object.keys(mapping).length) {
    console.log('No mappings created. Exiting.');
    process.exit(0);
  }

  // Read existing template_map.js and replace the mapping block
  let original;
  try {
    original = fs.readFileSync(TEMPLATE_MAP_PATH, 'utf8');
  } catch (err) {
    console.error('Failed to read template_map.js:', err.message || err);
    process.exit(1);
  }

  // Create a backup
  try { fs.writeFileSync(TEMPLATE_MAP_PATH + '.bak', original, 'utf8'); } catch (e) {}

  // Build new mapping literal: keep env-specific structure minimal (string IDs)
  const newMappingLiteral = renderMappingObject(mapping);

  const replaced = original.replace(/const mapping = \{[\s\S]*?\};/, newMappingLiteral);
  if (replaced === original) {
    console.error('Failed to replace mapping in template_map.js — pattern not found.');
    process.exit(1);
  }

  try {
    fs.writeFileSync(TEMPLATE_MAP_PATH, replaced, 'utf8');
    console.log(`\nUpdated ${TEMPLATE_MAP_PATH} (backup at ${TEMPLATE_MAP_PATH}.bak)`);
  } catch (err) {
    console.error('Failed writing template_map.js:', err.message || err);
    process.exit(1);
  }

  console.log('\nMapping population complete. Review the file and commit changes.');
}

main().catch((e) => { console.error(e); process.exit(1); });
