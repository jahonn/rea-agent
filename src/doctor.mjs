import { spawnSync } from 'node:child_process';
import { compareVersions, isReaSupportedNode } from './version.mjs';

function probe(command, args, runner, platform) {
  const result = runner(command, args, {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
    shell: platform === 'win32'
  });
  if (result.error || result.status !== 0) {
    return { installed: false, version: null };
  }
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return { installed: true, version: output.split(/\r?\n/)[0] || 'unknown' };
}

export function getDoctorReport(options = {}) {
  const runner = options.runner ?? spawnSync;
  const platform = options.platform ?? process.platform;
  const nodeVersion = options.nodeVersion ?? process.version;
  const npm = probe('npm', ['--version'], runner, platform);
  const reaCli = probe('rea', ['--version'], runner, platform);
  const ownNodeSupported = compareVersions(nodeVersion, '22.0.0') >= 0;
  const reaNodeSupported = isReaSupportedNode(nodeVersion);
  const recommendations = [];

  if (!ownNodeSupported) recommendations.push('Upgrade to Node.js 22 or newer to run rea-agent.');
  if (!reaNodeSupported) {
    recommendations.push('Upgrade Node.js for current REA releases: 22.23.4+, 24.22.1+, or 26.12.1+.');
  }
  if (!npm.installed) recommendations.push('Install npm before setting up REA.');
  if (!reaCli.installed) {
    recommendations.push('Run npx rea-agents setup to install and register the official REA toolchain.');
  }

  return {
    ready: ownNodeSupported && reaNodeSupported && npm.installed && reaCli.installed,
    checks: {
      node: {
        version: nodeVersion,
        agentSupported: ownNodeSupported,
        reaSupported: reaNodeSupported
      },
      npm,
      reaCli
    },
    recommendations
  };
}
