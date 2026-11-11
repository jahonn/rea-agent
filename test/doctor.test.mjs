import test from 'node:test';
import assert from 'node:assert/strict';
import { getDoctorReport } from '../src/doctor.mjs';

function availableRunner(command) {
  return {
    status: 0,
    stdout: command === 'rea' ? '6.4.0\n' : '10.9.7\n',
    stderr: ''
  };
}

function unavailableRunner() {
  return { status: null, stdout: '', stderr: '', error: new Error('not found') };
}

test('doctor reports ready for a supported complete environment', () => {
  const report = getDoctorReport({
    nodeVersion: '22.23.4',
    platform: 'linux',
    runner: availableRunner
  });
  assert.equal(report.ready, true);
  assert.equal(report.checks.reaCli.version, '6.4.0');
  assert.deepEqual(report.recommendations, []);
});

test('doctor explains an unsupported REA Node runtime', () => {
  const report = getDoctorReport({
    nodeVersion: '22.22.2',
    platform: 'linux',
    runner: availableRunner
  });
  assert.equal(report.ready, false);
  assert.equal(report.checks.node.agentSupported, true);
  assert.equal(report.checks.node.reaSupported, false);
  assert.ok(report.recommendations.some((item) => item.includes('22.23.4')));
});

test('doctor does not download REA when the CLI is absent', () => {
  const report = getDoctorReport({
    nodeVersion: '24.22.1',
    platform: 'linux',
    runner: unavailableRunner
  });
  assert.equal(report.ready, false);
  assert.equal(report.checks.reaCli.installed, false);
  assert.ok(report.recommendations.some((item) => item.includes('npx rea-agents setup')));
});

test('Windows probes allow fixed npm and REA command shims', () => {
  const calls = [];
  const runner = (command, args, options) => {
    calls.push({ command, args, options });
    return availableRunner(command);
  };
  const report = getDoctorReport({
    nodeVersion: '22.23.4',
    platform: 'win32',
    runner
  });
  assert.equal(report.ready, true);
  assert.deepEqual(calls.map((call) => call.command), ['npm', 'rea']);
  assert.ok(calls.every((call) => call.options.shell === true));
  assert.ok(calls.every((call) => call.args.length === 1 && call.args[0] === '--version'));
});
