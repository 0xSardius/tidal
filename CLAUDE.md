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

**DeFi Llama Yield Scanner (Mid-Depth)**
- [x] /api/yields route - DeFi Llama fetch, Base filter, 5-min cache, risk assessment
- [x] scanYields AI tool - compares yields across protocols per tier
- [x] Tier-specific AI prompt (Shallows=AAVE only, Mid-Depth=multi-protocol scan)
- [x] Tier-specific welcome messages with ocean metaphors (client + server)
- [x] Verified: Shallows returns AAVE only (3.91%), Mid-Depth unlocks Morpho + others (up to 20% APY)
- [x] Sidebar StrategyCards component with live DeFi Llama APYs, protocol icons, "Best Rate" badge
- [x] Click-to-chat: strategy cards dispatch messages to AI via custom event
- [x] Risk assessment fix: AAVE = level 1 (Shallows), Morpho + others = level 2 (Mid-Depth)
- [x] Tier switcher dropdown in sidebar (click "Your Depth" card to switch tiers)
- [x] Shallows unlock hint ("Unlock more strategies at Mid-Depth")

**AI Chat**
- [x] AI tools: getQuote, getAaveRates, scanYields, prepareSupply, prepareWithdraw, prepareSwapAndSupply
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

**Day 5 (Feb 6) - Mid-Depth: DeFi Llama + AI Yield Scanner** ✅
- [x] Create `/api/yields/route.ts` - fetch DeFi Llama, filter Base, cache 5 min
- [x] Create `scanYields` AI tool - queries API, returns sorted opportunities by risk tier
- [x] Update AI prompt with tier-specific behavior (Shallows=AAVE only, Mid-Depth=compare protocols)
- [x] Update welcome messages per tier (client + server)
- [x] Sidebar StrategyCards with live APYs, protocol pinning, Supported badges
- [x] Tier switcher dropdown in sidebar
- [x] Risk assessment: AAVE=Shallows only, Morpho+=Mid-Depth
- [ ] **TEST:** Switch to Mid-Depth, see multi-protocol yield comparison

**Day 6 (Feb 7) - Generic ERC-4626 Vault Adapter** ✅
- [x] Create `lib/vault-registry.ts` - 10 curated vaults (2 Shallows, 8 Mid-Depth)
- [x] Create `lib/vaults.ts` - generic ERC-4626 deposit/withdraw/position helpers
- [x] Create `prepareVaultDeposit` / `prepareVaultWithdraw` AI tools (generic)
- [x] Add `vault_deposit` / `vault_withdraw` branches to ActionCard
- [x] Restructured tiers: conservative Morpho → Shallows, reward-boosted → Mid-Depth
- [x] Successfully deposited into Morpho vault via chat
- [x] **TEST:** Deposit USDC to Morpho vault via chat ✅

**Day 7 (Feb 8) - YO Protocol + Sidebar Polish** ✅
- [x] Discovered YO Protocol (Coinbase Ventures, ERC-4626, 8.6% USDC APY)
- [x] Added YO vaults to registry — zero new adapter code needed
- [x] "Scouted by Tidal" discovery section for DeFi Llama high-yield protocols
- [x] Tier-exclusive sidebar (Shallows ≠ Mid-Depth, no repeats)
- [x] APY estimates on all sidebar cards
- [x] Fixed sidebar scroll overflow
- [x] Fixed scouted pools disappearing on tier switch (double-render guard)
- [x] **TEST:** Switch to Mid-Depth, see YO at 8.6% + scouted protocols ✅

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
