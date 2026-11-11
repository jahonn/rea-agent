export function parseVersion(version) {
  const normalized = String(version).trim().replace(/^v/, '').split('-')[0];
  const parts = normalized.split('.').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    throw new TypeError(`Invalid semantic version: ${version}`);
  }
  return parts;
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}

export function isReaSupportedNode(version) {
  const [major] = parseVersion(version);
  if (major === 22) return compareVersions(version, '22.23.4') >= 0;
  if (major === 24) return compareVersions(version, '24.22.1') >= 0;
  if (major === 26) return compareVersions(version, '26.12.1') >= 0;
  return false;
}
