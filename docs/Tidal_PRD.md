# Tidal: Product Requirements Document

**Version:** 1.0  
**Date:** January 27, 2026  
**Hackathon:** ETHGlobal HackMoney 2026 (Jan 30 - Feb 10)  
**Team:** [Your Names]  
**Status:** Draft - Pending Partner Approval

---

## Executive Summary

**Tidal** is an AI-powered DeFi yield management dashboard that makes decentralized finance as accessible as starting a chat. Like a tidal pool - a self-contained ecosystem shaped by the greater ocean - Tidal helps users create and manage their own yield ecosystems, with an AI agent that navigates the ever-changing currents of DeFi.

### One-Liner
> "Your AI-managed tidal pool in the DeFi ocean."

### The Metaphor
Tidal pools are fascinating ecosystems - isolated yet connected to the vast ocean, teeming with life, constantly refreshed by the tides. Your DeFi portfolio works the same way:

- **Your tidal pool** = Your yield strategies and positions
- **The ocean** = The broader crypto market and DeFi ecosystem  
- **The tides** = Market movements, APY shifts, opportunities flowing in and out
- **Your AI tidekeeer** = Tidal's agent, managing your pool so you don't have to

### Core Value Proposition
- **For DeFi-curious users** who find yield farming intimidating
- **Tidal** eliminates complexity by providing an AI agent that explains, recommends, and executes yield strategies
- **Unlike** traditional yield aggregators (set-and-forget) or DeFi dashboards (information overload)
- **Tidal** offers conversational strategy management where every action is explained and every decision is transparent

---

## Problem Statement

### The Current State
1. **DeFi yields are attractive** - 3-15% APY on stablecoins vs <1% in traditional savings
2. **But the UX is hostile** - Multiple protocols, gas optimization, risk assessment, constant monitoring
3. **Yield aggregators help but don't teach** - Users deposit and hope, with no understanding of strategies
4. **Manual optimization is exhausting** - Yields shift constantly; optimal strategies change weekly

### The Opportunity
HackMoney 2026 explicitly focuses on "stablecoin flows, on/offramps, and agentic payments." The intersection of AI agents and DeFi yield optimization is timely, differentiated, and aligned with hackathon themes.

---

## Target Users

### Primary Persona: "Crypto-Curious Casey"
- **Demographics:** 25-40, has some crypto (ETH, stablecoins), employed professional
- **Behavior:** Uses centralized exchanges, has heard of DeFi but finds it intimidating
- **Goals:** Wants to earn yield on idle stablecoins without becoming a full-time DeFi researcher
- **Frustrations:** Doesn't understand impermanent loss, liquidation risk, or how to evaluate protocols
- **Quote:** "I have 5,000 USDC sitting in my wallet doing nothing. I know I could earn yield but I don't know where to start."

### Secondary Persona: "Busy Brian"
- **Demographics:** 30-50, DeFi-literate but time-constrained
- **Behavior:** Knows how yield farming works, has used Yearn/AAVE before
- **Goals:** Wants someone/something to handle the optimization so they don't have to check daily
- **Frustrations:** Spends too much time monitoring positions and rebalancing manually
- **Quote:** "I know what I'm doing but I don't have time to do it. I want a smart assistant."

---

## Product Vision

### The Cowork-Inspired Interface
The UI draws inspiration from Claude's Cowork interface:
- **Left sidebar:** Pools (each pool is a strategy conversation)
- **Main panel:** Conversational interface with the agent
- **Right panel:** Portfolio overview - your tidal pool at a glance

### Key Insight: Conversations ARE Pools
Each conversation with Tidal represents a strategy pool. Users can:
- Have a "Calm Waters" pool focused on low-risk stablecoin yields
- Have a "Deep Current" pool exploring higher-risk options
- Each pool maintains its own context, history, and allocated funds

---

## Feature Specifications

### P0: Must Have for Demo (Core MVP)

#### F1: Wallet Onboarding
**Description:** Users sign in with email/social, smart wallet created invisibly  
**Implementation:** Privy with Coinbase Smart Wallet as underlying account type  
**User Flow:**
1. User clicks "Dive In"
2. Privy modal: email, Google, or existing wallet
3. Smart wallet created on Base (Sepolia for testing, Mainnet for demo)
4. User sees dashboard immediately

**Acceptance Criteria:**
- [ ] New user can onboard in <30 seconds
- [ ] No seed phrase exposure
- [ ] Works on Base Sepolia and Base Mainnet

#### F2: Risk Profile Selection
**Description:** User selects risk tolerance, agent adapts behavior accordingly  
**Risk Tiers (Ocean Depth Metaphor):**

| Tier | Label | Description | Strategies Allowed | Li.Fi Usage |
|------|-------|-------------|-------------------|-------------|
| 1 | Shallows | Calm, protected waters | Stablecoin lending (USDC, DAI) | Swap ETH/other → stables |
| 2 | Mid-Depth | Balanced currents | Above + ETH lending | Swap/rebalance between any |
| 3 | Deep Water | Strong currents, bigger rewards | Above + multi-step combos | Complex multi-hop routing |

**Key Insight:** Li.Fi is used at ALL tiers - risk tier only determines WHICH yield strategies are allowed, not whether routing is used.

**User Flow:**
1. After wallet creation, user sees depth selection screen
2. Clear explanations with ocean/risk metaphor
3. Selection stored in agent context
4. Can be changed later via settings or conversation

**Acceptance Criteria:**
- [ ] Three tiers clearly explained
- [ ] Selection persists across sessions
- [ ] Agent references risk tier in recommendations

#### F3: Conversational Agent Interface
**Description:** Chat interface for interacting with the yield agent  
**Implementation:** Daydreams framework with composable contexts  
**Contexts:**
- **User Context:** Risk profile, wallet address, preferences
- **Pool Context:** Current holdings, active strategies, historical performance
- **Ocean Context:** Live APY data from protocols, gas prices, market conditions

**Core Capabilities:**
1. **Explain current state:** "How's my pool doing?"
2. **Recommend actions:** "Where should I put 1000 USDC?"
3. **Execute with approval:** "Move 500 USDC to Yearn" → User confirms → Agent executes
4. **Educate on actions:** Every recommendation includes WHY

**Sample Interactions:**
```
User: I have 2000 USDC, what should I do?

Tidal: Based on your Mid-Depth risk profile, here's what I'm seeing in the current:

**Today's Yield Landscape:**
- AAVE USDC Supply: 3.8% APY (stable, liquid)
- Yearn USDC Vault: 4.2% APY (auto-compounds)
- Curve 3pool: 5.1% APY (requires LP position)

**My Recommendation:**
Split your funds between Yearn (60%) and AAVE (40%). Here's why:

🌊 Yearn auto-compounds - your yields flow back automatically
⚓ AAVE stays liquid - quick exit if you need to surface
🛡️ Both protocols are battle-tested with strong security

This keeps your pool diversified while catching good yields. Want me to make these moves? I'll need your go-ahead first.
```

**Acceptance Criteria:**
- [ ] Agent responds conversationally (not robotic)
- [ ] Recommendations include reasoning
- [ ] Risk tier affects recommendations
- [ ] Clear approval flow before any transaction

#### F4: Protocol Integrations
**Description:** Connect to DeFi protocols for yield strategies  
**MVP Protocols:**

| Protocol | Chain | Actions | Priority |
|----------|-------|---------|----------|
| AAVE V3 | Base Sepolia / Mainnet | Supply, Withdraw | P0 |
| Yearn V3 | Base Mainnet (mock on Sepolia) | Deposit, Withdraw | P0 |
| LI.FI | Base Mainnet | Swap, Bridge | P0 |

**AAVE Integration:**
- Supply stablecoins (USDC, DAI)
- Withdraw on demand
- Read current APY
- Base Sepolia has full AAVE V3 deployment

**Yearn Integration:**
- Deposit to vaults
- Withdraw from vaults
- Read vault APY and TVL
- Note: Yearn may require mainnet or mock for Sepolia

**LI.FI Integration (UNIVERSAL ROUTING LAYER):**

Li.Fi is used across ALL risk tiers as the token routing layer:

| Scenario | Li.Fi Action |
|----------|--------------|
| User has wrong token for strategy | Swap to required token |
| User wants to rebalance | Route between assets |
| Cross-chain movement (stretch) | Bridge to target chain |

**Flow Example:**
```
User: "I have ETH, earn yield" (Shallows user)
Agent: "I'll swap your ETH → USDC via Li.Fi (best rate via Uniswap),
        then supply to AAVE for 4.2% APY"
→ Shows Li.Fi RouteDisplay
→ Shows AAVE supply preview
→ User approves
→ Execute swap, then deposit
```

**Prize Strategy:**
- Agent ALWAYS mentions Li.Fi when routing
- Show route visualization for every swap
- Explain rate optimization: "Li.Fi found 0.3% better rate across 5 DEXs"

**Acceptance Criteria:**
- [ ] AAVE supply/withdraw works on Base Sepolia
- [ ] At least one real LI.FI transaction on Base Mainnet for demo
- [ ] Agent can read live APY data

#### F5: Transaction Execution with Approval
**Description:** Agent proposes actions, user approves, agent executes  
**Security Model:**
- Agent NEVER auto-executes transactions without user approval
- Clear preview of transaction (amount, destination, gas estimate)
- "Confirm" button triggers actual execution

**User Flow:**
1. Agent recommends action
2. User says "yes" or clicks approve
3. Preview modal shows transaction details
4. User confirms in wallet (Privy handles signing)
5. Agent reports success/failure with tx hash

**Acceptance Criteria:**
- [ ] No transaction executes without explicit approval
- [ ] Transaction preview shows all details
- [ ] Success/failure feedback with explorer link

#### F6: Portfolio Dashboard
**Description:** Visual overview of positions and performance  
**Components:**
- Total pool value
- Allocation breakdown (visualization)
- Active positions with current APY
- 24h/7d/30d performance (stretch)

**Acceptance Criteria:**
- [ ] Shows current positions
- [ ] Shows allocated amounts per protocol
- [ ] Updates after transactions

### P1: Should Have (Enhances Demo)

#### F7: Educational Tooltips
**Description:** Contextual explanations for DeFi concepts  
**Implementation:** Hover/tap tooltips on terms like "APY", "TVL", "impermanent loss"  
**Goal:** User learns while using, reducing intimidation

#### F8: Pool History
**Description:** Log of all agent actions and recommendations  
**Implementation:** Scrollable history in each pool chat  
**Includes:** Timestamps, actions taken, outcomes, tx hashes

#### F9: Gas Optimization Awareness
**Description:** Agent considers gas costs in recommendations  
**Implementation:** "Current gas is high. Want me to wait for calmer waters?"  
**Note:** Less relevant on L2s but demonstrates sophistication

#### F10: Tide Alerts (Wow Moment)
**Description:** Agent surfaces opportunities without being asked  
**Examples:**
- "🌊 Incoming tide: Yearn USDC APY just jumped to 6.2% - 2% higher than your current position. Want me to catch this wave?"
- "⚓ Calm seas: Gas is unusually low right now. Good time to rebalance if you've been waiting."

### P2: Nice to Have (Post-Hackathon)

#### F11: Multi-Pool Management
**Description:** Multiple concurrent strategy pools with separate allocations

#### F12: Performance Analytics
**Description:** Historical performance tracking, yield earned over time

#### F13: AAVE Leverage Loops
**Description:** Automated recursive borrowing for deep water tier
**Complexity:** Medium-high, requires careful risk management

#### F14: AI-Created Custom Strategies
**Description:** Agent proposes novel strategies based on market conditions

#### F15: RWA Integration
**Description:** Real-world asset yield opportunities

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js + React + TailwindCSS                                  │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Sidebar    │  │  Chat Interface │  │  Dashboard      │     │
│  │  (Pools)    │  │  (Agent)        │  │  (Portfolio)    │     │
│  └─────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION                              │
│  Privy SDK                                                       │
│  - Email/Social login                                           │
│  - Coinbase Smart Wallet (ERC-4337)                             │
│  - Gas sponsorship via paymaster                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT LAYER                                 │
│  Daydreams Framework                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ User Context │  │  Pool Ctx    │  │ Ocean Ctx    │          │
│  │ - Risk depth │  │ - Holdings   │  │ - APY data   │          │
│  │ - Preferences│  │ - History    │  │ - Gas/market │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                         │                                        │
│              ┌──────────▼──────────┐                            │
│              │  Tidal Engine       │                            │
│              │  - Reasoning        │                            │
│              │  - Recommendations  │                            │
│              │  - Action planning  │                            │
│              └──────────┬──────────┘                            │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   AAVE V3   │  │   Yearn V3  │  │   LI.FI     │             │
│  │   - Supply  │  │   - Deposit │  │   - Swap    │             │
│  │   - Withdraw│  │   - Withdraw│  │   - Bridge  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN                                  │
│  Base Sepolia (testing) / Base Mainnet (demo)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 + React | Fast iteration, good DX |
| Styling | TailwindCSS | Rapid UI development |
| Auth/Wallet | Privy | Best-in-class onboarding UX |
| Smart Wallet | Coinbase Smart Wallet (via Privy) | Native to Base, gas sponsorship |
| Agent Framework | Daydreams | Composable contexts, TypeScript-first |
| LLM | Claude API (via Daydreams) | Best reasoning capabilities |
| Blockchain | Base Sepolia / Base Mainnet | Low gas, Coinbase ecosystem |
| DEX/Bridge | LI.FI API | Aggregated liquidity, single integration |

### Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "@privy-io/react-auth": "latest",
    "@daydreamsai/core": "latest",
    "viem": "^2.0.0",
    "wagmi": "^2.0.0",
    "@lifi/sdk": "latest",
    "tailwindcss": "^3.0.0"
  }
}
```

### Environment Configuration

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# LI.FI (mainnet only)
LIFI_API_KEY=your_lifi_api_key

# RPC Endpoints
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
BASE_MAINNET_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# Claude API (for Daydreams)
ANTHROPIC_API_KEY=your_anthropic_key
```

### Contract Addresses (Base Sepolia)

```typescript
const CONTRACTS = {
  // AAVE V3 on Base Sepolia
  AAVE_POOL: "0x...", // Get from AAVE docs
  AAVE_USDC: "0x...",
  
  // Test tokens
  USDC: "0x...", // Base Sepolia USDC
  DAI: "0x...",  // Base Sepolia DAI
}
```

---

## Development Strategy

### Testnet vs Mainnet Approach

**Challenge:** LI.FI does not support testnets.

**Solution: Hybrid Approach**

| Component | Development | Demo |
|-----------|-------------|------|
| Wallet (Privy) | Base Sepolia | Base Sepolia or Mainnet |
| AAVE | Base Sepolia | Base Sepolia |
| Yearn | Mock or Mainnet | Mainnet |
| LI.FI | Tenderly simulation | Base Mainnet (real tx) |

**For Demo Day:**
1. Core flows demonstrated on Sepolia (free, repeatable)
2. One real LI.FI swap on Base Mainnet (~$10-20 USDC)
3. Video captures the mainnet transaction

### Development Phases

#### Phase 1: Foundation (Days 1-3)
- [ ] Next.js project setup
- [ ] Privy integration with Coinbase Smart Wallet
- [ ] Basic UI shell (sidebar, chat, dashboard)
- [ ] Daydreams agent setup with contexts

#### Phase 2: Core Integration (Days 4-6)
- [ ] AAVE V3 integration (supply/withdraw)
- [ ] Agent can read APY data
- [ ] Agent can propose transactions
- [ ] Transaction approval flow

#### Phase 3: Intelligence (Days 7-8)
- [ ] Risk tier logic
- [ ] Recommendation engine
- [ ] Educational explanations
- [ ] LI.FI integration (Tenderly + mainnet test)

#### Phase 4: Polish (Days 9-10)
- [ ] UI refinement
- [ ] Demo flow rehearsal
- [ ] Video recording
- [ ] Bug fixes and edge cases

---

## Demo Script

### The "Golden Path" (3-minute demo)

**[0:00-0:30] Hook**
> "DeFi yields are like the ocean - full of opportunity, but intimidating to navigate alone. What if you had an AI to manage your own tidal pool?"

**[0:30-1:00] Onboarding**
- Show landing page with ocean/tidal aesthetic
- Click "Dive In"
- Sign in with email (Privy)
- Wallet created invisibly
- "No seed phrase, no extensions. I'm already in."

**[1:00-1:30] First Conversation**
- Type: "I have 1000 USDC and I'm new to DeFi. Where should I start?"
- Agent asks about risk comfort (depth preference)
- Select "Mid-Depth"
- Agent explains current yield landscape

**[1:30-2:15] Recommendation & Execution**
- Agent recommends split: 60% Yearn, 40% AAVE
- Explains WHY with tidal metaphor (auto-compound = yields flow back)
- User approves
- Transaction executes (show tx hash)
- Dashboard updates - "Your pool is now earning"

**[2:15-2:45] Wow Moment - Tide Alert**
- Agent surfaces: "🌊 Incoming tide: Curve 3pool APY jumped to 6.2%. Want to catch this wave?"
- Shows the tradeoff (higher yield vs more complexity)
- User can approve or let it pass

**[2:45-3:00] Closing**
> "Tidal: Your AI-managed tidal pool in the DeFi ocean. Built with Daydreams, Privy, AAVE, and LI.FI on Base."

---

## Success Metrics

### Hackathon Success Criteria
- [ ] Working demo of full flow (onboard → recommend → execute)
- [ ] At least one real mainnet transaction (LI.FI)
- [ ] Agent explains reasoning for every recommendation
- [ ] Risk tiers affect agent behavior
- [ ] Polished demo video (<3 minutes)

### Judge Evaluation Criteria (ETHGlobal)
1. **Functionality:** Does it work?
2. **Technical Complexity:** Is the implementation sophisticated?
3. **Design:** Is the UX polished?
4. **Creativity:** Is this novel?
5. **Potential Impact:** Could this be a real product?

### Sponsor Prize Criteria (LI.FI)
- Deep integration (not just one swap)
- LI.FI as routing layer for yield optimization
- Prominent mention in demo and README

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LI.FI mainnet tx fails during demo | Medium | High | Pre-test, have backup recording |
| Daydreams integration issues | Medium | High | Have fallback to direct Claude API |
| AAVE Sepolia instability | Low | Medium | Can mock if needed |
| Privy onboarding issues | Low | Medium | Test thoroughly, have backup wallet |

### Scope Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Trying to build too much | High | High | Strict P0 focus, cut features early |
| UI not polished enough | Medium | Medium | Allocate Day 9-10 for polish only |
| Demo not rehearsed | Medium | High | Practice demo 5+ times |

---

## Brand Guidelines

### Name
**Tidal** - Managing tidal pools of yield

### Tagline Options
- "Your AI-managed tidal pool in the DeFi ocean"
- "Navigate DeFi currents with AI"
- "Let the tides work for you"

### Visual Direction
- Ocean blues, teals, sandy neutrals
- Fluid, wave-inspired UI elements
- Clean, calming aesthetic (contrasts with typical "degen" DeFi vibes)
- Subtle wave animations for loading states

### Voice & Tone
- Calm, knowledgeable guide
- Uses ocean metaphors naturally (not forced)
- Educational without being condescending
- "Your tidekeeper" personality

---

## Open Questions

1. **Yearn on Base Sepolia?** - Need to verify deployment or plan mock
2. **Gas sponsorship budget?** - How much to allocate for demo paymasters
3. **LI.FI partner contact?** - Reach out for hackathon support?
4. **Team workload split?** - Frontend/Backend/Agent division

---

## Appendix A: Why Daydreams?

**Q: Why not just use LangChain or raw Claude API?**

**A: Composable Contexts**

Daydreams' key differentiator is composable contexts - isolated workspaces that combine for complex agent behaviors. For Tidal:

```typescript
// User context - persists across sessions
const userContext = context({
  type: "user",
  create: () => ({ 
    riskDepth: null, // shallows, mid-depth, deep-water
    preferences: {} 
  })
});

// Pool context - current holdings
const poolContext = context({
  type: "pool",
  create: () => ({ 
    holdings: [], 
    totalValue: 0 
  }),
  use: (state) => [
    { context: userContext } // Inherits user context
  ]
});

// Ocean context - live market data
const oceanContext = context({
  type: "ocean",
  create: () => ({ 
    apyData: {}, 
    gasPrice: 0,
    marketConditions: {}
  })
});

// Agent sees all contexts unified
const agent = createDreams({
  contexts: [userContext, poolContext, oceanContext],
  model: anthropic("claude-sonnet-4-20250514"),
});
```

This architecture means the agent naturally "knows" the user's risk depth when evaluating market data - no manual prompt engineering required.

---

## Appendix B: Sample Agent Prompts

### System Prompt (Core)

```
You are Tidal, an AI agent that helps users manage their yield-earning tidal pools in DeFi.

Your personality:
- Calm, knowledgeable guide - like a friendly marine biologist
- Uses ocean/tidal metaphors naturally (not forced)
- Educational - explain concepts simply when relevant
- Cautious with user funds - always confirm before actions
- Transparent about risks and tradeoffs

Your capabilities:
- Recommend yield strategies based on user's depth preference
- Execute transactions on AAVE, Yearn, and via LI.FI (with user approval)
- Monitor pools and alert on opportunities ("incoming tides")
- Explain DeFi concepts in plain English

Current user context:
- Risk depth: {riskDepth} (shallows/mid-depth/deep-water)
- Wallet: {walletAddress}
- Current pool: {holdings}

Current ocean conditions:
- AAVE USDC APY: {aaveUsdcApy}%
- Yearn USDC APY: {yearnUsdcApy}%
- Gas price: {gasPrice} gwei

Rules:
1. NEVER execute a transaction without explicit user approval
2. ALWAYS explain WHY you're recommending something
3. Respect the user's depth preference - don't suggest deep-water strategies to shallows users
4. If unsure, ask clarifying questions
5. Provide transaction previews before execution
```

### Action Schemas

```typescript
const depositToAAVE = {
  name: "deposit_to_aave",
  description: "Deposit tokens to AAVE to earn supply APY",
  parameters: {
    token: "USDC | DAI",
    amount: "number",
  },
  requiresApproval: true,
};

const withdrawFromAAVE = {
  name: "withdraw_from_aave", 
  description: "Withdraw tokens from AAVE",
  parameters: {
    token: "USDC | DAI",
    amount: "number | 'max'",
  },
  requiresApproval: true,
};

const swapViaLIFI = {
  name: "swap_via_lifi",
  description: "Swap tokens using LI.FI aggregator",
  parameters: {
    fromToken: "string",
    toToken: "string", 
    amount: "number",
  },
  requiresApproval: true,
};
```

---

## Appendix C: UI Wireframes

### Layout Structure

```
┌────────────────────────────────────────────────────────────────────┐
│  🌊 Tidal                                     [Pool Value: $5,234] │
├──────────────┬─────────────────────────────────┬───────────────────┤
│              │                                 │                   │
│    POOLS     │         CHAT INTERFACE          │    YOUR POOL      │
│              │                                 │                   │
│  + New Pool  │  ┌─────────────────────────┐   │   Total Value     │
│              │  │ Tidal: Based on your    │   │   $5,234.12       │
│  🌊 USDC     │  │ mid-depth preference... │   │                   │
│    Calm      │  └─────────────────────────┘   │   ┌───────────┐   │
│    $3,200    │                                 │   │ ~~~~~~~~~~│   │
│              │  ┌─────────────────────────┐   │   │ AAVE  40% │   │
│  🌊 ETH      │  │ You: Sounds good, let's │   │   │ Yearn 60% │   │
│    Growth    │  │ ride that wave          │   │   └───────────┘   │
│    $2,034    │  └─────────────────────────┘   │                   │
│              │                                 │   Positions:      │
│              │  ┌─────────────────────────┐   │   ├─ AAVE USDC    │
│              │  │ [Approve Transaction]   │   │   │  $2,093 @ 3.8% │
│              │  │ Deposit 500 USDC to     │   │   └─ Yearn USDC   │
│              │  │ Yearn Vault             │   │      $3,141 @ 4.2%│
│              │  │ [Confirm] [Cancel]      │   │                   │
│              │  └─────────────────────────┘   │   24h: +$2.14 ↗   │
│              │                                 │                   │
│              │  ┌─────────────────────────┐   │                   │
│              │  │ Message Tidal...    [→] │   │                   │
│              │  └─────────────────────────┘   │                   │
│              │                                 │                   │
└──────────────┴─────────────────────────────────┴───────────────────┘
```

---

## Approval Checklist

**For Partner Review:**

- [ ] Concept alignment - Does this match our vision?
- [ ] Scope realistic - Can we build this in 10 days?
- [ ] Technical approach - Any concerns with stack choices?
- [ ] Demo flow - Does the story make sense?
- [ ] Brand/metaphor - Does "Tidal" resonate?
- [ ] Workload split - Who owns what?

**Sign-off:**
- [ ] Partner 1: _________________ Date: _______
- [ ] Partner 2: _________________ Date: _______

---

*Document prepared for ETHGlobal HackMoney 2026. Let's make waves! 🌊*
