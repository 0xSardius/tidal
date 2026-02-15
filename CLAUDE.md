# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Do not include "Co-Authored-By: Claude" in commit messages
- Commit and push modular features as they're completed
- Use ocean/tidal metaphors in UI copy (see Brand section below)

## Skills to Use

Invoke these skills when working on relevant features:

| Skill | When to Use |
|-------|-------------|
| `/ai-sdk-core` | Backend AI: streamText, tools, structured outputs |
| `/ai-sdk-ui` | React chat: useChat hook, message parts, streaming |
| `/wagmi` | React wallet hooks: useAccount, useContractRead/Write |
| `/viem` | Non-React blockchain: signing, encoding, direct calls |
| `/frontend-design` | UI components, layouts, styling |
| `/vercel-react-best-practices` | Performance patterns, Next.js optimization |
| `/prompt-engineering-patterns` | Agent system prompts, tool definitions |

## Project Overview

**Tidal** is an AI-powered DeFi yield management dashboard for ETH Global HackMoney 2026.

- **Target Prize**: Li.Fi ($5-10K) - requires deep SDK integration
- **Tagline**: "Your AI-managed tidal pool in the DeFi ocean"
- **Demo**: 3-minute golden path showing chat → recommendation → execution

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Auth/Wallet | Privy + Coinbase Smart Wallet |
| AI Agent | Vercel AI SDK + Claude |
| DEX/Bridge | Li.Fi SDK |
| Lending/Vaults | AAVE V3 (Shallows), Generic ERC-4626 vaults (Mid-Depth+) |
| Yield Data | DeFi Llama Yields API (free, no auth) |
| Chain | Base Sepolia (dev) / Base Mainnet (demo) |

## Commands

- `npm run dev` - Development server (http://localhost:3000)
- `npm run build` - Production build
- `npm run lint` - ESLint check

## Architecture

```
app/
├── layout.tsx              # Root + Privy provider
├── page.tsx                # Landing page
├── (auth)/onboard/         # Risk depth selection
├── (app)/
│   ├── layout.tsx          # 3-panel layout
│   └── dashboard/          # Main dashboard + chat
└── api/
    ├── chat/route.ts       # AI agent (Vercel AI SDK)
    ├── lifi/               # Li.Fi quote/route endpoints
    └── yields/route.ts     # DeFi Llama yield scanner (cached)

components/
├── chat/                   # ChatPanel, Message, ActionCard
├── dashboard/              # PortfolioPanel, PositionCard
├── sidebar/                # PoolList, PoolItem
└── swap/                   # SwapPreview, RouteDisplay

lib/
├── lifi.ts                 # Li.Fi SDK wrapper
├── aave.ts                 # AAVE integration
├── vaults.ts               # Generic ERC-4626 vault adapter (works with ANY vault)
├── vault-registry.ts       # Curated vault addresses (add protocol = add entry)
├── ai/                     # Tools, prompts, context
└── constants.ts            # Addresses, ABIs
```

## Brand Guidelines

**Ocean Metaphors**:
- Risk tiers: Shallows (conservative) → Mid-Depth → Deep Water (aggressive)
- Opportunities: "Incoming tide", "Catch this wave"
- Safety: "Calm waters", "Drop anchor"
- Actions: "Dive in", "Surface"

**Voice**: Calm, knowledgeable guide. Educational without condescending.

**Colors**: Ocean blues, teals, sandy neutrals. Dark theme default.

## Li.Fi Integration (Prize Critical)

**Li.Fi is the UNIVERSAL ROUTING LAYER for all tiers** - not just Deep Water.

### When Li.Fi is Used:
- User has wrong token for strategy → Li.Fi swaps first
- User wants to rebalance portfolio → Li.Fi routes between assets
- Any token conversion needed → Li.Fi finds optimal path
- Cross-chain movement (stretch) → Li.Fi bridges

### Strategy Flow:
```
User Request → Check Risk Depth → Filter Strategies →
  Check if swap needed?
    YES → Li.Fi swap → Then deposit to protocol
    NO  → Direct deposit to protocol
  → Update Dashboard
```

### Risk Tier Strategy Matrix:

| Tier | Yield Strategies | Target APY | Accepted Tokens | Li.Fi Role |
|------|-----------------|-----------|-----------------|------------|
| Shallows | AAVE USDC, AAVE DAI | 3-5% | USDC, DAI, ETH* | Swap ETH→stable first |
| Mid-Depth | Above + Morpho USDC Vault, AAVE ETH/WETH | 5-10% | USDC, DAI, ETH | Swap between any, route to best protocol |
| Deep Water | Above + multi-step combos | 10%+ | All supported | Complex routing |

*Example: Shallows user with ETH → Li.Fi swaps ETH→USDC → AAVE supply
*Example: Mid-Depth user with USDC → AI finds Morpho at 7.8% vs AAVE at 3.9% → deposits to Morpho

### Agent Behavior:
- ALWAYS mention Li.Fi when routing: "Routing via Li.Fi across 5 DEXs for 0.3% better rate"
- Show RouteDisplay component for every swap
- Explain WHY this route was chosen

---

## 🎯 Vision: Cross-Chain Yield Optimization

**The Ultimate Value Prop**: Tidal becomes the **AI-powered yield router** that finds the best risk-adjusted returns across ALL chains and moves your funds there automatically via Li.Fi.

### The Problem We Solve
- Yield opportunities exist across 20+ chains
- Users don't have time to monitor rates everywhere
- Bridging manually is complex and error-prone
- Risk assessment requires expertise

### The Tidal Solution
```
User: "Find me the best USDC yield for my risk level"

┌─────────────────────────────────────────────────────────────┐
│  AI Agent scans multiple chains in real-time                │
│                                                              │
│  Base AAVE     4.2% APY  ████████░░  Risk: Low              │
│  Arbitrum AAVE 3.8% APY  ███████░░░  Risk: Low              │
│  Optimism Sonne 4.5% APY ████████░░  Risk: Low              │
│  Polygon AAVE  5.1% APY  ██████████  Risk: Low   ← BEST     │
│                                                              │
│  "I found 5.1% APY on Polygon AAVE - that's 0.9% higher     │
│   than your current position. Want me to move your funds?"  │
└─────────────────────────────────────────────────────────────┘

Route: Base USDC → Li.Fi (Stargate) → Polygon → AAVE Supply
Cost: ~$0.50 | Break-even: 4 days | Extra yield: +$37/year
```

### Why Li.Fi is Critical
Li.Fi transforms Tidal from "AAVE frontend" to "cross-chain yield optimizer":

| Without Li.Fi | With Li.Fi |
|---------------|------------|
| Single chain only | 20+ chains accessible |
| Manual bridging | One-click cross-chain |
| Limited opportunities | Best rates anywhere |
| User finds yields | AI finds yields FOR you |

### Implementation Phases

**Phase 1 (Current - Hackathon)**
- Single chain (Base), multi-protocol yield (AAVE + Morpho)
- DeFi Llama yield scanning across protocols on Base
- Li.Fi for token swaps before deposit
- AI recommends best protocol per risk tier
- AI explains and executes

**Phase 2 (Post-Hackathon)**
- Multi-chain yield comparison (DeFi Llama across all chains)
- Li.Fi bridges for cross-chain movement
- AI recommends optimal chain based on:
  - Current APY
  - Bridge costs
  - Gas fees
  - Break-even analysis

**Phase 3 (Future)**
- Auto-rebalancing ("Move when APY delta > 1%")
- Additional protocol support (Compound, Moonwell, etc.)
- Yield notifications ("Better rate found on Arbitrum")
- Portfolio optimization across chains

### Competitive Moat
- **AI-first**: Not just a dashboard, an intelligent advisor
- **Risk-aware**: Filters by user's comfort level
- **Cross-chain native**: Li.Fi enables seamless movement
- **Educational**: Explains every recommendation

### For Judges
This is not another DeFi dashboard. Tidal is the **interface layer between users and cross-chain DeFi**, powered by:
- **Li.Fi** for universal routing
- **AI** for intelligent recommendations
- **Risk depth** for personalization

---

## Post-Hackathon: Product Roadmap & Grant Strategy

Tidal has the foundation of a real product. The core thesis — **an AI agent that manages DeFi yield across risk tiers** — solves a genuine problem and scales well beyond the hackathon.

### What We've Built (Hackathon)
- AI agent that explains DeFi and executes real transactions on Base
- Risk-tiered UX (Shallows/Mid-Depth/Deep Water) that personalizes recommendations
- Generic ERC-4626 vault adapter — any new vault = one registry entry, zero code
- Li.Fi as the universal swap/routing layer
- DeFi Llama yield scanning across all Base protocols
- YO Protocol integration (8.6% USDC APY, Coinbase Ventures backed)

### Phase 2: Autonomous Yield Agent
- **Auto-rebalancing**: "Monitor my positions, rebalance when APY delta > 1%"
- **Scheduled scans**: Agent periodically checks yield landscape, notifies user of better opportunities
- **Smart entry/exit**: Agent watches gas prices and timing to optimize transaction costs
- **Position health monitoring**: Alert when vault TVL drops, APY changes significantly, or risk parameters shift

### Phase 3: Cross-Chain Yield Optimization
- Multi-chain yield comparison via DeFi Llama (Arbitrum, Optimism, Polygon, etc.)
- Li.Fi bridges for cross-chain movement — one-click migration to higher yields
- Break-even analysis: "Bridge cost is $0.50, you'll earn it back in 4 days at the higher rate"
- Portfolio view across all chains

### Phase 4: Advanced Strategies via Li.Fi
- **LP position management**: Swap + provide liquidity + manage price ranges via AI
- **Multi-step strategies**: Swap → bridge → deposit → stake in one conversational flow
- **DCA automation**: "Buy $100 of ETH weekly and deposit to the best vault"
- **Yield farming orchestration**: Claim rewards → swap to stablecoin → re-deposit

### Phase 5: Protocol Expansion
- Direct Moonwell adapter (cToken interface, 5-9% USDC APY)
- Compound V3 integration
- Aerodrome LP vaults (Deep Water tier)
- Pendle yield tokenization strategies

### Phase 6: Infrastructure & Data Layer
- **Shared PortfolioContext**: Lift all position data (AAVE + vault balances) into a single React context at the dashboard layout level. All child components (PoolList, PortfolioPanel, ChatPanel) consume from context instead of calling duplicate hooks. Eliminates 3x `useAavePositions()` / 2x `useVaultPositions()` duplication.
- **RPC fallback chain**: Configure viem/wagmi with multiple transports (Alchemy primary, public RPC fallback) so if one provider goes down, the app stays up. Use viem's `fallback()` transport.
- **WebSocket subscriptions**: Replace polling-on-mount with block event subscriptions for real-time position updates. Better UX and fewer RPC calls.
- **Server-side position indexing**: For real scale, use an indexer (Goldsky, The Graph, or a cron job) to cache position data in a DB, so the frontend never hits RPC directly for reads.

### Grant Targets

| Program | Fit | Angle |
|---------|-----|-------|
| **Li.Fi Ecosystem Grants** | Strong | AI-first integration partner, showcases SDK as invisible routing layer |
| **Base Builder Grants** | Strong | Onboarding mainstream users to Base DeFi via conversational AI |
| **Morpho Grants** | Good | Driving deposits into Morpho vaults through AI recommendations |
| **Coinbase Developer Grants** | Good | Smart Wallet + Base + Coinbase-backed protocols (YO) |
| **Optimism RPGF** | Future | Cross-chain yield optimization benefits the Superchain ecosystem |

### Competitive Positioning
- **vs Yearn/Beefy**: Those are vaults. Tidal is the *advisor* layer that routes users to the right vault.
- **vs DeFi dashboards (Zapper, DeBank)**: They show data. Tidal *acts* on it.
- **vs robo-advisors (TradFi)**: Tidal brings that UX to DeFi with on-chain execution.
- **Moat**: AI personalization (risk tiers) + universal vault adapter + Li.Fi routing = hard to replicate as a whole.

---

## Mid-Depth Strategy: Morpho Blue Vaults + DeFi Llama Yield Scanning

### Why Morpho for Mid-Depth
Morpho Blue vaults on Base deliver **5-10% USDC APY** vs AAVE's ~3.9%. They use the **ERC-4626 standard** (simplest vault interface in DeFi), making integration ~2-4 hours. This gives Mid-Depth users a real yield upgrade over Shallows.

### Morpho Vault Addresses (Base Mainnet)
- **Gauntlet USDC Vault**: `0x...` (verify on morpho.org before integration)
- **Moonwell Flagship USDC**: `0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca`
- **Steakhouse USDC**: (Coinbase-integrated vault)

### Morpho ERC-4626 Interface
```solidity
// Deposit (supply)
vault.deposit(uint256 assets, address receiver) → uint256 shares

// Withdraw
vault.redeem(uint256 shares, address receiver, address owner) → uint256 assets

// Read position
vault.balanceOf(address owner) → uint256 shares
vault.convertToAssets(uint256 shares) → uint256 assets
```

### DeFi Llama Yields API
- **Endpoint**: `GET https://yields.llama.fi/pools` (free, no auth)
- **Returns**: 20K+ pools across 118 chains with live APY, TVL, protocol info
- **Filter for Base**: `pool.chain === "Base"`
- **Key fields**: `apy`, `apyBase`, `apyReward`, `tvlUsd`, `project`, `symbol`, `exposure`, `ilRisk`
- **Cache**: Response is ~10-15MB, cache for 5-10 minutes
- **Risk mapping**: `exposure === "single" && ilRisk === "no"` → safe for Shallows/Mid-Depth

### Live Yield Data (Base, Feb 2026)
| Protocol | USDC APY | TVL | Risk |
|----------|---------|-----|------|
| AAVE V3 | 3.90% | $46.7M | Low |
| Gauntlet (Morpho) | 5.13% | $73.7M | Low |
| Moonwell | 5-11% | varies | Low-Med |
| Gains Network | 9.73% | $2.4M | Med |
| Avantis | 11.11% | $88.6M | Med |

### Integration Plan (PIVOTED: Generic ERC-4626 Vault Adapter)

Instead of Morpho-specific code, we build a **universal ERC-4626 vault adapter**.
Adding a new protocol = adding one entry to a vault registry. No new code needed.

**Architecture:**
```
lib/
├── vaults.ts              # Generic ERC-4626 adapter (deposit, redeem, positions)
├── vault-registry.ts      # Curated vault addresses: { slug: { name, address, token } }
├── hooks/useVault.ts      # useVaultPosition(), useVaultPositions()
```

**Implementation:**
1. **`/api/yields/route.ts`** ✅ Fetches DeFi Llama, filters Base, caches 5 min
2. **`lib/vaults.ts`** - Generic ERC-4626 deposit/withdraw/read (ONE implementation for ALL vaults)
3. **`lib/vault-registry.ts`** - Curated list of vault addresses on Base (start with Morpho, add more)
4. **`lib/hooks/useVault.ts`** - Position tracking across any registered vault
5. **AI tool: `scanYields`** ✅ Queries DeFi Llama API, returns sorted opportunities
6. **AI tool: `prepareVaultDeposit`** - Generic: takes vault slug + amount, returns tx data
7. **AI tool: `prepareVaultWithdraw`** - Generic: takes vault slug + amount
8. **ActionCard** - New `vault_deposit` / `vault_withdraw` branches (generic, works for any vault)
9. **Dashboard** - VaultPositions component showing all vault positions
10. **AI prompt** - Tier-specific behavior: Mid-Depth AI compares across protocols

**Vault Registry Pattern:**
```typescript
export const VAULT_REGISTRY = {
  'morpho-gauntlet-usdc': {
    name: 'Morpho Gauntlet USDC',
    protocol: 'morpho-v1',
    address: '0x...',
    underlyingToken: 'USDC',
    underlyingAddress: CONTRACTS.USDC,
    underlyingDecimals: 6,
  },
  // Adding a new vault = adding one entry here. No new code needed.
} as const;
```

**Why this is better for the demo:**
- "Tidal supports ANY ERC-4626 vault on Base"
- Adding a new protocol = one line of config
- Shows scalable architecture, not one-off integrations
- Same deposit UX regardless of protocol

### Mid-Depth AI Behavior
When user is Mid-Depth:
- AI scans yields via DeFi Llama before recommending
- Compares rates across all supported vault protocols in real-time
- Says: "I scanned 15 pools on Base. Morpho Gauntlet is offering 4.3% vs AAVE at 3.9%."
- Can execute deposits into any vault in the registry
- If swap needed: Li.Fi routes token first, then deposits to chosen vault

---

## Post-Hackathon Product Roadmap

### Current Phase
**Phase 0: Harden & Ship** (Feb 2026)

### Hackathon Recap (ETH Global HackMoney 2026)
Completed a working AI-powered DeFi yield manager on Base with:
- AI agent (Claude + Vercel AI SDK v6) with 7 tools for swaps, lending, vault deposits
- Risk-tiered UX (Shallows/Mid-Depth/Deep Water)
- Li.Fi as universal swap/routing layer
- AAVE V3 lending integration
- Generic ERC-4626 vault adapter (Morpho, YO Protocol — 10 curated vaults)
- DeFi Llama yield scanning across all Base protocols
- Deployed on Vercel, live on Base Mainnet

---

### Phase 0: Harden & Ship (Foundation)
*Everything else builds on a stable base.*

- [x] Add integration tests for AI tools (getQuote, prepareSupply, prepareVaultDeposit)
- [x] Add tests for ActionCard execution paths (swap, aave_supply, vault_deposit, swap+supply)
- [x] Create shared PortfolioContext — lift position data into single React context at dashboard layout
- [x] Replace 4s hardcoded post-tx delay with progressive polling (0s, 1s, 2.5s, 5s)
- [x] Add RPC fallback transport (Alchemy primary + public fallback via viem `fallback()`)
- [x] Security review of ActionCard approve→execute flow (added amount validation, 5-min quote expiry)
- [ ] Environment cleanup — proper secret management, no keys in .env.local

### Phase 1: Database + User Analytics
*Can't improve what you can't measure. Grants ask for traction numbers.*

- [ ] Add Postgres (Vercel Postgres or Supabase — free tier, managed)
- [ ] Schema: `users` (wallet, risk_depth, created_at)
- [ ] Schema: `transactions` (type, protocol, amount, tx_hash, chain, timestamp)
- [ ] Schema: `sessions` (chat_id, messages_count, tools_used)
- [ ] Schema: `yield_actions` (what AI recommended vs. what user did)
- [ ] Transaction history page — users see past actions, earnings, protocol
- [ ] Funnel analytics: landing → onboard → first chat → first tx → repeat tx
- [ ] Basic analytics integration (PostHog or Plausible)

### Phase 2: Yield Scanner Expansion + Deep Water Strategies
*More protocols, riskier strategies, fuller product.*

**Yield Scanner:**
- [ ] Expand DeFi Llama filtering to index Arbitrum, Optimism, Polygon, Ethereum mainnet
- [ ] Add protocol metadata: audit status, vault age, TVL trend, smart contract risk score
- [ ] Surface reward token APY separately from base APY
- [ ] Protocol-specific on-chain APY reads for accuracy (supplement DeFi Llama)

**Deep Water High-Risk Strategies:**
- [ ] Leveraged lending (Morpho loop: supply USDC → borrow ETH → supply ETH, 15-30% APY)
- [ ] LP positions (Aerodrome USDC/ETH concentrated liquidity, 20-80% APY)
- [ ] Yield farming (Aerodrome emissions + swap fees, 30-100%+ APY)
- [ ] Pendle yield tokenization (PT/YT strategies on Base)
- [ ] Recursive strategies (deposit → borrow → redeposit loops, 15-40% APY)
- [ ] AI explains risk in plain English before every Deep Water action

### Phase 3: True Cross-Chain Yield (EVM)
*Li.Fi goes from swap layer to bridge layer.*

- [ ] Remove `chain === "Base"` filter in DeFi Llama scanner — rank across all chains
- [ ] Break-even calculator: `bridge_cost / (target_apy - current_apy) * principal = days`
- [ ] Li.Fi bridge execution (cross-chain getQuote with `fromChainId !== toChainId`)
- [ ] Cross-chain position tracking via cron job + DB (Phase 1 dependency)
- [ ] Priority chains: Arbitrum (deep AAVE), Optimism (Sonne/Exactly), Polygon (high AAVE rates)
- [ ] Portfolio view across all chains

### Phase 3.5: Solana Expansion
*Extend Tidal from EVM-only to EVM + Solana via Li.Fi's native Solana support.*

**Why Solana:**
- Li.Fi already supports Solana (bridges via Mayan Swift/CCTP/WH + AllBridge, swaps via Jupiter)
- DeFi Llama yields API already covers Solana (`chain === "Solana"`)
- Privy supports embedded Solana wallets alongside EVM
- Major yield opportunities: Kamino Lend (1-8%), Jito (7-9% SOL), Marinade (6-8%)

**Li.Fi Solana Details:**
- Solana chain ID: `1151111081099710`
- Native SOL: `11111111111111111111111111111111` (System Program)
- Wrapped SOL: `So11111111111111111111111111111111111111112`
- Supported bridges: Mayan (Swift, CCTP, WH), AllBridge
- On-chain DEX: Jupiter (only Jupiter-verified tokens)
- Current limitation: single-step per ecosystem (bridge OR swap, not combined yet)

**Solana Protocol Equivalents:**

| EVM Protocol | Solana Equivalent | Typical APY | Notes |
|-------------|-------------------|-------------|-------|
| AAVE V3 | Kamino Lend | 1-8% USDC | $2.4B+ TVL, largest Solana lending |
| ERC-4626 Vaults | Marinade / Jito | 6-11% SOL | Liquid staking, no vault standard |
| Li.Fi Swaps | Jupiter (via Li.Fi) | — | Best-in-class Solana aggregator |
| Morpho Vaults | Drift / Marginfi | 3-15% | Points-boosted lending |

**EVM vs Solana Architecture Differences:**
- Addresses: `0x...` hex → base58 public keys
- Contracts: Solidity ABI → Anchor IDL
- Tokens: ERC-20 (approve + transfer) → SPL Token (no approve pattern)
- Vaults: ERC-4626 standard → no equivalent, each protocol has its own interface
- Accounts: single address → keypair + PDA (Program Derived Address) + ATA (Associated Token Account)

**Implementation (3 sub-phases):**

*3.5a: Chain Abstraction Foundation (2-3 weeks)*
- [ ] Design `IProtocol`, `IChain` abstract interfaces
- [ ] Refactor EVM code behind chain abstraction (`lib/chains/evm/`)
- [ ] Create `useMultiChain` hook wrapping EVM + Solana wallet state
- [ ] Keep all existing EVM functionality working

*3.5b: Solana Pilot (4-6 weeks)*
- [ ] Add `Solana()` provider to Li.Fi SDK config alongside `EVM()`
- [ ] Configure Privy embedded Solana wallet
- [ ] Implement Kamino Lend adapter (`lib/chains/solana/kamino.ts`)
- [ ] Add Jupiter swap integration via Li.Fi
- [ ] Single protocol, single token (USDC on Solana)
- [ ] Add `chain === "Solana"` filter to DeFi Llama yields route

*3.5c: Solana Expansion (2-3 weeks)*
- [ ] Add Marinade liquid staking adapter
- [ ] Expand tokens (SOL, USDT)
- [ ] Chain switcher in UI
- [ ] Cross-chain yield comparison: "5.1% on Solana Kamino vs 3.9% on Base AAVE"
- [ ] Li.Fi bridge execution: Base USDC → Solana USDC via Mayan

**Target Architecture:**
```
lib/chains/
├── evm/
│   ├── aave.ts           # Current AAVE V3
│   ├── vaults.ts         # Current ERC-4626
│   └── lifi.ts           # Current Li.Fi (EVM provider)
├── solana/
│   ├── kamino.ts         # Kamino Lend
│   ├── marinade.ts       # Marinade liquid staking
│   └── jupiter.ts        # Jupiter swaps (via Li.Fi)
└── protocols.ts          # IProtocol interface
```

**Grant Opportunities:**
- Solana Foundation grants (AI + DeFi on Solana)
- Marinade grants (driving mSOL deposits)
- Kamino grants (lending integration)

### Phase 4: Points System
*Gamification drives retention, creates token-launch optionality.*

- [ ] Points per transaction: `base_points * risk_multiplier * amount_tier`
  - Shallows deposit: 10 pts, Mid-Depth: 25 pts, Deep Water: 50 pts, Cross-chain: 100 pts
- [ ] Streak bonus: consecutive weekly activity multiplier
- [ ] Points ledger DB table (Phase 1 dependency): event type, amount, timestamp, wallet
- [ ] Points display in dashboard UI
- [ ] Optional leaderboard (wallet-based, pseudonymous)

### Phase 5: Lucid Agents + x402 (Agent-to-Agent Yield)
*Make Tidal's yield intelligence available to other AI agents as a paid API.*

**Concept**: Other AI agents (shopping, treasury, DAO agents) hold idle funds.
They pay Tidal's agent via x402 to find and execute yield strategies.

**Architecture:**
```
External AI Agent
    │ HTTP request + x402 payment header (USDC)
    ▼
Tidal x402 API (Next.js + lucid-agents middleware)
    ├── GET  /api/agent/yields    → scan yields ($0.01/call)
    ├── POST /api/agent/recommend → AI recommendation ($0.05/call)
    └── POST /api/agent/execute   → prepare tx data ($0.10/call)
    ▼
Returns signed transaction data or yield recommendations
```

- [ ] Integrate lucid-agents SDK (Next.js adapter — drops into existing app)
- [ ] x402 paywall middleware on agent API routes
- [ ] ERC-8004 for on-chain agent identity
- [ ] `/api/agent/yields` — yield scanning endpoint (paginated, filterable)
- [ ] `/api/agent/recommend` — AI-powered recommendation with risk assessment
- [ ] `/api/agent/execute` — transaction preparation for external agents
- [ ] USDC on Base as payment token (native chain alignment)
- [ ] Usage tracking + revenue dashboard

**Reference**: https://github.com/daydreamsai/lucid-agents

### Phase 6: Auto-Rebalancing Agent
*The feature that makes Tidal truly autonomous.*

- [ ] Scheduled yield scans (Vercel Cron or dedicated worker)
- [ ] Alert when APY delta > configurable threshold
- [ ] Notification delivery (Telegram bot, email, or in-app)
- [ ] One-click approval → agent executes rebalance
- [ ] Cross-chain rebalancing (Phase 3 dependency)

---

### Phase Dependency Graph

```
Phase 0 (Harden)
    │
    ▼
Phase 1 (Database) ──────────────────┐
    │                                 │
    ├──► Phase 2 (Yield Scanner)      │
    │        │                        │
    │        ▼                        ▼
    ├──► Phase 3 (Cross-Chain EVM)  Phase 4 (Points)
    │        │
    │        ▼
    ├──► Phase 3.5 (Solana Expansion)
    │        │
    │        ▼
    ├──► Phase 5 (x402 Agent API)
    │
    └──► Phase 6 (Auto-Rebalance)
```

### Grant Targets

| Program | Fit | Angle |
|---------|-----|-------|
| **Li.Fi Ecosystem Grants** | Strong | Cross-chain routing as invisible yield layer |
| **Base Builder Grants** | Strong | Onboarding mainstream users to Base DeFi via AI |
| **Morpho Grants** | Good | Driving deposits into Morpho vaults via AI recommendations |
| **Coinbase Developer Grants** | Good | x402 + Smart Wallet + Base full stack |
| **Cloudflare x402 Foundation** | Good | x402 agent API demonstrates the payment standard |
| **Solana Foundation** | Good | AI-first DeFi on Solana via Kamino + Jupiter |
| **Optimism RPGF** | Future | Cross-chain yield benefits the Superchain ecosystem |

### Competitive Positioning
- **vs Yearn/Beefy**: Those are vaults. Tidal is the *advisor* layer routing users to the right vault.
- **vs Zapper/DeBank**: They show data. Tidal *acts* on it.
- **vs TradFi robo-advisors**: Tidal brings that UX to DeFi with on-chain execution.
- **Moat**: AI personalization (risk tiers) + universal vault adapter + Li.Fi routing + x402 agent API

### Lessons Learned (Battle-Tested)

**AI SDK v6**
- `toUIMessageStreamResponse()` not `toDataStreamResponse()` — the v6 migration renamed this
- `convertToModelMessages()` is ASYNC — must `await` it! Silent failure if you don't
- Tool results with `type: 'tool-result'` parts need careful handling in message display

**Privy + Wagmi**
- Import `createConfig` and `WagmiProvider` from `@privy-io/wagmi`, NOT from `wagmi`
- Wallet client can be undefined on first render — guard all `walletClient.writeContract` calls
- `useWalletClient()` returns `{ data: walletClient }` — destructure correctly
- Smart Wallets may need gas sponsorship setup for UX

**ERC-4626 Vaults**
- Standard interface: `deposit(assets, receiver)`, `redeem(shares, receiver, owner)`, `balanceOf`, `convertToAssets`
- Works identically for Morpho MetaMorpho AND YO Protocol — truly universal
- Adding a new protocol = one registry entry, zero adapter code
- Always check `allowance` before deposit — ERC-20 approve is a separate tx
- Use `useReadContracts` (wagmi multicall) to batch-read all vault balances efficiently

**RPC & Caching**
- Free public RPC (`mainnet.base.org`) rate-limits at ~10-15 req/sec — use Alchemy free tier instead
- AAVE rates API route has 5-min in-memory cache (same pattern as DeFi Llama yields route)
- Multiple components calling the same wagmi hooks = duplicate RPC calls — consolidate into shared context post-hackathon (see Phase 6)

**Position Tracking**
- Executing transactions != displaying positions — these are separate data flows
- After tx success, you must explicitly refetch position data (wagmi doesn't auto-refetch)
- Use wagmi multicall (`useReadContracts`) for reading multiple vault positions in one RPC call

**React / Next.js**
- `useState(null)` + localStorage read in `useEffect` = double-render on hydration — guard dependent effects with `isLoaded`
- `flex-1 overflow-y-auto` needs `min-h-0` on the flex child to actually scroll
- Dynamic imports with `ssr: false` fix hydration mismatches for wallet-dependent components
- React hooks can't be called in loops — use `useReadContracts` (multicall) instead of mapping over `useReadContract`

**DeFi Llama API**
- Free, no auth: `GET https://yields.llama.fi/pools` — ~10-15MB response, cache 5-10 min
- Filter: `chain === "Base"`, `apy > 0 && apy < 100`, `tvlUsd > 100_000`
- Risk mapping: `exposure === "single" && ilRisk === "no"` = safe for Shallows/Mid-Depth
- Protocol deduplication collapses all Morpho vaults into one — use vault registry for sidebar, not DeFi Llama

**UI/UX Patterns**
- Tier-exclusive display prevents confusion (Shallows ≠ Mid-Depth, no repeats)
- "Scouted by Tidal" section should appear FIRST in Mid-Depth as the hook (higher yields catch the eye)
- Limit shown vaults to top 3 + "+N more" to prevent scroll fatigue
- Always show protocol name alongside token in position cards (user has USDC in multiple places)
