## Contents

- [Explore investments others have created](#as-a-new-user-to-tidal-i-would-like-to-explore-investments-that-others-have-created-so-i-can-invest-in-them-myself-or-use-them-as-a-template-for-my-own-investment)
- [Explore investment platforms](#as-an-investor-using-tidal-i-would-like-to-explore-the-different-investment-platforms-and-what-they-offer-so-i-can-make-an-informed-decision-about-where-i-would-like-to-put-my-money)
- [AI suggestions based on risk profile](#as-a-new-user-to-tidal-i-would-like-to-receive-suggestions-from-the-ai-based-on-my-risk-profile-as-i-dont-fully-understand-what-options-there-are-for-me-in-the-defi-ecosystem)
- [Regular investment updates](#as-a-user-with-an-ongoing-active-investment-i-would-like-to-receive-regular-updates-on-my-investment-so-i-can-be-hands-off-but-still-know-how-it-is-doing-and-what-updates-there-are)
- [Chat interface for goal discussion](#as-someone-who-is-familiar-with-ai-but-new-to-crypto-i-would-like-to-use-the-chat-interface-to-discuss-with-the-agent-what-my-goals-are-and-for-them-to-suggest-and-educate-me-on-ways-i-can-invest)
- [Backtesting and historical performance](#as-someone-who-is-familiar-with-defi-i-would-like-the-agent-to-show-me-how-my-investment-wouldve-done-in-a-previous-timeframe-in-order-to-assess-whether-or-not-future-returns-might-be-profitable)
- [Emergency exit when risk is high](#as-someone-who-is-new-to-investing-i-would-like-the-agent-to-help-me-get-out-of-my-positions-if-risk-is-too-high-so-i-dont-have-to-manually-exit)
- [Use existing wallet](#as-an-existing-defi-user-i-would-like-to-use-my-current-wallet-in-this-system-so-that-i-dont-have-to-move-assets-to-a-new-wallet)
- [Fiat onramp to smart wallet](#as-someone-who-is-new-to-defi-i-would-like-to-onramp-assets-from-my-fiat-bank-account-to-my-new-smart-wallet-so-that-i-can-begin-investing-in-strategies)

---

## Overarching user outcomes

**Functional outcomes** - what the user tangibly achieves:
- They earn yield on idle assets (stablecoins, ETH)
- They can deploy fund into different DeFi protocols without manual protocol research or even interacting with the protocol directly
	- Security is paramount in web3, how might we ensure that users feel safe that they are interacting with a legitimate pool?
- The positions rebalances when better opportunities appear
- They can potentially increase their returns by investing in protocol they wouldn't otherwise have invested in before using Tidal

**Emotional outcomes** - how users feel when using Tidal:
- Confidence navigating DeFi without domain expertise
- Not feeling left behind or excluded from DeFi opportunities they don't know about, haven't heard of, or understand how they work
- Overall reduced anxiety about "doing it wrong"
- Trust that there is an agent watching their positions

**Knowledge outcomes** - what users learn when using Tidal:
- Grasp of basic DeFi concepts (APY, liquidity, risk tiers)
- Understand why certain strategies work
- The ability to make more informed decisions over time

**Time / effort** outcomes:
- No daily monitoring required
- No protocol comparison research required
- No manual transactions orchestration required
- No wallet set up, Tidal sets up smart account wallets on their behalf


----
----

## User Stories

#### As a new user to Tidal, I would like to explore investments that others have created, so I can invest in them myself or use them as a template for my own investment

- This ties into a social aspect of discovery
- What have others done? How successful have they been?
- How did they create these? How can I reuse or create my own strategies?
- There is the potential to turn what would be an investment platform into one with a social aspect
- Potential for people to gain a reputation for suggesting and creating strategies with higher gains, maybe a reputation system
- An MVP would most likely have some simple features like existing investment strategies, but by adding a social element it could extend user base and community engagement 

#### UI / UX features for this story

- A discover section with cards of different strategies
- These cards give some information such as APY, risk assessment, protocols at a glance
- An option to click into the strategy and see more information?
- A button that prompts a fork / reuse of this strategy for their own investments
	- Eventually this might be an established AI vault with many people investing in it
	- Check [[Tidal Future Features]] for thoughts on how this might work

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATES TO DISCOVER SECTION                                       │
│                                                                             │
│    User clicks "Discover" in main navigation                                │
│    Sees a feed/grid of strategies created by other users                    │
│    Can filter by: risk level, APY range, protocol, popularity               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Browses strategies
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. STRATEGY CARDS                                                           │
│                                                                             │
│    Each card displays at a glance:                                          │
│    - Strategy name and creator                                              │
│    - Current APY / historical performance                                   │
│    - Risk tier badge (Shallows / Mid / Deep)                                │
│    - Protocols used (e.g. AAVE, Yearn icons)                                │
│    - Number of users / total value locked                                   │
│    - Creator reputation score (if applicable)                               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Clicks on a strategy
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. STRATEGY DETAIL PAGE                                                     │
│                                                                             │
│    Expanded view showing:                                                   │
│    - Full breakdown of allocation (e.g. 60% Yearn, 40% AAVE)                │
│    - Performance chart over time                                            │
│    - Risk analysis and explanation                                          │
│    - Comments or reviews from other users                                   │
│    - Creator profile and track record                                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User decides
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. DECISION POINT                                                           │
│                                                                             │
│    User has options:                                                        │
│    ├─► "Invest in this strategy" → Direct investment (if public vault)      │
│    ├─► "Fork this strategy" → Copy as template for customisation            │
│    └─► "Back to Discover" → Continue browsing                               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Selects Fork
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. FORK & CUSTOMISE                                                         │
│                                                                             │
│    Strategy is copied to user's account as a starting point                 │
│    User enters chat interface with:                                         │
│    - Forked strategy pre-loaded as context                                  │
│    - AI ready to help customise: "I see you've forked a Mid-depth           │
│      stablecoin strategy. Would you like to adjust the allocation?"         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Customisation complete
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. DEPLOY PERSONALISED STRATEGY                                             │
│                                                                             │
│    User reviews final strategy with AI assistance                           │
│    Approves transaction → funds deployed                                    │
│    Strategy now appears in user's portfolio                                 │
│    Optional: make strategy public for others to discover                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### As an investor using Tidal, I would like to explore the different investment platforms and what they offer, so I can make an informed decision about where I would like to put my money

- This can double up as a discovery and educational aspect to the application
- The user can see protocols or investment opportunities they don't know about
- By interacting with them in some way, they are given a walkthrough of how it works
- They should be able to visit the website, and see the contracts in some way so that there is a sense of legitimacy?
- They could be prompted to make an investment from this page - "create investment" - which takes them to a chat window with context or riskDepth already in place to begin
- If it was Aave v3 Lending, the app would have a page called /learn/aave-v3-lending or something to that effect
- As more protocols and DeFi opportunities become integrated, it would be good to try and teach our users what they are and how to use them, this will increase the amount of people investing and generally raise knowledge levels of web3 products.

#### UI / UX features for this story

- As well as a Discover section, there could also be a Learn section
- The idea is to teach users about potential investments and the things they can do on DeFi
- For example "What is Liquidity Provision?" or "What is Yield Farming?"
- There is an opportunity to promote certain protocols within each, and a user could begin an investment strategy after learning about it
- We could group these by investment type, or even by chain or network as this evolves and more protocols are brought into the Tidal application
- Platforms could have their own "storefronts" almost like a marketplace page with the different things they offer

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATES TO LEARN SECTION                                          │
│                                                                             │
│    User clicks "Learn" in main navigation                                   │
│    Sees categories of investment types available in DeFi                    │
│    e.g. Lending, Liquidity Provision, Yield Farming, Staking                │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Selects a category
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. BROWSE PROTOCOLS IN CATEGORY                                             │
│                                                                             │
│    User sees list of integrated protocols offering this investment type     │
│    e.g. for Lending: AAVE v3, Compound, Morpho                              │
│    Each shows: name, chain, current APY range, TVL                          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Selects a protocol
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. PROTOCOL STOREFRONT PAGE                                                 │
│    e.g. /learn/aave-v3-lending                                              │
│                                                                             │
│    - Overview: what this protocol does, how it works in plain language      │
│    - Key stats: TVL, supported assets, current APYs                         │
│    - Risk info: audit status, time in market, known incidents               │
│    - Trust signals: link to official site, contract addresses               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User reads and understands
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. DECISION POINT                                                           │
│                                                                             │
│    User feels informed about the protocol                                   │
│    Ready to invest? ─────┬───────────────────┐                              │
│                          │                   │                              │
│                         YES                  NO → Return to Browse          │
│                          │                                                  │
│                          ▼                                                  │
│              Click "Create Investment with AAVE"                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Opens chat interface
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. CHAT INTERFACE WITH CONTEXT                                              │
│                                                                             │
│    Chat opens with pre-loaded context:                                      │
│    - Protocol selected (AAVE v3 Lending)                                    │
│    - User's riskDepth already set from onboarding                           │
│    - AI understands user wants to explore this specific protocol            │
│                                                                             │
│    AI: "I see you're interested in AAVE v3 Lending. Based on your          │
│    mid-depth risk profile, here's what we can do..."                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Conversational guidance
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. AI GUIDES USER THROUGH FIRST POSITION                                    │
│                                                                             │
│    - AI asks clarifying questions (amount, duration, goals)                 │
│    - AI recommends specific strategy using this protocol                    │
│    - User approves → transaction executes                                   │
│    - User's first position is created                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

#### As a new user to Tidal, I would like to receive suggestions from the AI based on my risk profile, as I don't fully understand what options there are for me in the DeFi ecosystem

- The user inputs their risk appetite when they onboard to the application
- They are taken to a Discover page where they can browse strategies that others have created that match their appetite and "fork" it if they want to
- They can see example starter templates that match their riskDepth, streamlining the process of creating a vault strategy to actually using one
- AI memory could be useful aspect here, could the AI "interview" the user to assess their knowledge of DeFi and retain this information? 
- Could this be gamified in some way?

#### UI / UX features for this story

- The onboarding section asks for risk depth, and this could be used elsewhere in the application for various reasons
- It could be next to their wallet profile, and there might be an option for them to increase their risk more general - if they get more comfortable with DeFi
- Or they may wish to increase their risk tolerance for a particular strategy - if they maybe have $100 they just want to experiment with
- When a user begins a chat, they should be able to see their risk depth and confirm whether or not they want to continue with this, or increase / decrease it.
- If they are on Discover or Learn, they may get suggestions of things they'd like to investigate or learn about that matches their risk
- If they are on a chat, maybe they are suggested some protocol which matches their appetitie

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER ONBOARDS TO TIDAL                                                   │
│                                                                             │
│    User creates account via Privy (email/social)                            │
│    Smart wallet is created automatically                                    │
│    User is prompted to select their risk depth (Shallows / Mid / Deep)      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Risk profile saved
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AI KNOWLEDGE INTERVIEW (OPTIONAL)                                        │
│                                                                             │
│    AI asks a few questions to gauge DeFi familiarity:                       │
│    - "Have you used DeFi protocols before?"                                 │
│    - "Are you familiar with concepts like APY and liquidity?"               │
│    This information is stored in AI memory for future context               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Profile complete
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. PERSONALISED DISCOVER PAGE                                               │
│                                                                             │
│    User lands on Discover section                                           │
│    Content is filtered/sorted by their riskDepth:                           │
│    - Shallows user sees: stablecoin strategies, low-risk vaults             │
│    - Mid-depth user sees: above + ETH strategies, balanced options          │
│    - Deep water user sees: all strategies including higher-risk options     │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User browses
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. AI-POWERED SUGGESTIONS                                                   │
│                                                                             │
│    Throughout the app, AI surfaces relevant suggestions:                    │
│    - "Based on your risk profile, you might like this strategy..."          │
│    - "Users with similar preferences have invested in..."                   │
│    - Starter templates matching their riskDepth are highlighted             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User selects a suggestion
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. FORK OR CREATE                                                           │
│                                                                             │
│    User can:                                                                │
│    ├─► Fork an existing strategy → customise with AI help                   │
│    └─► Use a starter template → AI guides through setup                     │
│                                                                             │
│    Risk depth is visible and adjustable:                                    │
│    "Your current risk level: Mid-depth [Change]"                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Enters chat
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. CHAT WITH CONTEXT                                                        │
│                                                                             │
│    AI has full context:                                                     │
│    - User's risk depth                                                      │
│    - Their DeFi knowledge level (from interview)                            │
│    - The strategy/template they selected                                    │
│                                                                             │
│    AI tailors explanations and suggestions accordingly                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### As a user with an ongoing active investment, I would like to receive regular updates on my investment, so I can be hands off but still know how it is doing and what updates there are

- How might we let a user know about their investment? They might be coming onto the website a lot so we could use something like notifications?
- They might take a hands off approach, so can we ping them an email or some sort of notification to an external app to let them know their progress and if they need to do anything?
- This might be too much for this hackathon as it could potentially involve external applications for notifications but still something worth thinking about

#### UI / UX features for this story

- Maybe there is a notifications sections of the application which highlights what the AI has been doing, whether this has been checking over the risk of an investment, or rebalancing / any other actions they take
- It would be cool if there was the ability to insert an email address, or even a telegram chat which could send regular updates to the user
- Integrating with something like Telegram might be a really nice direction to think about, and something that many crypto users are already using
- New users may not have Telegram however, so other ways of notifying user should be thought of
- This maybe isn't needed for an MVP, but still good to think about

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER HAS ACTIVE INVESTMENT                                               │
│                                                                             │
│    User has deployed funds into a strategy                                  │
│    AI is monitoring the position in the background                          │
│    User goes about their day — no need to check constantly                  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Time passes / Events occur
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AI DETECTS NOTEWORTHY EVENT                                              │
│                                                                             │
│    AI monitors for:                                                         │
│    - Significant APY changes (up or down)                                   │
│    - Risk threshold breaches                                                │
│    - Rebalancing opportunities                                              │
│    - Protocol issues or warnings                                            │
│    - Periodic performance summaries (daily/weekly)                          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Notification triggered
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. NOTIFICATION DELIVERY                                                    │
│                                                                             │
│    Based on user preferences, alert is sent via:                            │
│    ├─► In-app notification (badge, toast, notification centre)              │
│    ├─► Email summary                                                        │
│    ├─► Telegram message (crypto-native users)                               │
│    └─► Push notification (mobile, future)                                   │
│                                                                             │
│    Message includes: what happened, current status, suggested action        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User receives alert
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. USER REVIEWS UPDATE                                                      │
│                                                                             │
│    User clicks notification → taken to relevant context                     │
│    Options:                                                                 │
│    ├─► View details in dashboard                                            │
│    ├─► Open chat to discuss with AI                                         │
│    └─► Quick action buttons (Approve rebalance / Dismiss / Snooze)          │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User decides
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. ACTION OR ACKNOWLEDGEMENT                                                │
│                                                                             │
│    If action required:                                                      │
│    - User approves AI recommendation → transaction executes                 │
│    - User wants to discuss → enters chat with context loaded                │
│    - User dismisses → AI logs and continues monitoring                      │
│                                                                             │
│    If informational only:                                                   │
│    - User acknowledges → marked as read                                     │
│    - AI continues background monitoring                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### As someone who is familiar with AI but new to crypto, I would like to use the chat interface to discuss with the agent what my goals are, and for them to suggest and educate me on ways I can invest 

- This story revolves around how a user interacts with the AI through chat specifically
- How much can they do manually? For example, can they select a protocol from a list and drop that in as context for the AI to investigate 
- Are they limited to one chat? Or do we create something like "projects" that you see in the likes of Claude and ChatGPT where several chats are related to one overarching goal
- As opposed to Projects, these could be defined as Strategies and have a goal, the different chats within it could potentially explore protocols on different chains, or different types of investment
- This might be something that isn't feasible within the timeframes of the hackathon, and with the limited amount of protocol we are aiming to integrate

#### UI / UX features for this story

- Could there be some sort of select interface within a singular chat, like Claude can ask you clarifying questions, that can build up the chat context and point the user in the right direction?
- How might we make the interface so that a user can click to explore protocols and potential investments as opposed to purely chat - this balance between self-exploration and chat could be a powerful combination
	- The right hand side of the screen would most likely be the place this happens
- As opposed to having chats in the sidebar menu, could we have what are essentially folder that take you to a strategy space, like a Claude project space? 
- The user could pass instructions, or it takes context from their preferences, and chats are related to the goals they wish to achieve. For example they may want a chat that focusses on one protocol or one network specifically
- This context could then be used to build up an overall strategy

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS CHAT INTERFACE                                               │
│                                                                             │
│    User clicks "New Strategy" or opens chat from dashboard                  │
│    Interface shows:                                                         │
│    - Chat panel (centre)                                                    │
│    - Context panel (right) — shows protocols, assets, suggestions           │
│    - Strategy folders (left sidebar)                                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User starts conversation
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AI INITIATES GOAL DISCOVERY                                              │
│                                                                             │
│    AI asks clarifying questions to understand intent:                       │
│    - "What are you hoping to achieve with your investment?"                 │
│    - "Do you have a specific amount in mind?"                               │
│    - "Are you looking for steady income or growth?"                         │
│                                                                             │
│    User responds naturally: "I have 5000 USDC and want passive income"      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Context builds up
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. INTERACTIVE EXPLORATION                                                  │
│                                                                             │
│    As conversation progresses:                                              │
│    - Right panel updates with relevant protocols                            │
│    - User can click protocols to add them to chat context                   │
│    - AI explains options in plain language, adapting to knowledge level     │
│                                                                             │
│    AI: "Based on your goals, let me show you a few options..."              │
│    [Protocol cards appear in right panel for user to explore]               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User drills deeper
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. STRATEGY WORKSPACE (PROJECT-STYLE)                                       │
│                                                                             │
│    Chat is organised into a "Strategy" folder:                              │
│    📁 "Passive Income Strategy"                                             │
│    ├── 💬 Main goals chat                                                   │
│    ├── 💬 AAVE exploration                                                  │
│    └── 💬 Yearn vs Compound comparison                                      │
│                                                                             │
│    Each sub-chat focuses on specific aspect, all share strategy context     │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Strategy takes shape
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. AI SYNTHESISES RECOMMENDATION                                            │
│                                                                             │
│    AI consolidates learnings from all chats:                                │
│    "Based on our conversations, here's what I'd recommend:                  │
│     - 60% to Yearn USDC vault (4.2% APY)                                    │
│     - 40% to AAVE for liquidity (3.8% APY)                                  │
│     This matches your passive income goal with mid-depth risk."             │
│                                                                             │
│    User can ask follow-up questions or request adjustments                  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User approves
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. EXECUTE & SAVE                                                           │
│                                                                             │
│    User confirms strategy → transactions execute                            │
│    Strategy is saved to portfolio with all context retained                 │
│    Future chats in this strategy folder maintain full history               │
│    AI can reference past decisions: "Last time you preferred..."            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### As someone who is familiar with DeFi, I would like the agent to show me how my investment would've done in a previous timeframe, in order to assess whether or not future returns might be profitable

- Again this would probably be in the chat window interface, or projects interface
- Is there a way we could run a simulation of how the developed strategy would've performed over the course of the past six months?
- This could be a crucial aspect for user to make their minds up about how they put a strategy together and what elements constitute it
- Probably out of scope for the hackathon, but an excellent nice-to-have at some point

#### UI / UX features for this story

- With the chat interface, or maybe at the project level there is a backtester where the AI can run through how well the investment would've done over the course of say 6 months
- Maybe the AI within a particular chat could ask "Want me to backtest this strategy for you?" or something to that effect
- Is there some way it could run some predictions on how well the pool would do based on certain market conditions, for example "if ETH was to drop below $2,000 this is how well the strategy would work"
- A premium feature could be a back tester and prediction analyst, however it would need to specify that this is not financial advice and a user should rely on this analysis as the crypto market is volatile

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER IS BUILDING A STRATEGY                                              │
│                                                                             │
│    User is in chat interface, working on a strategy with AI                 │
│    They've defined allocation: 60% Yearn USDC, 40% AAVE                     │
│    Before committing funds, they want to validate the approach              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Wants to test before investing
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AI OFFERS BACKTESTING                                                    │
│                                                                             │
│    AI prompts: "Would you like me to backtest this strategy?                │
│    I can show you how it would have performed over the last 6 months."      │
│                                                                             │
│    Or user asks directly: "How would this have done last year?"             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User confirms
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. BACKTESTING ENGINE RUNS                                                  │
│                                                                             │
│    System simulates strategy against historical data:                       │
│    - Fetches historical APY data for each protocol                          │
│    - Simulates compounding and rebalancing events                           │
│    - Accounts for gas costs and slippage                                    │
│    - Calculates total return vs holding stables                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Results ready
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. RESULTS DISPLAY                                                          │
│                                                                             │
│    Visual presentation in chat/right panel:                                 │
│    - Performance chart over selected timeframe                              │
│    - Key metrics: total return %, max drawdown, volatility                  │
│    - Comparison: "Your strategy vs just holding USDC"                       │
│    - Breakdown by protocol contribution                                     │
│                                                                             │
│    ⚠️ Disclaimer: "Past performance does not guarantee future results"      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User reviews
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. SCENARIO ANALYSIS (OPTIONAL)                                             │
│                                                                             │
│    AI offers stress testing:                                                │
│    "Want to see how this would perform in different conditions?"            │
│                                                                             │
│    Scenarios:                                                               │
│    ├─► "What if ETH drops 30%?"                                             │
│    ├─► "What if AAVE APY drops to 1%?"                                      │
│    └─► "What happens in a market crash like March 2020?"                    │
│                                                                             │
│    User selects scenario → AI shows projected impact                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User decides
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. DECISION POINT                                                           │
│                                                                             │
│    Based on backtest results, user can:                                     │
│    ├─► "Looks good, deploy this strategy" → Execute                         │
│    ├─► "I want to adjust the allocation" → Back to chat                     │
│    └─► "Show me alternatives" → AI suggests variations                      │
│                                                                             │
│    All backtest results saved to strategy history for reference             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---
#### As someone who is new to investing, I would like the agent to help me get out of my positions if risk is too high, so I don't have to manually exit 

- This maybe ties into the notification aspect of the application
- If something happens, like a black swan event, or deteriorating market conditions, the AI can prompt the user about it
- It could allow the user to exit their strategy back to stablecoins, or some other asset like ETH if they desired

#### UI / UX features for this story

- Very much based on the notifications detailed elsewhere
- There could be an exit strategy screen which is a special chat - the UI should convey that is dangerous - and give the users options and showcase the evidence that has prompted the action from the user
- It would be ideal if there was options, such as "Stay put", "Close strategy and return to USDC", "Convert everything to ETH and stake in Lido" as some examples

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER HAS ACTIVE POSITION                                                 │
│                                                                             │
│    User has funds deployed in a strategy                                    │
│    AI continuously monitors:                                                │
│    - Protocol health and TVL changes                                        │
│    - Market conditions and volatility                                       │
│    - Smart contract risks and exploits                                      │
│    - APY degradation                                                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Risk event detected
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AI DETECTS HIGH RISK CONDITION                                           │
│                                                                             │
│    Triggers could include:                                                  │
│    - Protocol exploit or hack reported                                      │
│    - Sudden TVL drop (potential bank run)                                   │
│    - Market crash / black swan event                                        │
│    - Smart contract vulnerability disclosed                                 │
│    - Stablecoin depeg                                                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Urgent alert triggered
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. URGENT NOTIFICATION                                                      │
│                                                                             │
│    ⚠️ HIGH PRIORITY ALERT sent via all channels:                            │
│    - Push notification / SMS (if enabled)                                   │
│    - Email with "URGENT" flag                                               │
│    - Telegram alert                                                         │
│    - In-app banner (red/warning styling)                                    │
│                                                                             │
│    Message: "Risk detected in your strategy. Immediate action recommended." │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User opens app
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. EMERGENCY EXIT INTERFACE                                                 │
│                                                                             │
│    Special "danger mode" UI (red accents, clear warnings)                   │
│    AI presents:                                                             │
│    - What happened (evidence and sources)                                   │
│    - Current exposure and risk level                                        │
│    - Recommended action with reasoning                                      │
│                                                                             │
│    "A vulnerability was disclosed in Protocol X. Your exposure: $2,400.     │
│     I recommend exiting this position immediately."                         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User reviews options
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. EXIT OPTIONS                                                             │
│                                                                             │
│    Clear action buttons with consequences explained:                        │
│                                                                             │
│    [🔴 Emergency Exit to USDC]                                              │
│    "Withdraw all funds immediately, convert to USDC"                        │
│    Estimated gas: $2.50 | Time: ~30 seconds                                 │
│                                                                             │
│    [🟡 Exit to ETH]                                                         │
│    "Withdraw and convert to ETH for safety"                                 │
│                                                                             │
│    [🟢 Stay Put]                                                            │
│    "I understand the risk and want to maintain position"                    │
│                                                                             │
│    [💬 Discuss with AI]                                                     │
│    "I have questions before deciding"                                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User selects action
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. EXECUTION & CONFIRMATION                                                 │
│                                                                             │
│    If exit selected:                                                        │
│    - Transaction preview with final amounts                                 │
│    - One-click approval (streamlined for urgency)                           │
│    - Real-time progress: "Withdrawing... Swapping... Complete ✓"            │
│    - Confirmation: "Funds secured. $2,380 USDC now in your wallet."         │
│                                                                             │
│    If stay put:                                                             │
│    - User acknowledges risk                                                 │
│    - AI continues monitoring with heightened alertness                      │
│    - Sets reminder to check in 24 hours                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### As an existing DeFi user, I would like to use my current wallet in this system, so that I don't have to move assets to a new wallet 

- Is there some way we could import an existing EOA wallet a user has funds on to use Tidal
- EIP-7702: Set EOA Account Code was included in Ethereum Pectra update which could be used to do this
- This would mean that new users could create their own wallets, but it also gives existing web3 users a way to use what they already have in place. There is always the option of them sending funds to their new wallet if they wish
- Could there be some way that a user could connect more than one wallet, for example if they want to be more risky with one account but safe and steady with another

#### UI / UX features for this story

- When the user is onboarding they are prompted whether or not they want to set up a smart wallet, or they can connect an existing EOA account
- I'm not sure if there is a transaction involved in EIP-7702, but this would be the place where the user can allow their EOA to behave like a smart wallet
- Later on, in a settings page, they can connect other accounts and switch between them if they want to try different strategies and risk depth in different scenarios

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. USER ARRIVES AT ONBOARDING                                               │
│                                                                             │
│    Existing DeFi user lands on Tidal                                        │
│    They already have funds in their EOA wallet (MetaMask, Rainbow, etc.)    │
│    Don't want to transfer assets to a new wallet                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Clicks "Get Started"
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. WALLET CONNECTION OPTIONS                                                │
│                                                                             │
│    User presented with choice:                                              │
│                                                                             │
│    [🆕 Create Smart Wallet]                                                 │
│    "New to crypto? We'll set up a wallet for you"                           │
│    → Uses Privy + Coinbase Smart Wallet                                     │
│                                                                             │
│    [🔗 Connect Existing Wallet]                                             │
│    "Already have a wallet? Connect it here"                                 │
│    → Supports MetaMask, Rainbow, WalletConnect, etc.                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Selects "Connect Existing"
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. WALLET CONNECTION                                                        │
│                                                                             │
│    Standard wallet connection flow:                                         │
│    - User selects their wallet provider                                     │
│    - Wallet popup requests signature (no transaction, just auth)            │
│    - Tidal reads wallet address and balances                                │
│                                                                             │
│    "Connected: 0x1234...5678"                                               │
│    "Detected: 2.5 ETH, 5,000 USDC, 1,000 DAI"                                │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Wallet connected
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. EIP-7702 UPGRADE (OPTIONAL)                                              │
│                                                                             │
│    AI explains benefits of smart account features:                          │
│    "Your wallet can gain smart account capabilities while keeping           │
│     the same address. This enables batched transactions and gas             │
│     sponsorship. Would you like to enable this?"                            │
│                                                                             │
│    [✨ Enable Smart Features]  →  Signs EIP-7702 authorization              │
│    [⏭️ Skip for Now]          →  Continue with standard EOA                 │
│                                                                             │
│    ℹ️ "You can enable this later in Settings"                               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Completes setup
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. RISK PROFILE & PREFERENCES                                               │
│                                                                             │
│    Standard onboarding continues:                                           │
│    - Select risk depth (Shallows / Mid / Deep)                              │
│    - Optional AI knowledge interview                                        │
│    - Notification preferences                                               │
│                                                                             │
│    Portfolio auto-populated with detected assets                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Ready to use Tidal
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. MULTI-WALLET MANAGEMENT (FUTURE)                                         │
│                                                                             │
│    In Settings, user can:                                                   │
│    - Connect additional wallets                                             │
│    - Switch between wallets                                                 │
│    - Set different risk profiles per wallet                                 │
│                                                                             │
│    Example use case:                                                        │
│    📁 Main Wallet (0x1234) — Mid-depth, long-term strategies                │
│    📁 Play Wallet (0x5678) — Deep water, experimental strategies            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### As someone who is new to DeFi, I would like to onramp assets from my fiat bank account to my new smart wallet, so that I can begin investing in strategies 

- Many new users may not have crypto, and this is a potential pain point for people onboarding into the system
- A way to use an onboarding service like Transkt would be beneficial here
- The system should be able to detect what assets the wallet contains and prompt if its empty
- If the user is looking at a particular strategy that uses ETH for example, and they only have USDC in their accounts, it could prompt them to swap use Li.Fi

#### UI / UX features for this story

- Post onboarding, there could be a notification in the sidebar, or a info card at the top of the application prompting a user to fund their account
- If the user is on a DeFi product that they don't have the correct assets for, they should be prompted to swap using something like Li Fi

#### Potential User flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. NEW USER COMPLETES ONBOARDING                                            │
│                                                                             │
│    User has created account and smart wallet via Privy                      │
│    Wallet is empty — no crypto assets yet                                   │
│    User wants to start investing but has no funds                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ System detects empty wallet
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. FUNDING PROMPT                                                           │
│                                                                             │
│    Tidal detects empty wallet and shows friendly prompt:                    │
│                                                                             │
│    💰 "Let's get some funds into your wallet"                               │
│    "You'll need crypto to start investing. Choose how to fund:"             │
│                                                                             │
│    [💳 Buy with Card]     → Fiat onramp (Transak, MoonPay, etc.)            │
│    [🏦 Bank Transfer]     → ACH/Wire transfer                               │
│    [📤 Transfer Crypto]   → Send from another wallet                        │
│    [⏭️ I'll do this later] → Skip for now                                   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Selects "Buy with Card"
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. ONRAMP INTEGRATION                                                       │
│                                                                             │
│    Embedded onramp widget (Transak/MoonPay) appears:                        │
│    - User selects fiat currency (USD, EUR, GBP, etc.)                       │
│    - User selects crypto to receive (USDC recommended for beginners)        │
│    - User enters amount                                                     │
│    - Completes KYC if required (first time only)                            │
│    - Enters payment details                                                 │
│                                                                             │
│    Tidal pre-fills wallet address — user doesn't need to copy/paste         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Payment processing
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. CONFIRMATION & ARRIVAL                                                   │
│                                                                             │
│    Transaction submitted:                                                   │
│    "Your $500 USD → USDC purchase is processing"                            │
│    "Estimated arrival: 5-10 minutes"                                        │
│                                                                             │
│    When funds arrive:                                                       │
│    ✅ "500 USDC has arrived in your wallet!"                                │
│    "You're ready to start investing"                                        │
│                                                                             │
│    [🚀 Explore Strategies]  [💬 Chat with AI]                               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ User starts exploring
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. CONTEXTUAL SWAP PROMPTS (ONGOING)                                        │
│                                                                             │
│    As user browses, Tidal detects asset mismatches:                         │
│                                                                             │
│    User viewing ETH staking strategy but only has USDC:                     │
│    💡 "This strategy requires ETH. Want to swap some USDC → ETH?"           │
│    [Swap with Li.Fi] — shows best rate across DEXs                          │
│                                                                             │
│    User wants to try strategy on different chain:                           │
│    💡 "This strategy is on Arbitrum. Bridge your USDC?"                     │
│    [Bridge with Li.Fi] — handles cross-chain transfer                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ Seamless asset management
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. LOW BALANCE ALERTS                                                       │
│                                                                             │
│    Tidal monitors wallet and proactively notifies:                          │
│                                                                             │
│    ⚠️ "Your wallet balance is running low"                                  │
│    "You have $50 USDC remaining. Top up to continue investing?"             │
│                                                                             │
│    [💳 Add Funds]  [📊 View Portfolio]  [Dismiss]                           │
│                                                                             │
│    Also warns before transactions that would drain wallet:                  │
│    "This will use 95% of your balance. Continue?"                           │
└─────────────────────────────────────────────────────────────────────────────┘
```
