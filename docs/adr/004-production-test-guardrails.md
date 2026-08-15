# ADR 004 — Production Test Guardrails

## Context

The assignment is executed against Catawiki's real production environment.

Expanding the suite can demonstrate broader testing knowledge, but some testing techniques or state-changing actions could affect real users, auctions, production data, or infrastructure.

## Decision

Automation executed against production will follow a non-destructive and low-impact strategy.

Tests should behave as normal anonymous customer interactions and prefer read-only validation.

The suite will not intentionally:

- Perform load, stress, or volume testing
- Place bids or perform purchases
- Create or modify persistent production data
- Interact with internal services outside normal customer flows
- Collect or store sensitive user or authentication data
- Generate unnecessary traffic against production systems

## Reasons

- Protect real customer experience
- Preserve production data integrity
- Avoid interference with active auctions
- Prevent unnecessary operational or security risk
- Keep the assessment representative of responsible production testing practices

## Trade-offs

These restrictions reduce the amount of behavior that can safely be tested end-to-end against production.

Some scenarios that would be valuable in an internal test or staging environment will therefore be documented rather than executed.

## Consequence

Additional test coverage will be selected based on risk, value, execution cost, and whether it can be safely performed against production.