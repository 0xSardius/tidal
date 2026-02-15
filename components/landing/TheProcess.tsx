"use client"

import { motion } from "motion/react"
import Image from "next/image"
import Container from "@/components/landing/Container"
import { staggerContainer, staggerItem } from "@/lib/animations"

interface Step {
  title: string
  description1: string
  description2: string
  bullets?: string[]
  imagePosition: "left" | "right"
  image: string | null
}

const steps: Step[] = [
  {
    title: "Choose Risk",
    description1: "Not everyone has the same appetite for risk — and that's okay. Tidal lets you choose how deep you want to go.",
    description2: "Whether you prefer the safety of calm waters or you're ready to explore stronger currents, our AI adapts its recommendations to match your comfort level.",
    bullets: [
      "Shallows — Calm, protected waters. Stablecoin strategies only (USDC, DAI). Lower returns, minimal volatility. Perfect if you're just getting started.",
      "Mid-Depth — Balanced currents. Everything in Shallows, plus ETH-based strategies. A mix of stability and growth potential.",
      "Deep Water — Stronger currents, bigger rewards. Access to multi-step strategies and higher-yield opportunities. For those comfortable with more complexity.",
    ],
    imagePosition: "left",
    image: "/Risk.png",
  },
  {
    title: "Chat with AI",
    description1: "Tidal isn't just another dashboard — it's a conversation.",
    description2: "Tell the AI what you want to achieve, and it will guide you through the options, explain the tradeoffs, and help you build a strategy that fits your goals. No jargon, no assumptions about what you already know.",
    bullets: [
      "Start with your goals, not protocols — Say \"I have 5,000 USDC and want passive income\" and the AI takes it from there",
      "Every recommendation is explained — No black boxes. You'll understand why the AI suggests what it does, and what the risks are",
      "Ask anything, anytime — Not sure what APY means? Curious why one protocol over another? Just ask",
      "The AI remembers your context — It knows your risk level, your past decisions, and what you've discussed before",
      "You stay in control — The AI proposes, you approve. Nothing happens without your say-so",
    ],
    imagePosition: "right",
    image: "/AIChat.png",
  },
  {
    title: "Let it Run",
    description1: "Once your strategy is live, Tidal's AI keeps watch so you don't have to.",
    description2: "It monitors your positions around the clock, tracking market conditions, protocol health, and yield opportunities — alerting you only when something actually needs your attention.",
    bullets: [
      "24/7 position monitoring — AI tracks APY changes, protocol risks, and market shifts while you sleep",
      "Smart alerts, not spam — Get notified when action is needed, not every time something moves",
      "Opportunity detection — AI spots better yields and asks if you want to catch the wave",
      "Emergency protection — If risk spikes, Tidal alerts you immediately with clear exit options",
      "You stay in control — Nothing happens without your approval. AI recommends, you decide.",
    ],
    imagePosition: "left",
    image: "/LetItRun.png",
  },
]

export default function TheProcess() {
  return (
    <section id="the-process" className="pt-24 pb-12 bg-white">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={staggerItem}
            className="mb-8 text-3xl font-bold tracking-tighter text-tidal-primary md:text-4xl"
          >
            The Process
          </motion.h2>

          <div className="space-y-16">
            {steps.map((step) => (
              <motion.div
                key={step.title}
                variants={staggerItem}
                className={`flex flex-col items-center gap-8 lg:gap-8 ${
                  step.imagePosition === "right"
                    ? "md:flex-row-reverse"
                    : "md:flex-row"
                } md:items-center`}
              >
                {/* Image or placeholder */}
                {step.image ? (
                  <div className="w-full md:w-1/2 aspect-square relative rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full md:w-1/2 aspect-square bg-ocean-100 rounded-xl shrink-0" />
                )}

                {/* Text content */}
                <div className="space-y-4">
                  <h3 className="mb-3 text-2xl font-semibold text-tidal-primary">
                    {step.title}
                  </h3>
                  <p className="text-ocean-900 max-w-md">{step.description1}</p>
                  <p className="text-ocean-900 max-w-md">{step.description2}</p>
                  {step.bullets && step.bullets.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1">
                      {step.bullets.map((bullet, index) => {
                        const dashIndex = bullet.indexOf(" — ")
                        if (dashIndex !== -1) {
                          const boldPart = bullet.substring(0, dashIndex)
                          const rest = bullet.substring(dashIndex)
                          return (
                            <li key={index} className="text-ocean-900 list-disc">
                              <span className="font-semibold text-ocean-900">{boldPart}</span>
                              {rest}
                            </li>
                          )
                        }
                        return (
                          <li key={index} className="text-text-secondary list-disc">
                            {bullet}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
