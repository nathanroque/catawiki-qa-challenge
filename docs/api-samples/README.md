# API Response Samples

This directory contains sanitized examples of read-only API responses observed during exploratory testing against the public Catawiki application.

The samples are provided for documentation and implementation context only.

They are not:

- deterministic test fixtures;
- mocked production responses;
- complete provider contracts;
- sources of hard-coded test expectations.

Runtime tests continue to discover and validate live response data.

The runtime validators intentionally check only the fields and invariants consumed by the implemented scenarios. Additional fields present in an observed payload may therefore appear in these examples without being part of the validator's maintained scope.

## Samples

### `bidding-state.example.json`

Represents an observed bidding-state response containing the displayed bid amount, favourite count, bidding timestamps, identifiers, and additional provider metadata.

The UI may expose either `Current bid` or `Starting bid` depending on live auction state. The observed API payload uses the `current_bid_amount` field for the comparable monetary value used by the integration scenario.

### `lot-navigation.example.json`

Represents an observed lot-navigation response containing the source, adjacent lot identifiers, current position, and total number of lots.

The behavioral API test discovers live identifiers at runtime and validates relationships across adjacent responses rather than treating the values in this sample as stable data.
