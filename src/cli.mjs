import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getDoctorReport } from './doctor.mjs';
import { buildInstallPlan, executeInstallPlan } from './install.mjs';
import { createInvestigationTemplate, validateInvestigation } from './validate.mjs';

const VERSION = '0.1.0';

function printHelp() {
  console.log(`rea-agent ${VERSION}

Portable, evidence-first reverse engineering agent workflows.

Usage:
  rea-agent doctor [--json]
  rea-agent install [--target all|claude|codex|dsh|workbuddy]
                    [--scope project|user] [--root <directory>] [--apply]
  rea-agent init [report.json]
  rea-agent validate <report.json> [--require-authorized]
  rea-agent --version

Commands:
  doctor       Check local Node.js, npm, and official REA CLI readiness.
  install      Preview or install agent skills and host adapters.
  init         Create a pending investigation record without running analysis.
  validate     Validate evidence, authorization, limitations, and unknowns.

Install is a dry run unless --apply is present. Existing paths are never
overwritten. Use --root to stage an installation under a custom directory.
`);
}

function parseArguments(args) {
  const flags = new Set();
  const values = {};
  const positional = [];
  const booleanFlags = new Set(['apply', 'json', 'require-authorized']);
  const valueFlags = new Set(['target', 'scope', 'root']);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (booleanFlags.has(name)) {
      flags.add(name);
    } else if (valueFlags.has(name)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`--${name} requires a value`);
      values[name] = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: --${name}`);
    }
  }
  return { flags, values, positional };
}

async function runInstall(options) {
  const plan = buildInstallPlan({
    target: options.values.target,
    scope: options.values.scope,
    root: options.values.root
  });
  console.log(`${options.flags.has('apply') ? 'Install plan' : 'Dry run'} (${plan.scope}, ${plan.target})`);
  for (const operation of plan.operations) {
    console.log(`${operation.kind === 'directory' ? 'copy directory' : 'copy file'}: ${operation.destination}`);
  }
  if (!options.flags.has('apply')) {
    console.log('No files were changed. Re-run with --apply to install.');
    return 0;
  }
  const installed = await executeInstallPlan(plan);
  console.log(`Installed ${installed.length} item(s). Restart the selected agent host.`);
  console.log('Run npx rea-agents setup separately to configure the official REA MCP server.');
  return 0;
}

async function runInit(options) {
  const destination = resolve(options.positional[0] ?? 'rea-investigation.json');
  const content = `${JSON.stringify(createInvestigationTemplate(), null, 2)}\n`;
  try {
    await writeFile(destination, content, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Parent directory does not exist: ${resolve(destination, '..')}`);
    }
    if (error.code === 'EEXIST') throw new Error(`Refusing to overwrite: ${destination}`);
    throw error;
  }
  console.log(`Created pending investigation record: ${destination}`);
  console.log('No analysis was run. Complete authorization before using REA tools.');
  return 0;
}

async function runValidate(options) {
  if (!options.positional[0]) throw new Error('validate requires a report.json path');
  const source = resolve(options.positional[0]);
  let record;
  try {
    record = JSON.parse(await readFile(source, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read valid JSON from ${source}: ${error.message}`);
  }
  const result = validateInvestigation(record, {
    requireAuthorized: options.flags.has('require-authorized')
  });
  if (!result.valid) {
    console.error(`Invalid investigation record: ${source}`);
    for (const error of result.errors) console.error(`- ${error}`);
    return 1;
  }
  console.log(`Valid investigation record: ${source}`);
  return 0;
}

export async function main(args = []) {
  const command = args[0];
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return 0;
  }
  if (command === '--version' || command === 'version') {
    console.log(VERSION);
    return 0;
  }

  try {
    const options = parseArguments(args.slice(1));
    if (command === 'doctor') {
      const report = getDoctorReport();
      if (options.flags.has('json')) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(`Node.js: ${report.checks.node.version}`);
        console.log(`rea-agent runtime supported: ${report.checks.node.agentSupported}`);
        console.log(`Current REA runtime supported: ${report.checks.node.reaSupported}`);
        console.log(`npm available: ${report.checks.npm.installed}`);
        console.log(`REA CLI available: ${report.checks.reaCli.installed}`);
        for (const recommendation of report.recommendations) console.log(`Recommendation: ${recommendation}`);
      }
      return report.ready ? 0 : 2;
    }
    if (command === 'install') return await runInstall(options);
    if (command === 'init') return await runInit(options);
    if (command === 'validate') return await runValidate(options);
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}
