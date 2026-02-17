# Solana Integration Plan

This document serves as a plan for integration Tidal into Solana, whilst keeping the Base code intact. It should not change the existing code, but add Solana integration into it.

---

## Beginner-Safe Plan: Base + Solana Integration (No Main Merges)

## Contents
- [Summary](#summary)
- [Branching + Merge Workflow (Locked)](#branching--merge-workflow-locked)
- [Implementation Plan (Decision Complete)](#implementation-plan-decision-complete)
- [Phase 1: Chain Foundation + Feature Flag](#phase-1-chain-foundation--feature-flag)
- [Phase 2: Privy Solana Wallet Path](#phase-2-privy-solana-wallet-path)
- [Phase 3: Solana Balance (Read-Only)](#phase-3-solana-balance-read-only)
- [Phase 4: Kamino Rates (Read-Only, Devnet-Compatible)](#phase-4-kamino-rates-read-only-devnet-compatible)
- [Phase 5: Kamino Execution (Devnet)](#phase-5-kamino-execution-devnet)
- [Phase 6: AI Becomes Chain-Aware (After Read/Quote Foundation)](#phase-6-ai-becomes-chain-aware-after-readquote-foundation)
- [Phase 7: Jupiter (Mainnet Stage, Later)](#phase-7-jupiter-mainnet-stage-later)
- [Security Gate (Required Before Any Solana Execute)](#security-gate-required-before-any-solana-execute)
- [Operational Readiness (RPC, Rate Limits, Fallbacks)](#operational-readiness-rpc-rate-limits-fallbacks)
- [Program Interface Strategy (SDK vs IDL)](#program-interface-strategy-sdk-vs-idl)
- [Important Interface/Type Changes](#important-interfacetype-changes)
- [Test Cases and Scenarios (Strict Checklist Per Child Branch)](#test-cases-and-scenarios-strict-checklist-per-child-branch)
- [Failure Modes and Handling](#failure-modes-and-handling)
- [Assumptions and Defaults (Explicitly Chosen)](#assumptions-and-defaults-explicitly-chosen)

### Summary
You will build Solana support additively while keeping Base stable, using:
- Parent branch: `julo-solana`
- Child branches off `julo-solana`, merged back only into `julo-solana`
- No merges to `main` during this rollout
- Solana hidden behind feature flag until each slice is stable
- Start with wallet + balance (read-only), then Kamino first (devnet-compatible), then Jupiter later
- Use SDK-first integration with minimal IDL usage where needed for custom decoding/validation

---

## Branching + Merge Workflow (Locked)
1. Base branch for all work: `julo-solana`
2. Create child branches from `julo-solana` only:
   - `solana-01-chain-foundation`
   - `solana-02-privy-solana-wallet`
   - `solana-03-solana-balance-readonly`
   - `solana-04-kamino-rates-readonly`
   - `solana-05-kamino-execution-devnet`
   - `solana-06-ai-chain-aware`
   - `solana-07-jupiter-mainnet` (later)
3. Merge each child -> `julo-solana` only.
4. Do not open PR to `main` until full Solana integration is accepted by your other developer.

---

## Implementation Plan (Decision Complete)

### Phase 1: Chain Foundation + Feature Flag
**Branch:** `solana-01-chain-foundation`  
**Goal:** Introduce chain selection scaffolding with zero behavior changes to Base.

Changes:
- Add chain state abstraction (`base | solana`) and local storage for selected chain.
- Add a unified chain-aware wallet state used by chat, action execution, sidebar, and history.
- Add manual chain switcher UI in `tidal/components/sidebar/PoolList.tsx`.
- Add chain-aware explorer URL resolver utility (BaseScan vs Solana Explorer).
- Add feature flag `NEXT_PUBLIC_ENABLE_SOLANA` in `tidal/.env.example` (default off).
- Keep default chain as Base.

Definition of done:
- With flag off: app behaves exactly as today.
- With flag on: chain toggle visible and persists selection.
- No Solana RPC calls yet.
- Chat/header/wallet connected state follows active chain, not only EVM wallet state.
- No Base-only explorer links shown in Solana mode.

---

#### Step-by-Step Development
1. (Optional) Create branch `solana-01-chain-foundation` from `julo-solana`.
2. Add `ActiveChain` type and local storage hook for `base | solana`.
3. Add unified chain-aware wallet state and wire it into UI consumers.
4. Add a manual chain switcher in `tidal/components/sidebar/PoolList.tsx`.
5. Add `NEXT_PUBLIC_ENABLE_SOLANA` flag to `tidal/.env.example` and gate the switcher.
6. Verify Base behavior is unchanged with flag off and chain selection persists with flag on.

---

#### What Has Changed or Created

---
---

### Phase 2: Privy Solana Wallet Path
**Branch:** `solana-02-privy-solana-wallet`  
**Goal:** Connect Solana wallet via Privy while preserving existing EVM path.

Changes:
- Update `tidal/components/providers/PrivyProvider.tsx` to support both wallet ecosystems:
  - `appearance.walletChainType: 'ethereum-and-solana'`
  - embedded wallet config for Solana creation-on-login
  - Solana RPC config set to devnet
- Add Solana wallet hook (new file) using `useWallets` and wallet `type === 'solana'`.
- Update `tidal/components/sidebar/WalletSection.tsx` to display wallet info by selected chain.
- Define expected UX for three states: EVM-only connected, Solana-only connected, both connected.

Definition of done:
- User can connect EVM wallet and Solana wallet.
- Switching chain updates displayed address correctly.
- Base auth and wallet flow still works unchanged.
- Active chain never accidentally reads address/state from the wrong wallet ecosystem.

---

#### Step-by-Step Development
1. (Optional) Create branch `solana-02-privy-solana-wallet` from updated `julo-solana`.
2. Update `tidal/components/providers/PrivyProvider.tsx` for dual-chain Privy config.
3. Add Solana wallet hook using `useWallets` filtered by `type === 'solana'`.
4. Update `tidal/components/sidebar/WalletSection.tsx` to render by selected chain.
5. Test wallet connection for both EVM and Solana flows.
6. Confirm Base login/connect/disconnect still works exactly as before.

---

#### What Has Changed or Created

---
---

### Phase 3: Solana Balance (Read-Only)
**Branch:** `solana-03-solana-balance-readonly`  
**Goal:** Show SOL balance for selected Solana wallet.

Changes:
- Add Solana RPC utility (`@solana/web3.js`) for `getBalance`.
- Add read-only Solana balance hook.
- Update wallet summary + portfolio header to show Solana balance when chain is Solana.
- Keep Base portfolio components available only on Base; show clear "Base-only currently" placeholders on Solana where needed.
- Add RPC timeout + retry/backoff policy for read-only calls.
- Note SPL token balance roadmap for later phases.

Definition of done:
- Solana wallet address and SOL balance load on devnet.
- No transactions sent.
- Base portfolio pages unchanged when chain is Base.
- Read failures surface clear fallback UI instead of silent breakage.

---

#### Step-by-Step Development
1. (Optional) Create branch `solana-03-solana-balance-readonly` from updated `julo-solana`.
2. Add Solana RPC client setup (`@solana/web3.js`) for read-only balance calls.
3. Build hook to fetch SOL balance for selected Solana wallet address.
4. Wire wallet summary and portfolio header to show SOL balance on Solana chain.
5. Add clear placeholder copy for Base-only portfolio sections while on Solana.
6. Verify no transaction/execution paths are introduced in this phase.

---

#### What Has Changed or Created

---
---

### Phase 4: Kamino Rates (Read-Only, Devnet-Compatible)
**Branch:** `solana-04-kamino-rates-readonly`  
**Goal:** First Solana yield integration via Kamino, read-only.

Changes:
- Add Kamino integration module (new file under `lib/solana/`).
- Add API route for Solana yield/rates (new route under `tidal/app/api/`).
- Normalize rate schema so Base and Solana render from one response shape.
- Include response metadata: `protocol`, `chain`, `network`, `live`, `source`, `timestamp`, `cacheAgeMs`.
- Update `tidal/components/dashboard/YieldRates.tsx` to render Kamino rates when chain is Solana.

Definition of done:
- Solana chain shows Kamino rates.
- Base chain still shows Aave rates exactly as today.
- UI rendering path is chain-agnostic for rates card layout.

---

#### Step-by-Step Development
1. (Optional) Create branch `solana-04-kamino-rates-readonly` from updated `julo-solana`.
2. Add a `lib/solana/` Kamino module for read-only rate queries.
3. Create Solana rates API route under `tidal/app/api/` with normalized schema.
4. Update `tidal/components/dashboard/YieldRates.tsx` to switch by active chain.
5. Validate rate rendering on Solana and no regressions on Base.
6. Keep all Solana functionality read-only in this phase.

---

#### What Has Changed or Created

---
---

### Phase 5: Kamino Execution (Devnet)
**Branch:** `solana-05-kamino-execution-devnet`  
**Goal:** Execute first Solana yield actions (deposit/withdraw), devnet only.

Changes:
- Add Solana transaction execution service for Kamino.
- Extend `tidal/components/chat/ActionCard.tsx` to support chain-aware execution.
- Add Solana explorer links (devnet).
- Guard logging calls in `tidal/components/chat/ChatPanelContent.tsx`:
  - Do not call current DB-backed logging endpoints for Solana actions (pending DB decision).
- Integrate all required controls from `Security Gate` section below.

Definition of done:
- Solana Kamino action card can execute on devnet.
- No DB writes attempted for Solana addresses.
- Base action card flows continue working.
- Any simulation failure or allowlist mismatch blocks execution.

---

#### Step-by-Step Development
1. (Optional) Create branch `solana-05-kamino-execution-devnet` from updated `julo-solana`.
2. Implement Kamino deposit/withdraw execution service in `lib/solana/`.
3. Extend `tidal/components/chat/ActionCard.tsx` with chain-aware Solana execution branch.
4. Add Solana explorer links for transaction visibility.
5. Guard `tidal/components/chat/ChatPanelContent.tsx` to skip current DB logging endpoints for Solana actions.
6. Test success and failure states (reject, insufficient funds, RPC errors, simulation failure) on devnet.

---

#### What Has Changed or Created

---
---

### Phase 6: AI Becomes Chain-Aware (After Read/Quote Foundation)
**Branch:** `solana-06-ai-chain-aware`  
**Goal:** Make chat tooling aware of `base` vs `solana` with server-side safety validation.

Changes:
- Add `activeChain`, `activeWalletAddress`, and `connectedWalletsByChain` to chat context in `tidal/components/chat/ChatPanelContent.tsx`.
- Update `tidal/app/api/chat/route.ts` to pass chain context into system/tool execution.
- Update `tidal/lib/ai/prompts.ts` and `tidal/lib/ai/tools.ts`:
  - Base tools route to existing Base actions.
  - Solana tools route to Kamino actions/rates.
- Add backend tool-output validator for chain, protocol, action, risk-tier, and required fields.
- Ensure AI never suggests Base-only actions while user is on Solana (and vice versa) unless explicit user-confirmed chain switch.

Definition of done:
- AI recommendations and tool calls match selected chain.
- No cross-chain mismatches in generated ActionCards.
- Invalid/mismatched tool outputs are blocked server-side with user-safe error response.

---

#### Step-by-Step Development
1. (Optional) Create branch `solana-06-ai-chain-aware` from updated `julo-solana`.
2. Add chain-aware context fields in `tidal/components/chat/ChatPanelContent.tsx`.
3. Pass chain context through `tidal/app/api/chat/route.ts`.
4. Update `tidal/lib/ai/prompts.ts` with chain-aware behavior and safety constraints.
5. Update `tidal/lib/ai/tools.ts` for chain-aware execution routing.
6. Add server-side tool output validator and test wrong-chain/wrong-protocol rejection.

---

#### What Has Changed or Created

---
---

### Phase 7: Jupiter (Mainnet Stage, Later)
**Branch:** `solana-07-jupiter-mainnet`  
**Goal:** Add Jupiter swap path after devnet foundation is stable.

Changes:
- Introduce Solana network config toggle (`devnet` for foundation, `mainnet-beta` for Jupiter phase).
- Add Jupiter quote + execute integration.
- Add quote freshness TTL and mandatory re-quote before execution.
- Add rate-limit/key handling and fallback behavior.
- Update ActionCard and quote UI for Solana swap routes.

Definition of done:
- Jupiter quote/execution works on mainnet-beta Solana path.
- Expired quote cannot execute.
- Clear UI labeling of network/environment and risk warning for mainnet actions.

---

#### Step-by-Step Development
1. (Optional) Create branch `solana-07-jupiter-mainnet` from updated `julo-solana`.
2. Add Solana network mode handling for `devnet` and `mainnet-beta`.
3. Implement Jupiter quote and execution modules for Solana swaps.
4. Update ActionCard and quote UI to render Jupiter route details on Solana.
5. Add explicit network labels, quote TTL handling, and warning copy for mainnet execution.
6. Run full regression across Base and earlier Solana phases before merging back to `julo-solana`.

---

#### What Has Changed or Created

---

## Security Gate (Required Before Any Solana Execute)
This is mandatory before enabling any Solana write path.

Requirements:
1. Preflight simulation before prompting final signature.
2. Strict allowlist of program IDs and instruction targets.
3. Slippage/min-out guards where applicable.
4. Compute budget and priority fee policy.
5. Blockhash expiry handling and retry strategy.
6. ATA (associated token account) existence/creation handling.
7. Wrapped SOL lifecycle handling where relevant.
8. Explicit user-facing transaction summary before signing.
9. Hard fail on chain mismatch.
10. Deterministic error mapping for user-facing failures.

---

## Operational Readiness (RPC, Rate Limits, Fallbacks)
Requirements:
- Add Solana envs to `tidal/.env.example`:
  - `SOLANA_RPC_DEVNET`
  - `SOLANA_RPC_MAINNET`
  - `NEXT_PUBLIC_ENABLE_SOLANA`
- Define provider fallback order for read and write flows.
- Add timeout/retry/backoff policy for Solana RPC and external APIs.
- Add degraded mode UX for Kamino/Jupiter unavailability.
- Define observability fields for chain/protocol/action in logs.

---

## Program Interface Strategy (SDK vs IDL)
Chosen strategy: `SDK-First + Minimal IDLs`.

Rules:
- Use official SDK/API integrations first for Kamino and Jupiter.
- IDL is not required for every integration initially.
- Add/pin IDLs when needed for:
  - custom instruction construction
  - instruction/account decoding
  - stricter low-level validation/auditability
- Always pin and allowlist program IDs for write paths, regardless of SDK use.

---

## Important Interface/Type Changes
(Internal app interfaces; no public external API contract changes yet.)

1. New chain discriminator type used across wallet/chat/action paths:
   - `type ActiveChain = 'base' | 'solana'`

2. Network discriminator for execution and explorer links:
   - `type ActiveNetwork = 'base-mainnet' | 'base-sepolia' | 'solana-mainnet-beta' | 'solana-devnet'`

3. Chain-aware wallet model:
   - `type ChainWalletState = { chain: ActiveChain; connected: boolean; address?: string; walletType?: string }`

4. Chain-aware action payload shape in ActionCard path:
   - Add required `chain` and `network` fields in tool output payload.

5. Tool execution guard result:
   - `type ToolExecutionGuardResult = { allowed: boolean; reason?: string }`

6. Logging API behavior (temporary until DB decision):
   - Keep existing `/api/transactions`, `/api/users`, `/api/sessions`, `/api/yield-actions` unchanged for now.
   - Solana actions skip these endpoints until DB/API schema agreement is reached.

---

## Test Cases and Scenarios (Strict Checklist Per Child Branch)
Run on each child branch before merging into `julo-solana`:
1. Base regression:
   - Connect Base wallet, view balances, open dashboard, run at least one existing Base ActionCard flow path.
2. Feature flag safety:
   - `NEXT_PUBLIC_ENABLE_SOLANA=false` hides Solana UI; Base behavior identical.
3. Wallet state matrix:
   - EVM-only connected, Solana-only connected, both connected, neither connected.
4. Solana foundation checks:
   - Connect Solana wallet.
   - Switch chain via manual toggle.
   - SOL balance loads without breaking Base UI.
5. Execution checks (Kamino phase):
   - Deposit and withdraw on devnet succeed.
   - Failure cases show user-friendly errors (wallet rejection, RPC timeout, insufficient funds).
6. Solana-specific failure checks:
   - Simulation failure blocks execution.
   - Blockhash expiry handled correctly.
   - Missing ATA path handled.
   - RPC 429/timeouts handled.
7. AI safety checks:
   - Prompt asks for chain-specific recommendation and receives correct-chain tool outputs.
   - Wrong-chain tool output is blocked server-side.
8. Quote safety checks (Jupiter phase):
   - Expired quote re-quote flow works.
   - Min-out/slippage constraints enforced.
9. Explorer and history checks:
   - Explorer links map to correct chain.
   - History UI does not show wrong-chain explorer labels.
10. Non-functional:
   - `npm run lint`
   - `npm run test`
   - `npm run build`

---

## Failure Modes and Handling
1. Solana selected but no Solana wallet:
   - Show connect prompt specific to Solana path.
2. Wallet type mismatch for active chain:
   - Hard fail and prompt user to connect/select correct wallet.
3. Wrong network for protocol:
   - Hard-stop with clear message and switch guidance.
4. RPC outage or rate limiting:
   - Show retry + fallback copy; do not break Base UI.
5. Simulation/preflight failure:
   - Block execution and return actionable error.
6. Stale quote or stale route attempt:
   - Force re-quote before execution.
7. DB logging conflict:
   - Skip Solana logging until schema agreement; never send Solana addresses into EVM-only validators.
8. Chain mismatch in AI output:
   - Validate chain in backend and ActionCard before execution and block if mismatched.

---

## Assumptions and Defaults (Explicitly Chosen)
1. All work stays off `main`; merges go child -> `julo-solana` only.
2. Solana remains hidden behind feature flag until each phase is validated.
3. Default selected chain remains Base.
4. Solana rollout starts on devnet.
5. First Solana yield protocol is Kamino (not Jupiter) to stay devnet-compatible.
6. No DB/schema/API changes now (pending discussion with your other developer).
7. Solana transaction history/logging is intentionally deferred until DB alignment is approved.
8. Integration approach is SDK-first with minimal IDL usage.
9. No Solana write path goes live until Security Gate is complete.
10. AI tool output validation is required server-side before enabling Solana execution actions.
