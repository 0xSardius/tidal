# Tidal Architecture Overview

**Last Updated**: Feb 1, 2026
**Status**: Phase 5 - Integration & Polish
**Target**: ETH Global HackMoney 2026 - Li.Fi Prize ($5-10K)

---

## User Flow

```
Landing (/)              Onboard (/onboard)           Dashboard (/dashboard)
┌──────────┐             ┌──────────────┐             ┌──────────────────┐
│          │   Login     │  Choose Risk │   Select    │                  │
│ "Dive In"│ ──────────► │    Depth     │ ──────────► │  3-Panel App     │
│   CTA    │   (Privy)   │              │             │                  │
└──────────┘             │ • Shallows   │             └──────────────────┘
                         │ • Mid-Depth  │
                         │ • Deep Water │
                         └──────────────┘
```

**Risk Depths** control which strategies the AI recommends:
- **Shallows**: Stablecoin only (USDC, DAI in AAVE) - 3-5% APY
- **Mid-Depth**: + ETH strategies - 5-10% APY
- **Deep Water**: + Multi-step, leveraged - 10-20%+ APY

---

## Dashboard Layout (3-Panel)

```
┌─────────────┬────────────────────────────┬─────────────────────┐
│   SIDEBAR   │         CHAT PANEL         │   PORTFOLIO PANEL   │
│   (260px)   │         (flexible)         │      (320px)        │
│             │                            │                     │
│  PoolList   │  ┌──────────────────────┐  │  YieldRates         │
│  - Wallet   │  │  Welcome Message     │  │  - USDC: 3.5% APY   │
│    status   │  │  from Tidal AI       │  │  - WETH: 2.1% APY   │
│  - Connect  │  └──────────────────────┘  │                     │
│    button   │                            │  AavePositions      │
│             │  ┌──────────────────────┐  │  - Your deposits    │
│             │  │  User: "Swap 100     │  │  - Earned interest  │
│             │  │  USDC to ETH"        │  │                     │
│             │  └──────────────────────┘  │                     │
│             │                            │                     │
│             │  ┌──────────────────────┐  │                     │
│             │  │  AI Response +       │  │                     │
│             │  │  Li.Fi Quote Card    │  │                     │
│             │  │  ┌────────────────┐  │  │                     │
│             │  │  │ ActionCard     │  │  │                     │
│             │  │  │ [Approve][Deny]│  │  │                     │
│             │  │  └────────────────┘  │  │                     │
│             │  └──────────────────────┘  │                     │
│             │                            │                     │
│             │  ┌──────────────────────┐  │                     │
│             │  │  [Message input...]  │  │                     │
│             │  └──────────────────────┘  │                     │
└─────────────┴────────────────────────────┴─────────────────────┘
```

---

## Data Flow: Chat → Action

```
1. USER INPUT
   ┌──────────────────────────────────────────────────────────────────┐
   │ ChatPanel.tsx                                                     │
   │   sendMessage({ content: "Swap 100 USDC to ETH", data: {context}})│
   │   context = { walletAddress, riskDepth, positions }               │
   └─────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
2. API ROUTE
   ┌──────────────────────────────────────────────────────────────────┐
   │ /api/chat/route.ts                                                │
   │   - Builds system prompt based on risk depth                      │
   │   - Calls Claude with tools: getQuote, prepareSupply, etc.        │
   │   - Passes wallet context via experimental_context                │
   │   - Returns streaming response                                    │
   └─────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
3. AI TOOLS (lib/ai/tools.ts)
   ┌──────────────────────────────────────────────────────────────────┐
   │ getQuoteTool              │ prepareSupplyTool                     │
   │   - Calls Li.Fi API       │   - Returns tx details for AAVE      │
   │   - Returns rate, route   │                                      │
   ├───────────────────────────┼──────────────────────────────────────┤
   │ getAaveRatesTool          │ prepareSwapAndSupplyTool             │
   │   - Returns current APYs  │   - Multi-step: swap → supply        │
   └─────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
4. PROTOCOL INTEGRATIONS
   ┌─────────────────────────┐  ┌─────────────────────────────────────┐
   │ lib/lifi.ts             │  │ lib/aave.ts                         │
   │   - getSwapQuote()      │  │   - prepareSupplyTx()               │
   │   - getSwapRoutes()     │  │   - prepareWithdrawTx()             │
   │   - executeSwapRoute()  │  │   - getPoolReserveData()            │
   │                         │  │                                     │
   │  Li.Fi SDK (real API)   │  │  AAVE V3 Contracts (Base)           │
   └─────────────────────────┘  └─────────────────────────────────────┘
```

---

## File Structure

```
tidal/
├── app/
│   ├── layout.tsx                 # Root layout + PrivyProvider
│   ├── page.tsx                   # Landing page ("Dive In")
│   ├── (auth)/
│   │   └── onboard/page.tsx       # Risk depth selection
│   ├── (app)/
│   │   ├── layout.tsx             # 3-panel layout shell
│   │   └── dashboard/page.tsx     # Main dashboard (renders ChatPanel)
│   └── api/
│       ├── chat/route.ts          # AI chat endpoint (Claude + tools)
│       ├── aave/rates/route.ts    # AAVE APY rates
│       └── lifi/
│           ├── quote/route.ts     # Li.Fi quote API
│           └── routes/route.ts    # Li.Fi routes API
│
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx          # Main chat UI (useChat hook)
│   │   └── ActionCard.tsx         # Transaction approval cards
│   ├── dashboard/
│   │   ├── PortfolioPanel.tsx     # Portfolio overview
│   │   ├── PortfolioPanelWrapper.tsx
│   │   ├── AavePositions.tsx      # User's AAVE deposits
│   │   └── YieldRates.tsx         # Current APY display
│   ├── sidebar/
│   │   └── PoolList.tsx           # Left sidebar + wallet UI
│   ├── swap/
│   │   ├── RouteDisplay.tsx       # Li.Fi route visualization
│   │   └── SwapPreview.tsx        # Swap confirmation UI
│   └── providers/
│       └── PrivyProvider.tsx      # Auth + wagmi providers
│
├── lib/
│   ├── ai/
│   │   ├── tools.ts               # AI tool definitions
│   │   └── prompts.ts             # System prompt builder
│   ├── hooks/
│   │   ├── useWallet.ts           # Wallet state + balances
│   │   ├── useRiskDepth.ts        # Risk preference (localStorage)
│   │   ├── useAave.ts             # AAVE positions + actions
│   │   └── useLifiSwap.ts         # Swap execution
│   ├── lifi.ts                    # Li.Fi SDK wrapper
│   ├── aave.ts                    # AAVE contract helpers
│   ├── strategies.ts              # Yield strategy registry
│   ├── constants.ts               # Addresses, ABIs, configs
│   └── wagmi.ts                   # Wagmi config
│
├── CLAUDE.md                      # AI assistant instructions
└── ARCHITECTURE.md                # This file
```

---

## Key Files by Function

| Layer | File | Purpose |
|-------|------|---------|
| **Providers** | `components/providers/PrivyProvider.tsx` | Wallet auth + wagmi context |
| **Hooks** | `lib/hooks/useWallet.ts` | Wallet state, balances |
| | `lib/hooks/useRiskDepth.ts` | Risk preference (localStorage) |
| | `lib/hooks/useAave.ts` | AAVE positions, supply/withdraw |
| | `lib/hooks/useLifiSwap.ts` | Swap execution |
| **AI** | `lib/ai/tools.ts` | Tool definitions for Claude |
| | `lib/ai/prompts.ts` | System prompt builder |
| **Protocols** | `lib/lifi.ts` | Li.Fi SDK wrapper |
| | `lib/aave.ts` | AAVE contract helpers |
| **API** | `app/api/chat/route.ts` | Chat streaming endpoint |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS v4 |
| Auth/Wallet | Privy + Coinbase Smart Wallet |
| Blockchain | wagmi v3, viem |
| AI | Vercel AI SDK v6, Claude (Anthropic) |
| DEX Aggregator | Li.Fi SDK |
| Lending | AAVE V3 |
| Chain | Base Sepolia (dev) / Base Mainnet (demo) |

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Landing → Onboard → Dashboard | ✅ Complete | Full auth flow works |
| Chat UI with streaming | ✅ Complete | AI SDK v6 patterns |
| Li.Fi quotes | ✅ Working | Real API on Base mainnet |
| AAVE rates display | ⚠️ Mock data | Contract reads not wired |
| Transaction execution | ❌ Not wired | ActionCard logs to console |
| Li.Fi branding | ❌ Missing | Need "Powered by Li.Fi" badge |

---

## Demo Requirements (Li.Fi Prize)

### Must Have
1. **Real Li.Fi transactions** - At least one swap executed on mainnet
2. **Li.Fi attribution** - "Powered by Li.Fi" visible in UI
3. **Route visualization** - Show which DEXs Li.Fi aggregates

### Nice to Have
- Cross-chain swap demo (Li.Fi's strength)
- Multi-route comparison
- Gas optimization messaging

### Budget Needed
- ~$20-50 in ETH/USDC on Base mainnet
- Gas on Base is cheap (~$0.01-0.05 per tx)

---

## Remaining Work

### Priority 1: Transaction Execution
Wire `ActionCard.tsx` "Approve" button to:
1. Call wagmi `sendTransaction`
2. Show pending/success states
3. Update portfolio after confirmation

### Priority 2: Li.Fi Branding
- Add "Routed via Li.Fi" badge to quote cards
- Show RouteDisplay component in chat

### Priority 3: Real AAVE Data
- Wire `useAave.ts` to read from contracts
- Show actual user positions

---

## Quick Commands

```bash
# Development
npm run dev          # Start on localhost:3000

# Build
npm run build        # Production build
npm run lint         # ESLint check

# Test Li.Fi integration (curl)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Get quote for 100 USDC to ETH"}],"data":{"context":{"walletAddress":"0x...","chainId":8453}}}'
```

---

## Team Notes

- **Deadline**: Feb 10, 2026
- **Team Size**: 2 people
- **Prize Target**: Li.Fi ($5-10K)
- **Demo Length**: 3 minutes (golden path: chat → recommendation → execute)
