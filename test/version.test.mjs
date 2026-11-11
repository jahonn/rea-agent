import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, isReaSupportedNode, parseVersion } from '../src/version.mjs';

test('compareVersions orders semantic versions numerically', () => {
  assert.equal(compareVersions('22.23.4', '22.23.4'), 0);
  assert.equal(compareVersions('22.23.10', '22.23.4'), 1);
  assert.equal(compareVersions('v24.0.0', '24.22.1'), -1);
});

test('isReaSupportedNode follows the documented REA release lines', () => {
  assert.equal(isReaSupportedNode('22.22.2'), false);
  assert.equal(isReaSupportedNode('22.23.4'), true);
  assert.equal(isReaSupportedNode('24.22.1'), true);
  assert.equal(isReaSupportedNode('26.12.1'), true);
  assert.equal(isReaSupportedNode('23.0.0'), false);
  assert.equal(isReaSupportedNode('25.0.0'), false);
});

test('parseVersion rejects malformed versions', () => {
  assert.throws(() => parseVersion('22.x'), /Invalid semantic version/);
  assert.deepEqual(parseVersion('v22.23.4'), [22, 23, 4]);
});
