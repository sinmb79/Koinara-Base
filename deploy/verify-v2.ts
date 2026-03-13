import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { ethers } from "ethers";
import "dotenv/config";
import {
  ROOT,
  getProfileFromArgv,
  getRpcCandidates,
  loadChainConfig,
  loadDeployParams,
  resolveHealthyRpcUrl
} from "./common.js";

type DeploymentManifest = {
  contractAddresses: Record<string, string>;
  deployTxHashes: Record<string, string>;
  blockNumbers: Record<string, number>;
  chainId: number;
  deployer?: string;
  rpcUrlUsed?: string;
  epochParams: {
    genesisTimestamp: number;
    epochDuration: number;
    halvingInterval: number;
    initialEpochEmission: string;
    activePoolBps: number;
  };
  tokenCap: string;
  gitRef: string;
};

const registryAbi = [
  "function verifier() view returns (address)",
  "function rewardDistributor() view returns (address)",
  "function admin() view returns (address)"
];

const tokenAbi = [
  "function minter() view returns (address)",
  "function admin() view returns (address)",
  "function cap() view returns (uint256)"
];

const nodeRegistryAbi = [
  "function rewardDistributor() view returns (address)",
  "function admin() view returns (address)",
  "function epochDuration() view returns (uint256)",
  "function genesisTimestamp() view returns (uint256)"
];

const distributorAbi = [
  "function epochDuration() view returns (uint256)",
  "function halvingInterval() view returns (uint256)",
  "function initialEpochEmission() view returns (uint256)",
  "function genesisTimestamp() view returns (uint256)",
  "function activePoolBps() view returns (uint256)"
];

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function assertEqual<T>(label: string, actual: T, expected: T): Promise<void> {
  if (actual !== expected) {
    throw new Error(`${label} failed: expected ${expected}, got ${actual}`);
  }

  console.log(`ok ${label}`);
}

async function readWithRetry<T>(
  label: string,
  reader: () => Promise<T>,
  attempts = 4,
  delayMs = 1200
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await reader();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
      console.warn(
        `retry ${label} (${attempt}/${attempts}) after call failure: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      await new Promise((resolveTimer) => setTimeout(resolveTimer, delayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function main(): Promise<void> {
  const profile = getProfileFromArgv();
  const chain = loadChainConfig(profile);
  const params = loadDeployParams(profile);
  const manifest = loadJson<DeploymentManifest>(
    resolve(ROOT, "deployments", `base-${profile}-v2.json`)
  );

  const rpcUrl = await resolveHealthyRpcUrl(getRpcCandidates(chain), chain.chainId);
  const provider = new ethers.JsonRpcProvider(rpcUrl, chain.chainId || undefined);
  const registry = new ethers.Contract(manifest.contractAddresses.registry, registryAbi, provider);
  const token = new ethers.Contract(manifest.contractAddresses.token, tokenAbi, provider);
  const nodeRegistry = new ethers.Contract(
    manifest.contractAddresses.nodeRegistry,
    nodeRegistryAbi,
    provider
  );
  const distributor = new ethers.Contract(
    manifest.contractAddresses.rewardDistributor,
    distributorAbi,
    provider
  );

  await assertEqual(
    "registry.verifier",
    await readWithRetry("registry.verifier", () => registry.verifier()),
    manifest.contractAddresses.verifier
  );
  await assertEqual(
    "registry.rewardDistributor",
    await readWithRetry("registry.rewardDistributor", () => registry.rewardDistributor()),
    manifest.contractAddresses.rewardDistributor
  );
  await assertEqual(
    "token.minter",
    await readWithRetry("token.minter", () => token.minter()),
    manifest.contractAddresses.rewardDistributor
  );
  await assertEqual(
    "nodeRegistry.rewardDistributor",
    await readWithRetry("nodeRegistry.rewardDistributor", () => nodeRegistry.rewardDistributor()),
    manifest.contractAddresses.rewardDistributor
  );
  await assertEqual("registry.admin", await readWithRetry("registry.admin", () => registry.admin()), ethers.ZeroAddress);
  await assertEqual("token.admin", await readWithRetry("token.admin", () => token.admin()), ethers.ZeroAddress);
  await assertEqual(
    "nodeRegistry.admin",
    await readWithRetry("nodeRegistry.admin", () => nodeRegistry.admin()),
    ethers.ZeroAddress
  );
  await assertEqual(
    "token.cap",
    (await readWithRetry("token.cap", () => token.cap())).toString(),
    params.expectedTokenCap
  );
  await assertEqual(
    "nodeRegistry.epochDuration",
    (await readWithRetry("nodeRegistry.epochDuration", () => nodeRegistry.epochDuration())).toString(),
    String(params.epochDuration)
  );
  await assertEqual(
    "epochDuration",
    (await readWithRetry("epochDuration", () => distributor.epochDuration())).toString(),
    String(params.epochDuration)
  );
  await assertEqual(
    "halvingInterval",
    (await readWithRetry("halvingInterval", () => distributor.halvingInterval())).toString(),
    String(params.halvingInterval)
  );
  await assertEqual(
    "initialEpochEmission",
    (await readWithRetry("initialEpochEmission", () => distributor.initialEpochEmission())).toString(),
    params.initialEpochEmission
  );
  await assertEqual(
    "activePoolBps",
    (await readWithRetry("activePoolBps", () => distributor.activePoolBps())).toString(),
    String(manifest.epochParams.activePoolBps)
  );
  await assertEqual(
    "manifest.genesisTimestamp",
    (await readWithRetry("manifest.genesisTimestamp", () => distributor.genesisTimestamp())).toString(),
    String(manifest.epochParams.genesisTimestamp)
  );
  await assertEqual(
    "nodeRegistry.genesisTimestamp",
    (await readWithRetry("nodeRegistry.genesisTimestamp", () => nodeRegistry.genesisTimestamp())).toString(),
    String(manifest.epochParams.genesisTimestamp)
  );
  await assertEqual("manifest.chainId", String(manifest.chainId), String(chain.chainId));

  console.log("Base v2 deployment verification completed successfully.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
