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
Phase 1: Foundation (Days 1-2)

### Completed
- [x] Project initialized with Next.js 16
- [x] CLAUDE.md created with build plan
- [x] Core deps installed (Privy, wagmi, viem, @lifi/sdk, ai, @ai-sdk/anthropic)
- [x] Environment config (.env.example, .env.local)
- [x] 3-panel layout shell (sidebar, chat, dashboard)
- [x] Dark ocean theme with bioluminescent accents
- [x] Landing page with "Dive In" CTA
- [x] Privy + Coinbase Smart Wallet integration
- [x] useWallet hook with SSR handling
- [x] Wallet connection UI in sidebar
- [x] Risk depth selection screen (/onboard)
- [x] useRiskDepth hook for preference storage
- [x] Auth flow: landing → onboard → dashboard
- [x] Li.Fi SDK wrapper (lib/lifi.ts)
- [x] Li.Fi API routes (/api/lifi/quote, /api/lifi/routes)
- [x] useLifiSwap hook for React integration
- [x] RouteDisplay and SwapPreview components

### In Progress
- [ ] Build yield strategies registry (lib/strategies.ts)

### Up Next
- [ ] Phase 3: AAVE integration (Days 5-6)
- [ ] Phase 4: AI Agent with Li.Fi + AAVE tools (Days 7-8)

### Blockers
(none)

### Notes
- Mainnet budget: $20-50 for demo transactions
- Team: 2 people
- Deadline: Feb 10, 2026
- Build passes, routes: `/` (landing), `/dashboard` (3-panel app)
