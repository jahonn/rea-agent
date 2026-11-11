# Contributing

Thank you for improving REA Agent. Contributions must preserve the project's authorization, evidence, and non-destructive installation guarantees.

## Development setup

Use a current Node.js 22 or newer release:

```bash
npm ci
npm test
npm run check
```

No runtime dependencies are required. Do not add a dependency unless it provides clear value that cannot be achieved with a small, auditable Node.js implementation.

## Before submitting

1. Create a focused branch.
2. Add or update tests for behavior changes.
3. Run `npm test` and `npm run check`.
4. Update documentation when commands, paths, or contracts change.
5. Keep `SKILL.md` host-independent and place host-specific behavior in `adapters/`.
6. Use synthetic or owned fixtures only.

## Prohibited contribution content

Do not submit proprietary binaries, stolen credentials, license bypasses, DRM circumvention, confidential target output, or instructions whose primary purpose is unauthorized access or infringement.

## Pull requests

Describe the problem, design choice, behavior change, test evidence, and remaining limitations. Small pull requests are easier to review. By contributing, you confirm that you have the right to submit your changes under the repository's MIT License.
