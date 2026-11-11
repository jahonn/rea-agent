# Investigation workflow

## Evidence loop

1. Record target, feature, authority, purpose, and output scope.
2. Inspect capabilities and select the narrowest static operation.
3. Collect structured REA output and preserve its evidence references.
4. Trace only modules, routes, functions, or requests relevant to the feature.
5. Separate direct observations from inferences and unresolved questions.
6. Record findings in the investigation schema.
7. Validate the record before presenting it as complete.

## Confidence model

- `observed`: directly present in an inspected artifact or captured behavior.
- `inferred`: derived from observations with a stated reasoning path.
- `speculative`: a plausible explanation that still lacks sufficient evidence.

A claim without evidence must not be presented as established fact. A hash identifies an artifact; it does not prove that the associated interpretation is correct.

## Machine-readable records

Create a pending record before analysis:

```bash
rea-agent init investigation.json
```

After completing the authorization fields and adding findings, validate it:

```bash
rea-agent validate investigation.json --require-authorized
```

The validator checks structure and internal completeness. It cannot verify target ownership, the accuracy of a claim, or whether a hash belongs to a real artifact.

## Rebuild validation

Prefer a small behavioral contract derived from authorized observations. Include normal cases, boundary cases, and failure cases. When reference behavior cannot be executed legally or safely, use fixtures and label the result as fixture-based rather than runtime-equivalent.
