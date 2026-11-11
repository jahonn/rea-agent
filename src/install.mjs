import { constants } from 'node:fs';
import { access, copyFile, cp, mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const SUPPORTED_TARGETS = Object.freeze(['claude', 'codex', 'dsh', 'workbuddy']);

function targetBase(target, root) {
  if (target === 'claude') return join(root, '.claude');
  if (target === 'codex' || target === 'dsh') return join(root, '.agents');
  if (target === 'workbuddy') return join(root, '.workbuddy');
  throw new Error(`Unsupported target: ${target}`);
}

export function buildInstallPlan(options = {}) {
  const requestedTarget = options.target ?? 'all';
  const scope = options.scope ?? 'project';
  if (!['user', 'project'].includes(scope)) throw new Error('scope must be user or project');
  if (requestedTarget !== 'all' && !SUPPORTED_TARGETS.includes(requestedTarget)) {
    throw new Error(`target must be all, ${SUPPORTED_TARGETS.join(', ')}`);
  }

  const defaultRoot = scope === 'user' ? homedir() : process.cwd();
  const root = resolve(options.root ?? defaultRoot);
  const targets = requestedTarget === 'all' ? SUPPORTED_TARGETS : [requestedTarget];
  const operations = [];

  for (const target of targets) {
    const base = targetBase(target, root);
    operations.push({
      target,
      kind: 'directory',
      source: join(packageRoot, 'skills', 'rea-agent'),
      destination: join(base, 'skills', 'rea-agent')
    });
    if (target === 'claude') {
      operations.push({
        target,
        kind: 'file',
        source: join(packageRoot, 'adapters', 'claude-code', 'agents', 'rea-agent.md'),
        destination: join(base, 'agents', 'rea-agent.md')
      });
    }
  }

  const unique = new Map();
  for (const operation of operations) {
    if (!unique.has(operation.destination)) unique.set(operation.destination, operation);
  }
  return { root, scope, target: requestedTarget, operations: [...unique.values()] };
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function executeInstallPlan(plan) {
  const conflicts = [];
  for (const operation of plan.operations) {
    if (await pathExists(operation.destination)) conflicts.push(operation.destination);
  }
  if (conflicts.length > 0) {
    throw new Error(`Refusing to overwrite existing paths:\n${conflicts.join('\n')}`);
  }

  for (const operation of plan.operations) {
    await mkdir(dirname(operation.destination), { recursive: true });
    if (operation.kind === 'directory') {
      await cp(operation.source, operation.destination, {
        recursive: true,
        force: false,
        errorOnExist: true
      });
    } else {
      await copyFile(operation.source, operation.destination, constants.COPYFILE_EXCL);
    }
  }
  return plan.operations.map((operation) => operation.destination);
}
