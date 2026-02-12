import { describe, it, expect } from 'vitest';
import {
  VAULT_REGISTRY,
  getVault,
  getVaultSlugs,
  getVaultsForRisk,
  getVaultsForToken,
} from '../vault-registry';

describe('VAULT_REGISTRY', () => {
  it('has vaults defined', () => {
    const slugs = getVaultSlugs();
    expect(slugs.length).toBeGreaterThan(0);
  });

  it('all vaults have required fields', () => {
    for (const [slug, vault] of Object.entries(VAULT_REGISTRY)) {
      expect(vault.name, `${slug} missing name`).toBeTruthy();
      expect(vault.protocol, `${slug} missing protocol`).toBeTruthy();
      expect(vault.address, `${slug} missing address`).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(vault.underlyingAddress, `${slug} missing underlyingAddress`).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(vault.underlyingDecimals, `${slug} invalid decimals`).toBeGreaterThan(0);
      expect(vault.chainId, `${slug} missing chainId`).toBe(8453);
      expect([1, 2, 3], `${slug} invalid riskLevel`).toContain(vault.riskLevel);
      expect(vault.apyEstimate, `${slug} invalid apyEstimate`).toBeGreaterThanOrEqual(0);
    }
  });

  it('has Shallows-tier vaults (risk level 1)', () => {
    const shallows = getVaultsForRisk(1);
    expect(shallows.length).toBeGreaterThan(0);
    shallows.forEach((v) => expect(v.riskLevel).toBe(1));
  });

  it('has Mid-Depth vaults (risk level 2)', () => {
    const midDepth = getVaultsForRisk(2);
    expect(midDepth.length).toBeGreaterThan(getVaultsForRisk(1).length);
  });
});

describe('getVault', () => {
  it('returns vault by slug', () => {
    const vault = getVault('yo-usdc');
    expect(vault).toBeDefined();
    expect(vault!.name).toBe('YO yoUSD');
    expect(vault!.underlyingToken).toBe('USDC');
  });

  it('returns undefined for invalid slug', () => {
    expect(getVault('nonexistent')).toBeUndefined();
  });
});

describe('getVaultsForToken', () => {
  it('filters by USDC', () => {
    const usdcVaults = getVaultsForToken('USDC');
    expect(usdcVaults.length).toBeGreaterThan(0);
    usdcVaults.forEach((v) => expect(v.underlyingToken).toBe('USDC'));
  });

  it('filters by WETH', () => {
    const wethVaults = getVaultsForToken('WETH');
    expect(wethVaults.length).toBeGreaterThan(0);
    wethVaults.forEach((v) => expect(v.underlyingToken).toBe('WETH'));
  });

  it('respects risk level filter', () => {
    const shallowsUsdc = getVaultsForToken('USDC', 1);
    const allUsdc = getVaultsForToken('USDC', 3);
    expect(allUsdc.length).toBeGreaterThanOrEqual(shallowsUsdc.length);
  });
});
