# Base RPC Strategy

Base is still an RPC-backed architecture. The difference from the current Worldland experience is that Base has a more mature provider ecosystem.

## Practical Rules

- use the public Base RPC only for bootstrapping and quick validation
- use a dedicated RPC provider for sustained provider/verifier traffic
- keep at least two Base RPC URLs available for failover
- do not require every Koinara operator to run a local Base node

## Why

Base officially documents:

- public mainnet RPC: `https://mainnet.base.org`
- public sepolia RPC: `https://sepolia.base.org`
- public endpoints are rate-limited and not intended for production systems

That still fits Koinara better than forcing each provider to run a local full node, because operators can choose among many compatible Base RPC providers instead of being pushed into a single shared relay.

## Recommended Launch Posture

1. launch Koinara v2 on Base Sepolia first
2. validate deploy / verify / canary end-to-end
3. prepare two production-grade Base Mainnet RPC URLs
4. only then hand off Base addresses into `Koinara-node`
