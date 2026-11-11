import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInvestigationTemplate, validateInvestigation } from '../src/validate.mjs';

const exampleUrl = new URL('../examples/investigation.valid.json', import.meta.url);
const validRecord = JSON.parse(await readFile(exampleUrl, 'utf8'));

test('accepts a complete authorized investigation record', () => {
  const result = validateInvestigation(validRecord, { requireAuthorized: true });
  assert.deepEqual(result, { valid: true, errors: [] });
});

test('rejects findings without evidence', () => {
  const record = structuredClone(validRecord);
  record.findings[0].evidence = [];
  const result = validateInvestigation(record, { requireAuthorized: true });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('at least one item')));
});

test('rejects pending authorization in strict mode', () => {
  const record = createInvestigationTemplate();
  record.target = { name: 'Owned fixture', type: 'dotnet', locator: '/tmp/fixture.dll' };
  const normal = validateInvestigation(record);
  const strict = validateInvestigation(record, { requireAuthorized: true });
  assert.equal(normal.valid, true);
  assert.equal(strict.valid, false);
  assert.ok(strict.errors.some((error) => error.includes('must be confirmed')));
});

test('rejects malformed hashes and unsupported confidence labels', () => {
  const record = structuredClone(validRecord);
  record.findings[0].confidence = 'certain';
  record.findings[0].evidence[0].sha256 = 'not-a-hash';
  const result = validateInvestigation(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('confidence')));
  assert.ok(result.errors.some((error) => error.includes('64 hexadecimal')));
});

test('requires limitations and unknowns to be explicit arrays', () => {
  const record = structuredClone(validRecord);
  delete record.limitations;
  record.unknowns = 'none';
  const result = validateInvestigation(record);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('limitations must be an array'));
  assert.ok(result.errors.includes('unknowns must be an array'));
});
