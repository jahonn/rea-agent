import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/rea-agent.mjs', import.meta.url));
const validExample = fileURLToPath(new URL('../examples/investigation.valid.json', import.meta.url));

function run(args) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

test('CLI prints version and validates the authorized example', () => {
  const version = run(['--version']);
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), '0.1.0');
  const validation = run(['validate', validExample, '--require-authorized']);
  assert.equal(validation.status, 0, validation.stderr);
});

test('CLI install is a dry run by default', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'rea-agent-cli-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const result = run(['install', '--target', 'claude', '--root', root]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Dry run/);
  assert.match(result.stdout, /No files were changed/);
  await assert.rejects(readFile(join(root, '.claude', 'agents', 'rea-agent.md')), /ENOENT/);
});

test('CLI init creates a pending record and strict validation rejects it', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'rea-agent-init-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const report = join(root, 'investigation.json');
  const initialized = run(['init', report]);
  assert.equal(initialized.status, 0, initialized.stderr);
  const record = JSON.parse(await readFile(report, 'utf8'));
  record.target = { name: 'Owned fixture', type: 'dotnet', locator: '/tmp/fixture.dll' };
  await writeFile(report, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  assert.equal(run(['validate', report]).status, 0);
  assert.equal(run(['validate', report, '--require-authorized']).status, 1);
});
