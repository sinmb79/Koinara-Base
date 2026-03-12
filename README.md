# Koinara-Base

`Koinara-Base` is the deployment repository for running `Koinara` on Base.

This repository keeps the Base launch path separate from the live Worldland launch so we can prepare, rehearse, and ship an EVM alternative without mixing chain-specific configuration.

## Scope

- deploy and verify the `Koinara` v2 contracts on Base Mainnet and Base Sepolia
- keep Base chain profiles, deployment manifests, and canary helpers in one place
- reuse the upstream protocol source from `vendor/koinara` as a read-only submodule
- hand off deployed contract addresses to the shared `Koinara-node` repository after launch

This repository does not contain the operator node runtime. Providers and verifiers still use [`sinmb79/Koinara-node`](https://github.com/sinmb79/Koinara-node).

## Repository Layout

- `vendor/koinara/`: upstream protocol submodule
- `config/`: Base Mainnet and Base Sepolia chain profiles
- `deploy/`: v2 deployment, verification, doctor, and canary scripts
- `deployments/`: generated Base deployment manifests
- `docs/`: Base launch runbook and RPC strategy notes

## Quick Start

1. Install Node.js 20+ and Foundry.
2. Initialize the protocol submodule:

```bash
git submodule update --init --recursive
```

3. Install dependencies:

```bash
npm install
```

4. Check the selected Base profile:

```bash
npm run doctor:testnet
```

5. Build the protocol artifacts:

```bash
forge build
```

6. Deploy and verify:

```bash
npm run deploy:v2:testnet
npm run verify:v2:testnet
```

Swap `testnet` for `mainnet` when you are ready.

## Base Network Profiles

- Base Mainnet
  - chain ID: `8453`
  - public RPC: `https://mainnet.base.org`
- Base Sepolia
  - chain ID: `84532`
  - public RPC: `https://sepolia.base.org`

The public RPC endpoints are fine for quick checks, but Base documents them as rate-limited and not suitable for production traffic. For actual provider traffic, plan for a dedicated RPC provider or your own Base node. See [docs/base-rpc-strategy.md](docs/base-rpc-strategy.md).

To override the tracked public RPC with your production endpoint, copy the example file:

- `config/chain.mainnet.local.example.json` -> `config/chain.mainnet.local.json`
- `config/chain.testnet.local.example.json` -> `config/chain.testnet.local.json`

## Deployment Outputs

Successful runs write:

- `deployments/base-testnet-v2.json`
- `deployments/base-mainnet-v2.json`

The Base launch checklist is in [docs/mainnet-checklist.md](docs/mainnet-checklist.md).

## Node Handoff

After Base contracts are deployed, copy the contract addresses into `Koinara-node`:

- `config/networks.mainnet.local.json` for Base Mainnet
- `config/networks.testnet.local.json` for Base Sepolia

Then enable `base` in the node runtime and provide a production-grade Base RPC URL.
