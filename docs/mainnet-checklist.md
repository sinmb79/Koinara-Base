# Base Mainnet Checklist

## Before Deploy

- confirm `vendor/koinara` is initialized
- confirm `forge build` succeeds
- copy `config/chain.mainnet.local.example.json` to `config/chain.mainnet.local.json`
- replace the placeholder RPC URLs with your actual Base Mainnet provider URLs
- load `PRIVATE_KEY_FILE`
- prepare a separate `CREATOR_PRIVATE_KEY_FILE`
- make sure the deployer wallet has enough `ETH` for deployment and verification

## Dry Run

```bash
npm run doctor:mainnet
forge build
```

## Deploy

```bash
npm run deploy:v2:mainnet
```

## Verify

```bash
npm run verify:v2:mainnet
```

## Canary

```bash
npm run canary:v2:mainnet
```

Canary must use the separate creator key file. It will no longer fall back to the deployer key.

## Handoff

- copy the deployed Base addresses into `Koinara-node`
- add the production Base RPC URL to the node runtime
- run provider/verifier checks against Base before enabling traffic
