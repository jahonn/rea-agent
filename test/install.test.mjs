import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildInstallPlan, executeInstallPlan } from '../src/install.mjs';

async function temporaryRoot(t) {
  const root = await mkdtemp(join(tmpdir(), 'rea-agent-install-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

test('all-target plan deduplicates the shared Codex and dsh skill', async (t) => {
  const root = await temporaryRoot(t);
  const plan = buildInstallPlan({ target: 'all', scope: 'project', root });
  assert.equal(plan.operations.length, 4);
  assert.equal(plan.operations.filter((item) => item.destination.includes('.agents')).length, 1);
  await assert.rejects(access(join(root, '.claude')), /ENOENT/);
});

test('apply installs the skill and Claude subagent', async (t) => {
  const root = await temporaryRoot(t);
  const plan = buildInstallPlan({ target: 'claude', scope: 'project', root });
  const installed = await executeInstallPlan(plan);
  assert.equal(installed.length, 2);
  const skill = await readFile(join(root, '.claude', 'skills', 'rea-agent', 'SKILL.md'), 'utf8');
  const agent = await readFile(join(root, '.claude', 'agents', 'rea-agent.md'), 'utf8');
  assert.match(skill, /name: rea-agent/);
  assert.match(agent, /skills:/);
});

test('installation refuses to overwrite existing content', async (t) => {
  const root = await temporaryRoot(t);
  const plan = buildInstallPlan({ target: 'codex', scope: 'project', root });
  await executeInstallPlan(plan);
  const marker = join(root, '.agents', 'skills', 'rea-agent', 'marker.txt');
  await writeFile(marker, 'keep me', 'utf8');
  await assert.rejects(executeInstallPlan(plan), /Refusing to overwrite/);
  assert.equal(await readFile(marker, 'utf8'), 'keep me');
});

test('invalid targets and scopes fail before writing', async (t) => {
  const root = await temporaryRoot(t);
  assert.throws(() => buildInstallPlan({ target: 'unknown', root }), /Unsupported|target must/);
  assert.throws(() => buildInstallPlan({ scope: 'global', root }), /scope must/);
});
