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
| Lending | AAVE V3 (Shallows), Morpho Blue Vaults (Mid-Depth) |
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
├── morpho.ts               # Morpho Blue vault integration (ERC-4626)
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

### Integration Plan
1. **`/api/yields/route.ts`** - Fetches DeFi Llama, filters Base, caches 5 min
2. **`lib/morpho.ts`** - ERC-4626 deposit/withdraw helpers
3. **`lib/hooks/useMorpho.ts`** - Position tracking + vault rates
4. **AI tool: `scanYields`** - Queries DeFi Llama API, returns sorted opportunities
5. **AI tool: `prepareMorphoDeposit`** - Returns tx data for Morpho vault deposit
6. **AI tool: `prepareMorphoWithdraw`** - Returns tx data for vault withdrawal
7. **ActionCard** - New `morpho_deposit` / `morpho_withdraw` action branches
8. **Dashboard** - MorphoPositions component alongside AavePositions
9. **AI prompt** - Tier-specific behavior: Mid-Depth AI proactively compares across protocols

### Mid-Depth AI Behavior
When user is Mid-Depth:
- AI scans yields via DeFi Llama before recommending
- Compares AAVE vs Morpho rates in real-time
- Says: "I found 7.8% on Morpho vs 3.9% on AAVE. Morpho vault has $73M TVL and is audited."
- Recommends Morpho for higher yield, AAVE for maximum safety
- If swap needed: Li.Fi routes token first, then deposits to chosen protocol

---

## Scratchpad

### Current Phase
**Phase 5: Final Sprint** (Feb 2-11, 2026)

### Completed

**Foundation & Auth**
- [x] Next.js 16 + React 19 + Tailwind v4
- [x] 3-panel layout (sidebar, chat, dashboard)
- [x] Dark ocean theme with bioluminescent accents
- [x] Landing page → Onboard → Dashboard flow
- [x] Privy + Coinbase Smart Wallet integration
- [x] Risk depth selection (Shallows/Mid-Depth/Deep Water)

**Li.Fi Integration**
- [x] Li.Fi SDK wrapper (lib/lifi.ts)
- [x] Li.Fi API routes (/api/lifi/quote, /api/lifi/routes)
- [x] useLifiSwap hook
- [x] RouteDisplay and SwapPreview components
- [x] getQuote tool calls real Li.Fi API

**AAVE Integration**
- [x] AAVE V3 ABIs and helpers (lib/aave.ts)
- [x] useAave hooks (currently mock data)
- [x] Dashboard components (AavePositions, YieldRates)

**AI Chat**
- [x] AI tools: getQuote, getAaveRates, prepareSupply, prepareWithdraw, prepareSwapAndSupply
- [x] Chat API with streaming (/api/chat)
- [x] AI SDK v6.0.65 integration (toUIMessageStreamResponse)
- [x] ChatPanel with message parts handling
- [x] ActionCard for tool approval UI
- [x] Fixed hydration errors (dynamic imports with ssr:false)
- [x] Fixed scroll behavior
- [x] **CRITICAL FIX**: `await convertToModelMessages()` in chat API (async function!)
- [x] **FIX**: Privy/wagmi integration - must use `@privy-io/wagmi` exports for createConfig and WagmiProvider

---

## 🚀 FINAL SPRINT PLAN (Feb 2-11)

### Phase 1: Core Execution (Days 1-3) — Feb 2-4

**Day 1 (Feb 2) - Li.Fi Transaction Execution** ✅
- [x] Wire ActionCard "Approve" to wagmi sendTransaction
- [x] Build transaction from Li.Fi quote data
- [x] Add pending/success/error states to ActionCard
- [ ] **TEST:** Execute $1 USDC→ETH swap on Base mainnet

**Day 2 (Feb 3) - AAVE Real Data** ✅
- [x] Fix AAVE contract addresses for Base mainnet
- [x] Wire /api/aave/rates to read real APYs from contracts
- [x] AI tools fetch live rates from API
- [ ] **TEST:** See real AAVE rates in dashboard

**Day 3 (Feb 4) - AAVE Supply/Withdraw** ✅
- [x] Wire prepareSupply tool to return real tx data
- [x] ActionCard executes AAVE supply via wagmi
- [x] Handle token approval flow (ERC20 approve)
- [ ] **TEST:** Supply $5 USDC to AAVE, verify position appears

### Phase 2: Li.Fi Polish (Days 4-5) — Feb 5-6

**Day 4 (Feb 5) - Li.Fi Branding** ✅
- [x] Add "Powered by Li.Fi" badge to quote cards
- [x] New LifiQuoteCard component with animated route, DEX badge, stats
- [x] Show LifiQuoteCard in chat for every swap quote
- [x] Display DEX/aggregator used in route
- [x] Li.Fi pill badge on ActionCard swap header
- [x] Route visualization with animated dotted path in ActionCard
- [x] AAVE rates card polished with Li.Fi cross-sell footer
- [x] AI prompt updated to always mention Li.Fi when routing
- [ ] **TEST:** Screenshot-ready UI with Li.Fi attribution

**Day 5 (Feb 6) - Mid-Depth: DeFi Llama + AI Yield Scanner**
- [ ] Create `/api/yields/route.ts` - fetch DeFi Llama, filter Base, cache 5 min
- [ ] Create `scanYields` AI tool - queries API, returns sorted opportunities by risk tier
- [ ] Update AI prompt with tier-specific behavior (Shallows=AAVE only, Mid-Depth=compare protocols)
- [ ] Update welcome message per tier
- [ ] **TEST:** Ask "What are the best USDC yields?" and see multi-protocol comparison

**Day 6 (Feb 7) - Mid-Depth: Morpho Vault Integration**
- [ ] Create `lib/morpho.ts` - ERC-4626 deposit/withdraw/position helpers
- [ ] Create `lib/hooks/useMorpho.ts` - vault position + rate hooks
- [ ] Create `prepareMorphoDeposit` / `prepareMorphoWithdraw` AI tools
- [ ] Add `morpho_deposit` / `morpho_withdraw` branches to ActionCard
- [ ] **TEST:** Supply USDC to Morpho vault via chat, verify position

**Day 7 (Feb 8) - Dashboard + Tier Differentiation Polish**
- [ ] MorphoPositions component alongside AavePositions in dashboard
- [ ] YieldRates component shows tier-relevant rates (Shallows=AAVE, Mid-Depth=AAVE+Morpho)
- [ ] Update onboarding examples to match real strategies (Morpho vaults, not "LP positions")
- [ ] **TEST:** Switch tiers, verify dashboard and AI behavior changes

### Previously Completed (done early)

**Swap+Supply Combo** ✅
- [x] prepareSwapAndSupply returns real Li.Fi quote + live AAVE APY
- [x] ActionCard executes 2-step flow: Li.Fi swap → AAVE supply
- [x] Step progress indicators with active/completed states

**Error Handling** ✅
- [x] Friendly error messages (insufficient balance, rejected tx, slippage, network)
- [x] Retry button on failures
- [x] Generic tool results hidden from chat (AI explains instead)

### Phase 4: Demo Polish (Days 8-9) — Feb 9-10

**Day 8 (Feb 9) - Demo Script**
- [ ] Write exact 3-minute demo script (show BOTH tiers!)
- [ ] Pre-fund wallet with demo amounts
- [ ] Test full flow 3 times
- [ ] **TEST:** Record practice run

**Day 9 (Feb 10) - Final Polish**
- [ ] Landing page polish for demo
- [ ] UI tweaks and animations
- [ ] Loading state improvements
- [ ] Copy refinement (ocean metaphors)
- [ ] **TEST:** Full demo with teammate

### Day 10 (Feb 11) - DEADLINE
- [ ] Morning: Final test on fresh browser
- [ ] Submit project
- [ ] Record backup demo video

---

## 🎬 Demo Golden Path (3 minutes)

```
[0:00] Landing "/" → Click "Dive In" → Privy login
[0:15] Onboard → Select "Shallows" → Dashboard loads
[0:25] Chat: "What can I earn on my USDC?"
[0:35] AI shows AAVE at 3.9% → "Calm waters, steady returns"
[0:50] Chat: "Supply 20 USDC to AAVE"
[1:00] ActionCard → Approve → Transaction executes
[1:15] Position appears in dashboard. "Now let me show you Mid-Depth..."
[1:20] Switch to Mid-Depth tier (settings or onboard again)
[1:30] Chat: "What are the best USDC yields right now?"
[1:40] AI scans DeFi Llama → "I found Morpho at 7.8% vs AAVE at 3.9%"
[1:55] Chat: "Move my USDC to the higher yield"
[2:05] AI: "Routing via Li.Fi + depositing to Morpho vault" → ActionCard
[2:15] Approve → Transaction executes → Morpho position in dashboard
[2:30] Recap: "Two tiers, AI finds best yield, Li.Fi routes, one click"
[2:45] Wrap: "Tidal - AI-powered DeFi for everyone"
```

---

## Li.Fi Prize Requirements

| Requirement | Status | Action |
|-------------|--------|--------|
| Real Li.Fi transactions | ✅ ActionCard executes swaps | Needs mainnet test |
| Li.Fi attribution visible | ✅ LifiQuoteCard, ActionCard badges, AAVE cross-sell | Done |
| Route visualization | ✅ Animated route paths, DEX badges, stats | Done |
| Novel use case | ✅ AI-first DeFi | - |

---

### Blockers
(none)

### Notes
- **NOW ON BASE MAINNET** - Budget: $20-50 USDC for testing
- Deadline: Feb 11, 2026
- AI SDK v6.0.65 uses toUIMessageStreamResponse() not toDataStreamResponse()
- **AI SDK v6 Pattern**: `convertToModelMessages()` is ASYNC - must `await` it!
- **Privy/wagmi**: Import `createConfig` and `WagmiProvider` from `@privy-io/wagmi`, NOT from `wagmi`
- Dashboard uses real AAVE data (positions + APY) - no more hardcoded values
- **Morpho vaults are ERC-4626** - standard interface: `deposit(assets, receiver)`, `redeem(shares, receiver, owner)`
- **DeFi Llama API** is free, no auth: `GET https://yields.llama.fi/pools` - cache 5-10 min, filter `chain === "Base"`
- **Mid-Depth differentiator**: AI scans yields across protocols, recommends Morpho when APY > AAVE
