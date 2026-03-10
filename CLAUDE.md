# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Do not include "Co-Authored-By: Claude" in commit messages
- Commit and push modular features as they're completed
- Use ocean/tidal metaphors in UI copy (see Brand section below)

## Skills to Use

| Skill | When to Use |
|-------|-------------|
| `/ai-sdk-core` | Backend AI: streamText, tools, structured outputs |
| `/ai-sdk-ui` | React chat: useChat hook, message parts, streaming |
| `/solana-dev` | Solana client (@solana/kit), RPC, transactions, wallet-standard, Anchor, testing |
| `/solana-anchor-claude-skill` | Anchor program development (Rust programs + TypeScript tests) |
| `/frontend-design` | UI components, layouts, styling |
| `/vercel-react-best-practices` | Performance patterns, Next.js optimization |
| `/prompt-engineering-patterns` | Agent system prompts, tool definitions |
| `/wagmi` | EVM wallet hooks (legacy, parked) |
| `/viem` | EVM blockchain ops (legacy, parked) |

## Project Overview

**Tidal** is an AI-powered DeFi yield advisor for Solana. Users set their risk comfort level, and the AI finds, explains, and executes the best yield strategies across Solana protocols — in plain English.

- **Direction**: Solana-first consumer DeFi product
- **Tagline**: "Your AI tidekeeper for Solana DeFi"
- **PRD**: See `docs/Tidal_PRD_v2_Solana.md` for full product requirements
- **Previous**: v1 was an EVM hackathon prototype (Base/Arbitrum/Optimism) for ETH Global HackMoney 2026. EVM code is parked, not deleted.

## Current Status

### What Exists (EVM — Parked)
- AI agent (Claude + Vercel AI SDK v6) with 11 tools
- Risk-tiered UX (Shallows/Mid-Depth/Deep Water)
- Li.Fi swap/bridge/cross-chain routing on Base/Arb/OP
- AAVE V3 lending, generic ERC-4626 vault adapter (10 vaults)
- DeFi Llama yield scanning across 6 chains (including Solana scan-only)
- 293 tests across 14 files
- Deployed on Vercel

### What's Next (Solana — Active)
- Phase 1: Solana wallet + JitoSOL staking + Kamino USDC lending + Jupiter swaps
- Phase 2: Jupiter Lend + Kamino Earn Vaults + Sanctum INF + tx explanation engine
- Phase 3: Auto-rebalancing + portfolio view + education mode
- Phase 4: Lucid Agents x402 API + points system
- **Target launch vehicle**: Colosseum hackathon

## Tech Stack

| Layer | Current (EVM) | Target (Solana) |
|-------|--------------|-----------------|
| Frontend | Next.js 16, React 19, Tailwind v4 | Same (reuse) |
| Auth/Wallet | Privy + Coinbase Smart Wallet | Privy (embedded Solana + Phantom/Backpack external) |
| AI Agent | Vercel AI SDK v6 + Claude | Same (reuse, new tools) |
| Swaps | Li.Fi SDK | Jupiter Ultra API (direct, 2-endpoint, no RPC needed) |
| Lending | AAVE V3 | Kamino Lend, Jupiter Lend |
| Staking | N/A | Jito, Sanctum |
| Yield Data | DeFi Llama | Same (already scans Solana) |
| Chain | Base Mainnet | Solana Mainnet |

## Commands

- `npm run dev` — Development server (http://localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npx vitest run` — Run all tests (293 across 14 files)

## Architecture (Current EVM + Target Solana)

```
app/
├── layout.tsx              # Root + wallet provider
├── page.tsx                # Landing page
├── (auth)/onboard/         # Risk depth selection
├── (app)/
│   ├── layout.tsx          # 3-panel layout
│   └── dashboard/          # Main dashboard + chat
└── api/
    ├── chat/route.ts       # AI agent (Vercel AI SDK)
    ├── yields/route.ts     # DeFi Llama yield scanner
    └── solana/             # [NEW] Solana-specific API routes
        ├── rates/route.ts
        └── positions/route.ts

lib/
├── ai/
│   ├── tools.ts            # Current EVM tools (11)
│   ├── tools-solana.ts     # [NEW] Solana AI tools
│   └── prompts.ts          # System prompts (update for Solana)
├── solana/                 # [NEW] Solana protocol adapters
│   ├── connection.ts       # RPC connection + fallback
│   ├── kamino.ts           # Kamino Lend
│   ├── jupiter-lend.ts     # Jupiter Lend
│   ├── jito.ts             # JitoSOL staking
│   ├── sanctum.ts          # Sanctum INF
│   ├── jupiter-swap.ts     # Jupiter swap aggregation
│   └── registry.ts         # Protocol registry
├── lifi.ts                 # [PARKED] Li.Fi SDK wrapper
├── aave.ts                 # [PARKED] AAVE integration
├── vaults.ts               # [PARKED] ERC-4626 vault adapter
├── vault-registry.ts       # [PARKED] EVM vault addresses
├── chains.ts               # [PARKED] EVM chain configs
└── constants.ts            # Shared constants
```

## Brand Guidelines

**Ocean Metaphors** (unchanged — core to Tidal's identity):
- Risk tiers: Shallows (conservative) -> Mid-Depth -> Deep Water (aggressive)
- Opportunities: "Incoming tide", "Catch this wave"
- Safety: "Calm waters", "Drop anchor"
- Actions: "Dive in", "Surface"

**Voice**: Calm, knowledgeable guide. Educational without condescending.

**Colors**: Ocean blues, teals, sandy neutrals. Dark theme default.

## Solana Risk Tier Strategy Matrix

| Tier | Strategies | Target APY | Protocols |
|------|-----------|-----------|-----------|
| Shallows | Liquid staking, stablecoin lending | 4-8% | JitoSOL, Sanctum INF, Kamino USDC |
| Mid-Depth | Single-asset lending, curated vaults | 8-15% | Kamino Earn Vaults, Jupiter Lend, Drift lending |
| Deep Water | Leveraged yield, LP positions | 15%+ | Jupiter Multiply, Kamino LP (Orca), Drift perp funding |

## Solana Protocol Quick Reference

| Protocol | TVL | What It Does | SDK |
|----------|-----|-------------|-----|
| Kamino | ~$3B | Lending + curated vaults | `@kamino-finance/klend-sdk` |
| Jupiter Lend | ~$1.6B | Isolated lending vaults | Jupiter Lend API |
| Jito | ~$2.9B | Liquid staking (SOL -> JitoSOL) | `@jito-foundation/jito-ts-sdk` |
| Sanctum | ~$1.2B | LST aggregator (INF token) | Sanctum router program |
| Drift | ~$494M | Perps + lending | `@drift-labs/sdk` |

## Key Differences: EVM vs Solana

| Concept | EVM (current) | Solana (target) |
|---------|--------------|-----------------|
| Addresses | `0x...` hex | base58 public keys |
| Contracts | Solidity ABI | Anchor IDL |
| Token approval | ERC-20 `approve()` + `transferFrom()` | SPL Token (no approve pattern) |
| Vault standard | ERC-4626 (universal) | None — each protocol has its own interface |
| Accounts | Single address | Keypair + PDA + ATA |
| Transaction model | Single contract call | Instruction bundles (multiple IXs per tx) |

## Grant Strategy

| Program | Fit | Angle | Timing |
|---------|-----|-------|--------|
| **Colosseum Hackathon** | Primary | AI + consumer DeFi on Solana ($250K + accelerator) | Submit when Phase 1 ships |
| **Superteam Microgrant** | Good | Up to $10K, early-stage consumer app | Apply now |
| **Solana Foundation** | Good | AI + DeFi tooling | After Phase 1 |
| **Kamino Grants** | Good | Driving deposits via AI | After Kamino adapter |
| **Jupiter Grants** | Good | Driving lending deposits | After Jupiter Lend adapter |

## Competitive Positioning

- **vs Griffain/Virtuals**: We're a product, not a token. Working UX, not speculation.
- **vs SendAI/Agent Kit**: Consumer product on top of infrastructure. Different layer.
- **vs Phantom**: We're the AI advisor Phantom doesn't have. Route users to the optimal protocol.
- **vs Jupiter/Kamino**: We route users TO them when they're the best option. Complementary, not competitive.
- **vs Step Finance**: We act on data, not just display it.
- **Moat**: AI personalization (risk tiers) + universal protocol adapters + plain-English explanations + x402 agent API

## Test Coverage (EVM — 293 tests)

Run with `npx vitest run`. All tests pass.

| Test File | Tests | Covers |
|-----------|-------|--------|
| `aave.test.ts` | 14 | AAVE helpers, APY parsing, tx preparation |
| `aave-execution.test.ts` | 20 | Supply/withdraw execution, approval flow |
| `action-card-helpers.test.ts` | 16 | Error handling, validation, quote staleness |
| `chains.test.ts` | 24 | Multi-chain config (will need Solana additions) |
| `constants.test.ts` | 24 | Risk depths, yield chains, contracts |
| `db-connection.test.ts` | 7 | Null-safe DB, Drizzle instance |
| `db-schema.test.ts` | 19 | Zod schema validation |
| `lifi.test.ts` | 14 | Token config, route formatting |
| `lifi-crosschain.test.ts` | 59 | Cross-chain logic, bridge timeout, MCP fallback |
| `prompts.test.ts` | 25 | System prompt building, welcome messages |
| `strategies.test.ts` | 30 | Strategy filtering, recommendations |
| `vault-registry.test.ts` | 9 | Vault lookup, filtering |
| `vaults.test.ts` | 13 | ERC-4626 deposit/withdraw execution |
| `yields.test.ts` | 19 | DeFi Llama filtering, risk assessment |

## Lessons Learned (from v1 — still relevant)

**AI SDK v6**: `toUIMessageStreamResponse()` not `toDataStreamResponse()`. `convertToModelMessages()` is ASYNC.

**Privy**: Import `createConfig`/`WagmiProvider` from `@privy-io/wagmi` (EVM). Wallet client can be undefined on first render.

**DeFi Llama API**: Free, no auth. ~10-15MB response, cache 5-10 min. Risk mapping: `exposure === "single" && ilRisk === "no"`.

**React/Next.js**: `useState(null)` + localStorage = double-render. `flex-1 overflow-y-auto` needs `min-h-0`. Dynamic imports with `ssr: false` fix wallet hydration.

**UI/UX**: Tier-exclusive display. "Scouted by Tidal" first in Mid-Depth. Limit to top 3 + "+N more". Always show protocol name with token.
