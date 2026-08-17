# ADR 004 — Production Test Guardrails

## Context

The assignment targets Catawiki's real public production environment. Some otherwise valuable testing actions could affect users, active auctions, data integrity, infrastructure, or access controls.

## Decision

Production-facing automation remains anonymous, read-only, low-impact, and limited to behavior available through normal public customer flows.

The suite will not intentionally:

- bid, purchase, register accounts, or change favourites;
- create or modify persistent production data;
- probe authentication, authorization, or unrelated internal services;
- bypass edge, anti-bot, or other security controls;
- perform load, stress, aggressive boundary, or security testing;
- collect authentication material or sensitive user data;
- generate unnecessary traffic.

Read-only APIs may be tested only when they were observed during normal anonymous application behavior and provide distinct value.

## Reasons

- Protect customers and active auctions.
- Preserve data integrity.
- Respect an externally owned environment and its controls.
- Demonstrate responsible production-test judgment.

## Trade-offs

Important authenticated and transactional risks remain uncovered. This is an accepted constraint of the take-home environment, not evidence that those risks are unimportant.

## Consequences

- Runtime data is discovered rather than seeded.
- Production traffic is bounded through scope and worker limits.
- GitHub-hosted access restrictions are documented rather than bypassed.
- State-changing, performance, and security coverage remains deferred until authorization and a controlled environment exist.

Current scenario status is maintained in the [test plan](../test-plan.md). The observed environment behavior is recorded in [findings](../findings.md#environment-and-ci-observations).
