/** Solana protocol registry — metadata for AI recommendations and display. */

export interface SolanaProtocol {
  id: string;
  name: string;
  description: string;
  tvl: string;
  chain: 'Solana';
  audits: string[];
  riskLevel: 1 | 2 | 3;
  strategies: SolanaStrategy[];
}

export interface SolanaStrategy {
  id: string;
  name: string;
  type: 'staking' | 'lending' | 'vault' | 'lp';
  tokens: string[];
  riskLevel: 1 | 2 | 3;
  targetApyRange: [number, number]; // [min, max]
  description: string;
}

export const SOLANA_PROTOCOLS: SolanaProtocol[] = [
  {
    id: 'jito',
    name: 'Jito',
    description: 'Liquid staking with MEV rewards. Stake SOL, receive JitoSOL.',
    tvl: '~$2.9B',
    chain: 'Solana',
    audits: ['Neodyme', 'OtterSec'],
    riskLevel: 1,
    strategies: [
      {
        id: 'jito-stake',
        name: 'JitoSOL Staking',
        type: 'staking',
        tokens: ['SOL'],
        riskLevel: 1,
        targetApyRange: [5, 7],
        description: 'Stake SOL for JitoSOL — earns staking rewards + MEV tips.',
      },
    ],
  },
  {
    id: 'kamino',
    name: 'Kamino',
    description: 'Lending and curated vaults. Largest Solana lender by TVL.',
    tvl: '~$3B',
    chain: 'Solana',
    audits: ['OtterSec', 'Kudelski'],
    riskLevel: 1,
    strategies: [
      {
        id: 'kamino-usdc-lend',
        name: 'Kamino USDC Lending',
        type: 'lending',
        tokens: ['USDC'],
        riskLevel: 1,
        targetApyRange: [3, 6],
        description: 'Supply USDC to Kamino Lend — earn variable interest from borrowers.',
      },
      {
        id: 'kamino-usdt-lend',
        name: 'Kamino USDT Lending',
        type: 'lending',
        tokens: ['USDT'],
        riskLevel: 1,
        targetApyRange: [3, 6],
        description: 'Supply USDT to Kamino Lend.',
      },
    ],
  },
  {
    id: 'jupiter-lend',
    name: 'Jupiter Lend',
    description: 'Isolated lending vaults with ultra-low liquidation penalties.',
    tvl: '~$1.6B',
    chain: 'Solana',
    audits: ['OtterSec'],
    riskLevel: 1,
    strategies: [
      {
        id: 'jupiter-lend-usdc',
        name: 'Jupiter Lend USDC',
        type: 'lending',
        tokens: ['USDC'],
        riskLevel: 1,
        targetApyRange: [4, 8],
        description: 'Supply USDC to Jupiter Lend — isolated vault design with 0.1% liquidation penalties.',
      },
    ],
  },
  {
    id: 'jupiter-swap',
    name: 'Jupiter',
    description: 'Solana swap aggregator. Routes through all major DEXes for best price.',
    tvl: 'N/A',
    chain: 'Solana',
    audits: ['OtterSec', 'Halborn'],
    riskLevel: 1,
    strategies: [], // Swap is a utility, not a yield strategy
  },
];

// --- Query Helpers ---

/** Get strategies filtered by risk tier. */
export function getStrategiesForTier(maxRisk: 1 | 2 | 3): SolanaStrategy[] {
  return SOLANA_PROTOCOLS.flatMap(p =>
    p.strategies.filter(s => s.riskLevel <= maxRisk),
  );
}

/** Get strategies that accept a specific token. */
export function getStrategiesForToken(token: string, maxRisk: 1 | 2 | 3): SolanaStrategy[] {
  const upper = token.toUpperCase();
  return getStrategiesForTier(maxRisk).filter(s =>
    s.tokens.includes(upper),
  );
}

/** Get protocol by ID. */
export function getProtocol(id: string): SolanaProtocol | undefined {
  return SOLANA_PROTOCOLS.find(p => p.id === id);
}

/** Format strategies for AI system prompt context. */
export function getStrategiesContext(maxRisk: 1 | 2 | 3): string {
  const strategies = getStrategiesForTier(maxRisk);
  if (strategies.length === 0) return 'No strategies available for this risk tier.';

  const tierName = maxRisk === 1 ? 'Shallows' : maxRisk === 2 ? 'Mid-Depth' : 'Deep Water';

  return [
    `Available ${tierName} strategies on Solana:`,
    ...strategies.map(s => {
      const protocol = SOLANA_PROTOCOLS.find(p => p.strategies.includes(s));
      return `- ${s.name} (${protocol?.name}): ${s.description} [${s.targetApyRange[0]}-${s.targetApyRange[1]}% APY]`;
    }),
  ].join('\n');
}
