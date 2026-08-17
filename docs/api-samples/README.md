# API Response Samples

This directory contains sanitized examples observed during read-only reconnaissance of the public Catawiki application.

They provide documentation context only. They are not:

- deterministic fixtures;
- mocked production responses;
- stable expected values;
- complete provider contracts.

The maintained tests discover live values and validate only the response fields and invariants they consume. See the [test plan](../test-plan.md#api-001--uiapi-bidding-consistency) for scenario intent and [findings](../findings.md#api-and-network-observations) for the evidence context.

## Samples

- [`bidding-state.example.json`](bidding-state.example.json) illustrates observed bidding amounts, favourite count, timestamps, identifiers, state, and surrounding provider metadata.
- [`lot-navigation.example.json`](lot-navigation.example.json) illustrates source, adjacent identifiers, current position, and total lots.

The UI can show `Current bid` or `Starting bid`; the sample API uses `current_bid_amount` for the euro value compared by the integration scenario. No sample value is used as a hard-coded assertion.
