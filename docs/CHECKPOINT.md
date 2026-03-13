# Tidal Checkpoint — March 12, 2026

## Where We Left Off

Completed the Solana-first pivot. PRD v2 is written, CLAUDE.md updated, all decisions documented.

## Key Decisions Made
- **Direction**: Solana-first consumer DeFi product (EVM code parked)
- **Wallet**: Privy (embedded Solana + Phantom/Backpack external connectors)
- **Swaps**: Jupiter Ultra API direct (not Li.Fi)
- **Team**: 0xSardius (engineering) + 0xJulo (design engineering)
- **Testing**: Mainnet with small amounts
- **Target launch**: Colosseum hackathon (timing TBD — need to look up next cycle)
- **Stablecoin yield**: Kamino + Jupiter Lend both in Phase 1

## Open Value Prop Questions (Answer Before Building)

These sharpen the product and directly inform 0xJulo's design work:

### 1. Why AI and not just a comparison table?
Kamino and Jupiter both have good UIs. What does the AI add? Is it:
- **Decision-making** ("I don't know which is safer") — AI as risk advisor
- **Execution simplification** ("I don't want to learn two UIs") — AI as universal interface
- **Ongoing management** ("I don't want to check rates weekly") — AI as portfolio manager
- All three? Which leads?

### 2. What's the first 30 seconds?
New user lands on Tidal with USDC in Phantom. What happens?
- Connect wallet first, then chat?
- Pick risk tier first?
- Just type "I have 500 USDC" and the app handles everything?
This drives the entire onboarding flow design.

### 3. Why Tidal over Phantom's built-in staking?
Phantom already has one-click SOL staking. What pulls users into Tidal instead?
The stablecoin lending angle is stronger (Phantom doesn't do that) — should that be the lead feature over SOL staking?

### 4. What's the retention hook?
User deposits USDC via Tidal. Why do they come back tomorrow?
- Rate monitoring alerts ("Jupiter Lend just passed Kamino, want me to move?")
- Yield earned dashboard ("You've earned $4.32 this week")
- Expanding into new strategies as trust builds
- Something else?

### 5. Who's the day-one user?
- Someone with USDC in a Solana wallet not earning yield?
- Someone with SOL who doesn't know about staking?
- Someone coming from EVM who's Solana-curious?
This affects messaging, onboarding, and which feature gets top billing.

## What's Next
1. Answer the 5 questions above (discuss with 0xJulo)
2. Look up Colosseum hackathon next cycle timing
3. Start Phase 1 build: F1 (Privy Solana wallet config) is the first task

## Key Files
- PRD: `docs/Tidal_PRD_v2_Solana.md`
- Previous PRD: `docs/Tidal_PRD.md` (v1 hackathon, archived)
- Project instructions: `CLAUDE.md`
- Latest commit: `1ef26d2` (Promote stablecoin yield to Phase 1)
