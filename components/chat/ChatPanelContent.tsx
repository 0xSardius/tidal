'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { useEffect, useRef, useState, useCallback, FormEvent } from 'react';
import { useAccount } from 'wagmi';
import { useRiskDepth } from '@/lib/hooks/useRiskDepth';
import { useAavePositions } from '@/lib/hooks/useAave';
import { ActionCard } from './ActionCard';
import { LifiQuoteCard } from './LifiQuoteCard';
import { RISK_DEPTHS } from '@/lib/constants';

// Tool invocation type for v6 - matches ToolUIPart and DynamicToolUIPart
interface ToolPart {
  type: string;
  toolCallId: string;
  toolName?: string;
  state: string;
  input?: unknown;
  output?: unknown;
}

// Helper to get text content from message (v6 uses parts array)
function getMessageText(message: UIMessage): string {
  if (!message.parts) return '';
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

// Helper to check if a part is a tool part
function isToolPart(part: unknown): part is ToolPart {
  if (!part || typeof part !== 'object') return false;
  const p = part as Record<string, unknown>;
  return typeof p.type === 'string' &&
         (p.type.startsWith('tool-') || p.type === 'dynamic-tool') &&
         typeof p.toolCallId === 'string';
}

// Helper to get tool invocations from message parts
function getToolInvocations(message: UIMessage): ToolPart[] {
  if (!message.parts) return [];
  return message.parts.filter(isToolPart) as ToolPart[];
}

export function ChatPanelContent() {
  const [input, setInput] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get context for AI
  const { address, isConnected } = useAccount();
  const { riskDepth } = useRiskDepth();
  const { positions } = useAavePositions();

  // Build context for the AI
  const context = {
    riskDepth,
    walletConnected: isConnected,
    walletAddress: address,
    positions: positions.map((p) => ({
      token: p.token,
      amount: p.suppliedFormatted,
      protocol: 'AAVE V3',
    })),
  };

  const depthConfig = RISK_DEPTHS[riskDepth ?? 'shallows'];

  // useChat - defaults to /api/chat endpoint
  const { messages, sendMessage, status, error } = useChat();

  // v6 uses status instead of isLoading
  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom on new messages - scroll container only, not page
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Listen for strategy card clicks from sidebar
  const handleSidebarMessage = useCallback(
    (e: Event) => {
      const message = (e as CustomEvent<string>).detail;
      if (message && !isLoading) {
        sendMessage({ text: message }, { body: { data: { context } } });
      }
    },
    [sendMessage, context, isLoading]
  );

  useEffect(() => {
    window.addEventListener('tidal:chat-message', handleSidebarMessage);
    return () => window.removeEventListener('tidal:chat-message', handleSidebarMessage);
  }, [handleSidebarMessage]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage(
      { text: input },
      { body: { data: { context } } }
    );
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-200">{depthConfig.label}</h2>
            <p className="text-xs text-slate-500">{depthConfig.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Connect Wallet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Welcome message when no messages yet */}
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white/5 text-slate-300 rounded-bl-md">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-cyan-400">Tidal</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {getWelcomeMessage(riskDepth ?? 'shallows')}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const textContent = getMessageText(message);
          const toolInvocations = getToolInvocations(message);
          return (
          <div key={message.id} className="space-y-2">
            {/* Text content */}
            {textContent && (
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-cyan-500/20 text-slate-100 rounded-br-md'
                      : 'bg-white/5 text-slate-300 rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-cyan-400">Tidal</span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {textContent}
                  </div>
                </div>
              </div>
            )}

            {/* Tool invocations */}
            {toolInvocations.length > 0 && (
              <div className="space-y-2">
                {toolInvocations.map((tool, idx) => {
                  // Get tool name from type (e.g., 'tool-prepareSwap' -> 'prepareSwap')
                  const toolName = tool.toolName || tool.type.replace('tool-', '');

                  // Show loading state for pending tool calls (v6 states)
                  if (tool.state === 'input-streaming' || tool.state === 'input-available') {
                    return (
                      <div
                        key={idx}
                        className="ml-7 flex items-center gap-2 text-sm text-slate-500"
                      >
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Checking {toolName}...
                      </div>
                    );
                  }

                  // Show result (v6: output-available instead of result)
                  if (tool.state === 'output-available') {
                    const result = tool.output as Record<string, unknown>;

                    // ActionCard for supply/withdraw/swap/vault actions
                    if (result.action && ['supply', 'withdraw', 'swap', 'swap_and_supply', 'vault_deposit', 'vault_withdraw'].includes(result.action as string)) {
                      return (
                        <ActionCard
                          key={idx}
                          action={result.action as string}
                          protocol={result.protocol as string | undefined}
                          provider={result.provider as string | undefined}
                          token={result.token as string | undefined}
                          amount={result.amount as string | undefined}
                          // Swap-specific props
                          fromToken={result.fromToken as string | undefined}
                          toToken={result.toToken as string | undefined}
                          fromTokenAddress={result.fromTokenAddress as string | undefined}
                          toTokenAddress={result.toTokenAddress as string | undefined}
                          fromDecimals={result.fromDecimals as number | undefined}
                          toDecimals={result.toDecimals as number | undefined}
                          chainId={result.chainId as number | undefined}
                          // Vault-specific props
                          vaultSlug={result.vaultSlug as string | undefined}
                          vaultName={result.vaultName as string | undefined}
                          curator={result.curator as string | undefined}
                          vaultAddress={result.vaultAddress as string | undefined}
                          underlyingAddress={result.underlyingAddress as string | undefined}
                          underlyingDecimals={result.underlyingDecimals as number | undefined}
                          description={result.description as string | undefined}
                          // Display props
                          estimatedApy={result.estimatedApy as number | undefined}
                          estimatedYearlyReturn={result.estimatedYearlyReturn as string | undefined}
                          steps={result.steps as ActionCardSteps}
                          risks={result.risks as string[] | undefined}
                          note={result.note as string | null | undefined}
                          onApprove={() => {
                            console.log('Approved:', result);
                          }}
                          onReject={() => {
                            console.log('Rejected:', result);
                          }}
                          onSuccess={(txHash) => {
                            console.log('Transaction success:', txHash);
                          }}
                          onError={(error) => {
                            console.error('Transaction error:', error);
                          }}
                        />
                      );
                    }

                    // Li.Fi quote card
                    if (result.fromToken && result.toToken && result.rate) {
                      return (
                        <LifiQuoteCard
                          key={idx}
                          fromToken={result.fromToken as string}
                          toToken={result.toToken as string}
                          fromAmount={result.fromAmount as string}
                          toAmount={result.toAmount as string}
                          rate={result.rate as number}
                          estimatedGas={result.estimatedGas as string | undefined}
                          route={result.route as string | undefined}
                          toolUsed={result.toolUsed as string | undefined}
                          executionTime={result.executionTime as string | undefined}
                        />
                      );
                    }

                    // AAVE rates card (array of rate objects)
                    if (Array.isArray(result) && result.length > 0 && result[0]?.supplyApy !== undefined) {
                      return (
                        <div
                          key={idx}
                          className="ml-7 rounded-xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/40 text-sm"
                        >
                          <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-cyan-500/15 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-500/20 flex items-center justify-center">
                                <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-cyan-300">AAVE V3 Yield Rates</span>
                            </div>
                            {(result[0] as { live?: boolean }).live && (
                              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live on Base
                              </span>
                            )}
                          </div>
                          <div className="p-4 space-y-2.5">
                            {(result as Array<{ token: string; supplyApy: number; protocol: string }>).map((rate) => (
                              <div key={rate.token} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                <div className="flex items-center gap-2.5">
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ring-1 ring-white/5 ${
                                    rate.token === 'USDC' ? 'bg-blue-500/20 text-blue-400' :
                                    rate.token === 'WETH' ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-teal-500/20 text-teal-400'
                                  }`}>
                                    {rate.token === 'USDC' ? '$' : rate.token === 'WETH' ? '\u039E' : rate.token[0]}
                                  </span>
                                  <div>
                                    <span className="text-slate-200 font-medium">{rate.token}</span>
                                    <div className="text-[10px] text-slate-500">{rate.protocol}</div>
                                  </div>
                                </div>
                                <span className="text-emerald-400 font-mono font-medium">{rate.supplyApy.toFixed(2)}%<span className="text-slate-500 ml-1 font-sans text-xs">APY</span></span>
                              </div>
                            ))}
                          </div>
                          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-600">Need a different token? Swap via Li.Fi first</span>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/15">
                              <svg className="w-2.5 h-2.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="text-[10px] font-medium text-cyan-400">Li.Fi</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Generic tool result - hide from UI (the AI will explain in text)
                    return null;
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        );})}


        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            Error: {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Tidal..."
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-2 text-center">
          Tidal will ask for approval before executing any transactions
        </p>
      </div>
    </div>
  );
}

function getWelcomeMessage(riskDepth: string): string {
  if (riskDepth === 'shallows') {
    return `Welcome to the Shallows - calm, protected waters.

I'm Tidal, your AI guide for DeFi yield. I'll keep you in safe harbors with battle-tested protocols.

I can help you:
- Earn steady yield on USDC via AAVE or Morpho vaults (~3-4% APY)
- Choose between institutional-grade vaults (Steakhouse, Gauntlet)
- Swap tokens via Li.Fi at the best rates

What would you like to explore?`;
  }

  if (riskDepth === 'mid-depth') {
    return `Welcome to Mid-Depth - stronger currents, better rewards.

I'm Tidal, your AI guide for DeFi yield. At this depth, I unlock reward-boosted vaults and higher-yield strategies.

I can help you:
- Access reward-boosted vaults (Moonwell, Extrafi, Clearstar) for higher APY
- Earn yield on ETH with dedicated WETH vaults
- Compare yields across all protocols in real-time

Ask me "What are the best yields right now?" to see what the currents are bringing in.`;
  }

  return `Welcome to Deep Water - strong currents, bigger rewards.

I'm Tidal, your AI guide for DeFi yield. Down here, I scan every opportunity and can execute multi-step strategies.

I can help you:
- Find the highest yields across all protocols on Base
- Execute complex strategies (swap + deposit in one flow)
- Access LP positions and reward-boosted pools

The deep ocean has the biggest waves. Let me know where you want to dive.`;
}

// Type for ActionCard steps
type ActionCardSteps = Array<{
  step: number;
  action: string;
  description: string;
  provider: string;
}>;
