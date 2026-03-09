# Tidal: Solana-First Consumer DeFi Product

**Version:** 2.0
**Date:** March 9, 2026
**Status:** Active — replaces v1 hackathon PRD
**Transition:** EVM hackathon prototype (Base) → Solana-first consumer product

---

## Executive Summary

Tidal is an AI-powered DeFi yield advisor that makes Solana DeFi accessible, safe, and effortless. Users tell Tidal their risk comfort level, and the AI finds, explains, and executes the best yield strategies across Solana protocols — in plain English.

### One-Liner
> "Your AI tidekeeper for Solana DeFi."

### Why Solana-First
- 77% of AI agent transaction volume happens on Solana (Franklin Templeton, Dec 2025)
- 400ms finality + sub-cent fees = instant, frictionless UX
- $11.5B DeFi TVL with deep lending/staking markets
- No consumer-grade AI yield advisor exists on Solana today
- 20M+ Phantom users = massive addressable market already on-chain

### Core Value Proposition
- **For Solana users** who want to earn yield but find DeFi protocols overwhelming
- **Tidal** eliminates complexity with an AI that explains every action, personalizes by risk, and executes transactions
- **Unlike** raw protocol UIs (Kamino, Jupiter, Drift) that assume expertise
- **Unlike** DeFAI token projects (Griffain, Virtuals) that are speculative, not functional
- **Tidal** is a working product where every recommendation is explained and every action is transparent

---

## Problem Statement

1. **Yield is everywhere on Solana** — Kamino ($3B TVL), Jupiter Lend ($1.6B), Jito ($2.9B), Sanctum, Drift, Marinade — but comparing them requires protocol-by-protocol research
2. **Security is a real concern** — $250M+ stolen from Solana users in H1 2025 via phishing and malicious approvals. Users need help understanding what they're signing.
3. **No standard vault interface** — Unlike EVM's ERC-4626, every Solana protocol has a unique API. This makes building universal tools hard (and is therefore a moat once built).
4. **Yield changes constantly** — The best option last week may not be the best option today. Manual monitoring is exhausting.

---

## Target Users

### Primary: "Solana Sophie"
- Has SOL and USDC in Phantom, trades on Jupiter sometimes
- Knows staking exists, has maybe staked SOL natively
- Doesn't understand the difference between Kamino, Marginfi, and Jupiter Lend
- Wants to earn yield without becoming a full-time DeFi researcher
- **Quote:** "I have SOL and USDC sitting in my wallet. I know I should be earning something but I don't know which protocol to trust."

### Secondary: "Busy Builder Brian"
- DeFi-literate, has used multiple Solana protocols
- Time-constrained — checking Kamino vs Jupiter Lend vs Drift daily is unsustainable
- Wants optimization handled for him
- **Quote:** "I know what I'm doing but I don't have time to do it every day."

---

## Product Architecture

### Risk Tiers (Unchanged — Tidal's Core UX)

| Tier | Name | Solana Strategies | Target APY | Protocols |
|------|------|-------------------|-----------|-----------|
| 1 | **Shallows** | Liquid staking, stablecoin lending | 4-8% | JitoSOL, Sanctum INF, Kamino USDC |
| 2 | **Mid-Depth** | Single-asset lending, curated vaults | 8-15% | Kamino Earn Vaults, Jupiter Lend, Drift lending |
| 3 | **Deep Water** | Leveraged yield, LP positions | 15%+ | Jupiter Multiply, Kamino LP (Orca), Drift perp funding |

### Agent Decision Loop

```
User sets risk depth
    │
    ▼
AI scans yields (DeFi Llama + on-chain reads)
    │
    ▼
AI filters by risk tier → ranks by APY
    │
    ▼
AI recommends with plain-English explanation
    │
    ▼
User approves (or autopilot auto-executes)
    │
    ▼
Tidal executes via protocol adapter
    │
    ▼
Dashboard updates, AI monitors for changes
```

### Tech Stack (Solana-First)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16, React 19, Tailwind v4 | Reuse from v1 |
| Auth/Wallet | Privy (embedded Solana wallet) OR Solana Wallet Adapter (Phantom, Backpack) | Decision: TBD — see Open Questions |
| AI Agent | Vercel AI SDK v6 + Claude | Reuse from v1, new Solana tools |
| Swaps | Jupiter API (direct) | Li.Fi supports Jupiter via Li.Fi but direct is simpler for Solana-only |
| Lending | Kamino Lend, Jupiter Lend | Custom adapters (no ERC-4626 equivalent) |
| Staking | Jito, Sanctum | LST minting + redemption |
| Yield Data | DeFi Llama Yields API | Already scanning Solana (chain === "Solana") |
| Chain | Solana Mainnet | Devnet for testing |

### Target Architecture

```
lib/
├── solana/
│   ├── connection.ts      # Solana RPC connection + fallback
│   ├── kamino.ts           # Kamino Lend adapter (supply, withdraw, positions)
│   ├── jupiter-lend.ts     # Jupiter Lend adapter
│   ├── jito.ts             # JitoSOL staking (mint/redeem)
│   ├── sanctum.ts          # Sanctum INF staking
│   ├── jupiter-swap.ts     # Jupiter swap aggregation
│   └── registry.ts         # Protocol registry (like EVM vault-registry)
├── ai/
│   ├── tools-solana.ts     # Solana-specific AI tools
│   ├── tools.ts            # Shared tools (yield scanning)
│   └── prompts.ts          # Updated for Solana context
└── hooks/
    ├── useSolanaPositions.ts
    └── useSolanaYields.ts

app/api/
├── chat/route.ts           # AI agent (reuse, add Solana tools)
├── yields/route.ts         # DeFi Llama scanner (already has Solana)
└── solana/
    ├── rates/route.ts      # Live APY from on-chain reads
    └── positions/route.ts  # Portfolio positions
```

---

## Features (Phased)

### Phase 1: Solana Foundation (MVP — 3-4 weeks)

**F1: Solana Wallet Connection**
- Connect Phantom, Backpack, or Privy embedded wallet
- Display SOL, USDC, and major token balances
- Show current staking positions if any

**F2: JitoSOL Staking (Shallows)**
- Stake SOL → receive JitoSOL (~5.9% APY)
- Unstake JitoSOL → receive SOL
- Display position value and earned rewards
- AI explains MEV tips and staking mechanics

**F3: Kamino USDC Lending (Shallows)**
- Supply USDC to Kamino Lend
- Withdraw USDC + interest
- Read live APY from Kamino
- AI compares Kamino rate vs alternatives

**F4: Jupiter Swap Integration**
- Swap any Solana token via Jupiter
- AI uses this when user has the wrong token for a strategy
- Route display showing path and rate

**F5: AI Tools (Solana)**
- `stakeSOL` — Prepare JitoSOL staking transaction
- `lendUSDC` — Prepare Kamino supply transaction
- `swapToken` — Prepare Jupiter swap
- `scanSolanaYields` — Scan DeFi Llama for Solana opportunities
- `getSolanaRates` — Live APY from on-chain protocol reads

**F6: Risk-Tiered Recommendations**
- Reuse risk depth selection UI from v1
- AI filters strategies by tier
- Shallows users only see staking + stablecoin lending
- Explain risk in plain English before every action

### Phase 2: Protocol Expansion (3 weeks)

**F7: Jupiter Lend**
- Supply/withdraw across Jupiter Lend markets
- Compare rates vs Kamino in AI recommendations

**F8: Kamino Curated Earn Vaults**
- Deposit into Gauntlet/Steakhouse curated vaults
- Higher yields than base lending (Mid-Depth tier)

**F9: Sanctum INF Staking**
- Stake via Sanctum for best-in-class LST APY (~6.4%)
- AI recommends JitoSOL vs INF vs mSOL based on current rates

**F10: Transaction Explanation Engine**
- Before every signature, show plain-English breakdown of what the transaction does
- Flag unusual patterns (high slippage, unknown programs, excessive token approvals)
- "This transaction will stake 10 SOL with Jito and give you 9.83 JitoSOL in return. You can unstake anytime."

**F11: Protocol Risk Scoring**
- Display per-protocol: audit status, TVL trend, age, exploit history
- AI references these in recommendations: "Kamino has been audited by OtterSec and Kudelski, $3B TVL, no exploits."

### Phase 3: Intelligence + Differentiation (3 weeks)

**F12: Auto-Rebalancing**
- Monitor yield rates on a schedule (Vercel Cron)
- Alert user when a better opportunity appears
- Autopilot mode: auto-execute rebalance if delta > threshold
- "Kamino USDC dropped to 3.1%, Jupiter Lend is offering 5.8%. Want me to move your funds?"

**F13: Portfolio View**
- Unified view of all Solana positions (staking, lending, LP)
- Show total yield earned, current APY, allocation breakdown
- Historical performance chart

**F14: DeFi Education Mode**
- Contextual explanations triggered by user questions
- "What is impermanent loss?" → AI explains with user's actual positions as examples
- Progressive learning: track what concepts user has been exposed to

### Phase 4: Agent Infrastructure + Monetization (4 weeks)

**F15: Lucid Agents + x402 API**
- Expose Tidal's yield intelligence as a paid API
- Other AI agents pay per-call to scan Solana yields, get recommendations, or prepare transactions
- Pricing: $0.01/yield scan, $0.05/recommendation, $0.10/tx preparation
- Revenue dashboard for tracking agent API income

**F16: Points System**
- Points per action: staking (10), lending (15), vault deposit (25), rebalance (50)
- Streak multiplier for weekly activity
- Leaderboard (pseudonymous, wallet-based)
- Creates token-launch optionality

---

## Solana Protocol Details

### Kamino Finance (Primary Lending)
- **TVL**: ~$3B (largest Solana lender)
- **Interface**: Custom — `deposit()`, `withdraw()` on Kamino market accounts
- **Key innovation**: V2 Curated Earn Vaults (managed by Gauntlet, Steakhouse)
- **kTokens**: Yield-bearing receipt tokens usable as collateral elsewhere
- **SDK**: `@kamino-finance/klend-sdk`

### Jupiter Lend (Secondary Lending)
- **TVL**: ~$1.6B (launched Aug 2025, growing fast)
- **Interface**: Isolated vaults with Fluid liquidation engine
- **Key innovation**: 0.1% liquidation penalties (100x lower than industry)
- **Supported**: cbBTC, JupSOL, JitoSOL, USDC, USDT, EURC
- **SDK**: Jupiter Lend API

### Jito (Liquid Staking)
- **TVL**: ~$2.9B, 14.5M+ SOL staked
- **JitoSOL APY**: ~5.9% (staking rewards + MEV tips)
- **Interface**: Stake pool program — `depositSol()` → receive JitoSOL
- **SDK**: `@jito-foundation/jito-ts-sdk` or direct stake pool IX

### Sanctum (LST Aggregator)
- **TVL**: ~$1.2B
- **INF APY**: ~6.4% (best among Solana LSTs)
- **Role**: Liquidity layer for all Solana LSTs
- **Interface**: Router program for LST swaps

### Drift Protocol (Deep Water)
- **TVL**: ~$494M
- **Features**: Perps (101x), unified cross-margin, lending
- **Use for Tidal**: Drift lending yields for Deep Water tier
- **SDK**: `@drift-labs/sdk`

---

## Competitive Analysis

| Product | What They Do | Tidal's Edge |
|---------|-------------|-------------|
| **Griffain** | Agent token platform ($457M mcap) | We're a product, not a token. Working UX, not speculation. |
| **The Hive** | Multi-agent investment system | Risk personalization, plain-English explanations, consumer UX |
| **SendAI Agent Kit** | Developer toolkit (60+ actions) | Consumer product on top of infra. Different layer. |
| **Phantom** | Wallet with built-in swaps/staking | We're the AI advisor Phantom doesn't have. Route users to optimal protocol. |
| **Jupiter** | Swap aggregator + lending | We route TO Jupiter when it's the best option. Complementary. |
| **Step Finance** | Solana portfolio dashboard | We act on data, not just display it. AI executes. |

**Key insight**: The Solana AI-DeFi space is crowded with infrastructure and speculative tokens but thin on consumer-grade yield management. Tidal occupies the "advisor layer" — we don't compete with protocols, we route users to the right one.

---

## Grant & Launch Strategy

### Primary Target: Colosseum Hackathon
- **Prize**: $250K investment + 6-week accelerator
- **Fit**: AI + consumer DeFi on Solana — exactly what they fund
- **Timing**: Ship Phase 1, submit to next Colosseum cycle
- **Previous winners**: The Hive ($60K from SendAI) — validates the AI-DeFi thesis

### Secondary Targets

| Program | Amount | Timing | Angle |
|---------|--------|--------|-------|
| Superteam Microgrant | Up to $10K | Apply now with prototype | Consumer AI DeFi on Solana |
| Solana Foundation | Varies | After Phase 1 ships | AI + DeFi tooling |
| Kamino Grants | TBD | After Kamino adapter ships | Driving deposits via AI |
| Jupiter Grants | TBD | After Jupiter Lend adapter | Driving lending deposits |

### Distribution Channels
- **Phantom**: 20M+ users already on Solana — target with content/education
- **Backpack xNFT**: Package Tidal as an executable NFT inside Backpack wallet
- **Superteam network**: Community distribution across emerging markets
- **X/Twitter**: Solana CT is highly engaged — demo videos, threads

---

## Phase Dependency Graph

```
Phase 1: Solana Foundation (MVP)
├── Wallet connection
├── JitoSOL staking
├── Kamino USDC lending
├── Jupiter swaps
├── AI tools (Solana)
└── Risk-tiered recommendations
    │
    ▼
Phase 2: Protocol Expansion
├── Jupiter Lend
├── Kamino Earn Vaults
├── Sanctum INF
├── Transaction explanation engine
└── Protocol risk scoring
    │
    ▼
Phase 3: Intelligence
├── Auto-rebalancing
├── Portfolio view
└── Education mode
    │
    ▼
Phase 4: Infrastructure + Monetization
├── Lucid Agents + x402 API
└── Points system
```

---

## What We're Carrying Forward from v1

| Asset | Status | Reusability |
|-------|--------|-------------|
| Risk depth UX (Shallows/Mid-Depth/Deep Water) | Shipped | 100% — brand and concept transfer |
| AI agent + chat interface | Shipped | 90% — new tools, same UX |
| DeFi Llama yield scanning | Shipped | 100% — already scans Solana |
| Landing page + brand | Shipped | 95% — update copy |
| Tool architecture pattern (AI SDK v6) | Shipped | 80% — new adapters, same shape |
| Test infrastructure (293 tests, vitest) | Shipped | 70% — new protocol tests |
| Ocean metaphor + brand voice | Established | 100% |
| ActionCard component pattern | Shipped | 85% — adapt for Solana tx types |

### What We're Leaving Behind
- EVM chain configs (Base, Arbitrum, Optimism) — park, don't delete
- Li.Fi SDK integration — park for future cross-chain phase
- AAVE V3 adapters — EVM-only, not needed for Solana
- ERC-4626 vault adapter — no equivalent on Solana
- Wagmi hooks — replaced by Solana wallet adapter hooks

---

## Open Questions

1. **Wallet strategy**: Privy embedded Solana wallet (simpler onboarding, consistent with v1) vs standard Solana Wallet Adapter (Phantom/Backpack native, larger user base)?
2. **Jupiter swaps**: Direct Jupiter API vs Li.Fi's Jupiter integration? Direct is simpler for Solana-only.
3. **Colosseum timing**: When is the next hackathon cycle? This determines Phase 1 deadline.
4. **Team**: Solo or looking for co-builders?
5. **Solana devnet testing**: Kamino and Jupiter Lend may not have devnet deployments — need to verify or use mainnet fork.

---

## Success Metrics

### Phase 1 Launch
- [ ] Working demo: connect wallet → select risk → get recommendation → execute stake/lend
- [ ] At least 2 Solana protocols integrated (Jito + Kamino)
- [ ] AI explains every action before execution
- [ ] Risk tiers affect recommendations
- [ ] < 3 second time-to-first-recommendation

### Product-Market Fit Signals
- Users return to check yields (DAU/WAU ratio)
- Users execute AI-recommended actions (not just read)
- Users increase risk tier over time (trust building)
- Positive qualitative feedback on explanation quality

### Grant Application Readiness
- Working product on Solana mainnet
- Video demo showing full flow
- Traction numbers (users, TVL routed, transactions)
- Clear roadmap with Phase 2+ differentiation

---

*Tidal v2: From hackathon prototype to Solana-first consumer product.*
