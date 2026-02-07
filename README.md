# Tidal

**Your AI-managed tidal pool in the DeFi ocean.**

Tidal is an AI-powered DeFi yield management app that helps users find, compare, and execute yield strategies across protocols on Base. Chat with an AI agent that explains every move, routes swaps via Li.Fi, and deposits into vaults — all matched to your risk tolerance.

## How It Works

1. **Choose your depth** — Shallows (conservative), Mid-Depth (growth), or Deep Water (aggressive)
2. **Chat with Tidal** — Ask about yields, get real-time rate comparisons across protocols
3. **Execute in one click** — AI prepares transactions, you approve. Swaps route via Li.Fi, deposits go to AAVE or ERC-4626 vaults

## Features

- **AI Yield Agent** — Conversational DeFi assistant powered by Claude via Vercel AI SDK. Recommends strategies, explains risks, executes transactions
- **Li.Fi Universal Routing** — All token swaps route through Li.Fi for optimal rates across DEXs. Swap + deposit combos in one flow
- **Multi-Protocol Yield** — AAVE V3 lending, Morpho MetaMorpho vaults (Steakhouse, Gauntlet, Moonwell, Clearstar), YO Protocol yield optimizer
- **Generic ERC-4626 Adapter** — One adapter supports any ERC-4626 vault. Adding a new protocol = one config entry, zero code
- **Risk-Tiered UX** — Shallows users see conservative 3-5% APY options. Mid-Depth unlocks 5-10%+ reward-boosted vaults and DeFi Llama yield scanning
- **Live Yield Data** — DeFi Llama integration scans all Base protocols in real-time. "Scouted by Tidal" surfaces high-yield opportunities
- **Real Position Tracking** — On-chain balance reads via wagmi multicall. Portfolio total, allocation bar, per-protocol position cards

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Auth / Wallet | Privy + Coinbase Smart Wallet |
| AI Agent | Vercel AI SDK v6 + Claude |
| Swaps / Routing | Li.Fi SDK |
| Lending | AAVE V3 (Base) |
| Vaults | Generic ERC-4626 (Morpho, YO Protocol) |
| Yield Data | DeFi Llama Yields API |
| Chain | Base Mainnet |

## Li.Fi Integration

Li.Fi is the **universal routing layer** powering all token swaps in Tidal:

- Every swap quotes via Li.Fi API for optimal cross-DEX routing
- Route visualization shows the path, DEX used, and rate found
- Swap + deposit combos: Li.Fi swap then protocol deposit in one flow
- "Routing via Li.Fi" attribution on every quote card and action

Li.Fi transforms Tidal from a single-protocol frontend into a universal yield router that can move funds anywhere.

## Architecture

```
User chats with AI
       |
  AI Agent (Claude)
  |         |         |
getQuote  scanYields  prepareVaultDeposit
(Li.Fi)   (DeFi Llama) (ERC-4626)
       |
  ActionCard UI
  (approve/reject)
       |
  wagmi transaction
  (Base Mainnet)
       |
  Position tracking
  (multicall reads)
```

## Running Locally

```bash
npm install
npm run dev
```

Requires `.env.local` with Privy, Anthropic, and Li.Fi API keys.

## Built For

ETH Global HackMoney 2026

## Team

Built by [@0xSardius](https://github.com/0xSardius)
