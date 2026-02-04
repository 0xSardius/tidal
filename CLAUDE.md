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
| Lending | AAVE V3 |
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
    └── lifi/               # Li.Fi quote/route endpoints

components/
├── chat/                   # ChatPanel, Message, ActionCard
├── dashboard/              # PortfolioPanel, PositionCard
├── sidebar/                # PoolList, PoolItem
└── swap/                   # SwapPreview, RouteDisplay

lib/
├── lifi.ts                 # Li.Fi SDK wrapper
├── aave.ts                 # AAVE integration
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

| Tier | Yield Strategies | Accepted Tokens | Li.Fi Role |
|------|-----------------|-----------------|------------|
| Shallows | AAVE USDC, AAVE DAI | USDC, DAI, ETH* | Swap ETH→stable first |
| Mid-Depth | Above + AAVE ETH/WETH | USDC, DAI, ETH | Swap between any |
| Deep Water | Above + multi-step | All supported | Complex routing |

*Example: Shallows user with ETH → Li.Fi swaps ETH→USDC → AAVE supply

### Agent Behavior:
- ALWAYS mention Li.Fi when routing: "Routing via Li.Fi across 5 DEXs for 0.3% better rate"
- Show RouteDisplay component for every swap
- Explain WHY this route was chosen

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

**Day 4 (Feb 5) - Li.Fi Branding**
- [ ] Add "Powered by Li.Fi" badge to quote cards
- [ ] Show RouteDisplay in chat for every swap quote
- [ ] Display DEX/aggregator used in route
- [ ] **TEST:** Screenshot-ready UI with Li.Fi attribution

**Day 5 (Feb 6) - Route Visualization**
- [ ] Show multi-hop routes visually
- [ ] Display gas estimates prominently
- [ ] Show rate comparison vs direct swap
- [ ] **TEST:** Ask for quote, see full route breakdown

### Phase 3: Integration & Flow (Days 6-7) — Feb 7-8

**Day 6 (Feb 7) - Swap+Supply Combo**
- [ ] prepareSwapAndSupply executes real 2-step flow
- [ ] Li.Fi swap → AAVE supply as single user action
- [ ] Show progress through both steps
- [ ] **TEST:** "Swap ETH to USDC and supply to AAVE" works

**Day 7 (Feb 8) - Error Handling**
- [ ] Insufficient balance messaging
- [ ] Rejected transaction handling
- [ ] Network/RPC error recovery
- [ ] Slippage warnings
- [ ] **TEST:** Intentionally trigger failures, verify graceful handling

### Phase 4: Demo Polish (Days 8-9) — Feb 9-10

**Day 8 (Feb 9) - Demo Script**
- [ ] Write exact 3-minute demo script
- [ ] Pre-fund wallet with demo amounts
- [ ] Test full flow 3 times
- [ ] **TEST:** Record practice run

**Day 9 (Feb 10) - Final Polish**
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
[0:20] Onboard → Select "Shallows" (conservative)
[0:35] Dashboard loads → Welcome message from Tidal
[0:45] Chat: "What can I earn on my USDC?"
[1:00] AI shows AAVE rates with live APY data
[1:15] Chat: "Get a quote for swapping 10 USDC to ETH"
[1:30] Li.Fi quote appears with route visualization + branding
[1:45] Chat: "Supply 20 USDC to AAVE"
[2:00] ActionCard appears → Click Approve → Transaction executes
[2:30] Portfolio updates showing position + projected yield
[2:45] Wrap: "Tidal - AI-powered DeFi for everyone"
```

---

## Li.Fi Prize Requirements

| Requirement | Status | Action |
|-------------|--------|--------|
| Real Li.Fi transactions | ✅ ActionCard executes swaps | Needs mainnet test |
| Li.Fi attribution visible | ⚠️ "Powered by Li.Fi" in ActionCard | Day 4: Add badges |
| Route visualization | ⚠️ Component exists, unused | Day 4-5: Show in chat |
| Novel use case | ✅ AI-first DeFi | - |

---

### Blockers
(none)

### Notes
- Mainnet budget: $20-50 USDC on Base
- Deadline: Feb 11, 2026
- AI SDK v6.0.65 uses toUIMessageStreamResponse() not toDataStreamResponse()
- **AI SDK v6 Pattern**: `convertToModelMessages()` is ASYNC - must `await` it!
- **Privy/wagmi**: Import `createConfig` and `WagmiProvider` from `@privy-io/wagmi`, NOT from `wagmi`
