# Documentation Guide

Start with the repository [README](../README.md). It explains the current capability and how to run it.

## Recommended reading order

1. [Test plan](test-plan.md) — what is tested, priority, status, and intended execution context.
2. [Approach](approach.md) — why the implementation and reliability model evolved this way.
3. [Findings](findings.md) — observations from the public Catawiki production application.
4. [ADRs](adr/) — durable architectural decisions and trade-offs.
5. [Future opportunities](future-opportunities.md) — deliberately deferred work and what internal access would change.
6. [API samples](api-samples/README.md) — sanitized evidence of observed read-only payloads.

## Source-of-truth ownership

| Topic                                                         | Canonical document                              |
| ------------------------------------------------------------- | ----------------------------------------------- |
| Installation, commands, reports, current CI                   | [README](../README.md)                          |
| Scenario status, priority, test layer, intended target        | [Test plan](test-plan.md)                       |
| Engineering evolution and reliability reasoning               | [Approach](approach.md)                         |
| Observed production, browser, accessibility, and API behavior | [Findings](findings.md)                         |
| Durable decisions                                             | `docs/adr/`                                     |
| Deferred improvements and internal-project evolution          | [Future opportunities](future-opportunities.md) |
| Sanitized API evidence                                        | [API samples](api-samples/README.md)            |

## Documentation graph

```text
README
  ├── Test Plan ───────→ ADRs
  │       │                │
  │       └── Approach ←───┘
  │               │
  │               └── Findings ───→ API Samples
  │
  └── Future Opportunities
```

Documents use short summaries and links rather than repeating complete explanations. The current implementation remains authoritative if documentation and code ever diverge.
