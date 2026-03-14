# Base Deploy Runbook

## Inputs

- `config/chain.testnet.json` or `config/chain.mainnet.json`
- optional local override: `config/chain.testnet.local.json` or `config/chain.mainnet.local.json`
- `deploy/params.testnet.json` or `deploy/params.mainnet.json`
- `PRIVATE_KEY_FILE`
- `CREATOR_PRIVATE_KEY_FILE` for canary jobs

## Commands

```bash
npm run doctor:testnet
forge build
npm run deploy:v2:testnet
npm run verify:v2:testnet
npm run canary:v2:testnet
```

For mainnet, swap `testnet` with `mainnet`.

## Outputs

Successful deployments write:

- `deployments/base-testnet-v2.json`
- `deployments/base-mainnet-v2.json`

Each manifest contains:

- `contractAddresses`
- `deployTxHashes`
- `blockNumbers`
- `chainId`
- `epochParams`
- `tokenCap`
- `gitRef`

Sensitive operator details such as the deployer address, raw private-key source, and the exact RPC endpoint are intentionally excluded from the committed manifest.

## Node Handoff

After the deployment is verified, copy the Base contract addresses into `Koinara-node`.

Recommended handoff:

1. add the Base addresses to `Koinara-node/config/networks.mainnet.local.json`
2. provide a dedicated Base RPC URL
3. enable `base` in `node.config.json`

## Production Note

Base documents `https://mainnet.base.org` and `https://sepolia.base.org` as public RPC endpoints, but also notes that they are rate-limited and not suitable for production traffic. Treat them as bootstrap endpoints, not long-term provider infrastructure.
