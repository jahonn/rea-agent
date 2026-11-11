const CONFIDENCE_LEVELS = new Set(['observed', 'inferred', 'speculative']);
const AUTHORIZATION_STATES = new Set(['pending', 'confirmed', 'rejected']);
const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateStringArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string') errors.push(`${path}[${index}] must be a string`);
  });
}

export function createInvestigationTemplate() {
  return {
    schemaVersion: '1.0.0',
    target: {
      name: '',
      type: 'javascript-electron',
      locator: ''
    },
    authorization: {
      status: 'pending',
      ownership: '',
      purpose: '',
      outputScope: '',
      disclaimerAccepted: false,
      confirmedAt: null
    },
    findings: [],
    limitations: [],
    unknowns: []
  };
}

export function validateInvestigation(record, options = {}) {
  const errors = [];
  if (!isObject(record)) {
    return { valid: false, errors: ['report must be a JSON object'] };
  }

  if (record.schemaVersion !== '1.0.0') {
    errors.push('schemaVersion must be "1.0.0"');
  }

  if (!isObject(record.target)) {
    errors.push('target must be an object');
  } else {
    for (const field of ['name', 'type', 'locator']) {
      if (!isNonEmptyString(record.target[field])) {
        errors.push(`target.${field} must be a non-empty string`);
      }
    }
  }

  if (!isObject(record.authorization)) {
    errors.push('authorization must be an object');
  } else {
    const authorization = record.authorization;
    if (!AUTHORIZATION_STATES.has(authorization.status)) {
      errors.push('authorization.status must be pending, confirmed, or rejected');
    }
    for (const field of ['ownership', 'purpose', 'outputScope']) {
      if (typeof authorization[field] !== 'string') {
        errors.push(`authorization.${field} must be a string`);
      }
    }
    if (typeof authorization.disclaimerAccepted !== 'boolean') {
      errors.push('authorization.disclaimerAccepted must be a boolean');
    }
    if (authorization.confirmedAt !== null && typeof authorization.confirmedAt !== 'string') {
      errors.push('authorization.confirmedAt must be a string or null');
    }

    if (options.requireAuthorized) {
      if (authorization.status !== 'confirmed') {
        errors.push('authorization.status must be confirmed');
      }
      for (const field of ['ownership', 'purpose', 'outputScope']) {
        if (!isNonEmptyString(authorization[field])) {
          errors.push(`authorization.${field} is required for an authorized report`);
        }
      }
      if (authorization.disclaimerAccepted !== true) {
        errors.push('authorization.disclaimerAccepted must be true');
      }
      if (!isNonEmptyString(authorization.confirmedAt) || Number.isNaN(Date.parse(authorization.confirmedAt))) {
        errors.push('authorization.confirmedAt must be a valid date-time string');
      }
    }
  }

  if (!Array.isArray(record.findings)) {
    errors.push('findings must be an array');
  } else {
    record.findings.forEach((finding, findingIndex) => {
      const path = `findings[${findingIndex}]`;
      if (!isObject(finding)) {
        errors.push(`${path} must be an object`);
        return;
      }
      for (const field of ['id', 'claim']) {
        if (!isNonEmptyString(finding[field])) errors.push(`${path}.${field} must be a non-empty string`);
      }
      if (!CONFIDENCE_LEVELS.has(finding.confidence)) {
        errors.push(`${path}.confidence must be observed, inferred, or speculative`);
      }
      if (!Array.isArray(finding.evidence) || finding.evidence.length === 0) {
        errors.push(`${path}.evidence must contain at least one item`);
        return;
      }
      finding.evidence.forEach((evidence, evidenceIndex) => {
        const evidencePath = `${path}.evidence[${evidenceIndex}]`;
        if (!isObject(evidence)) {
          errors.push(`${evidencePath} must be an object`);
          return;
        }
        for (const field of ['artifactPath', 'summary']) {
          if (!isNonEmptyString(evidence[field])) {
            errors.push(`${evidencePath}.${field} must be a non-empty string`);
          }
        }
        if (evidence.locator !== undefined && typeof evidence.locator !== 'string') {
          errors.push(`${evidencePath}.locator must be a string`);
        }
        if (evidence.sha256 !== undefined && !SHA256_PATTERN.test(evidence.sha256)) {
          errors.push(`${evidencePath}.sha256 must contain 64 hexadecimal characters`);
        }
      });
    });
  }

  validateStringArray(record.limitations, 'limitations', errors);
  validateStringArray(record.unknowns, 'unknowns', errors);

  return { valid: errors.length === 0, errors };
}
