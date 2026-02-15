"use client"

import { motion } from "motion/react"
import Container from "@/components/landing/Container"
import { staggerContainer, staggerItem, cardHover } from "@/lib/animations"

const useCases = [
  {
    persona: "The Curious Newcomer",
    quote:
      "I have 5,000 USDC sitting in my wallet doing nothing. I know I could earn yield but I don't know where to start.",
    response:
      "Tidal's AI will recommend strategies that match your risk comfort and explain exactly how they work.",
  },
  {
    persona: "The Busy Expert",
    quote:
      "I know how DeFi works but I don't have time to monitor positions and rebalance manually.",
    response:
      "Tidal watches your positions 24/7 and alerts you when action is needed. You approve, AI executes.",
  },
  {
    persona: "The Cautious Investor",
    quote: "I'm scared of making an expensive mistake in DeFi.",
    response:
      "Every Tidal recommendation explains the reasoning and risks. You stay in control, nothing happens without your approval.",
  },
]

export default function UseCases() {
  return (
    <section className="py-24 bg-white">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={staggerItem}
            className="mb-20 text-3xl font-bold text-text-primary md:text-4xl"
          >
            Tidal is for you if...
          </motion.h2>

          <div className="grid gap-6 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <motion.div
                key={useCase.persona}
                variants={staggerItem}
                whileHover={cardHover}
                className="flex flex-col rounded-2xl border border-card-border bg-card-bg p-8 transition-colors"
              >
                <div className="mb-4">
                  <span className="inline-block rounded-full bg-ocean-100 px-3 py-1 text-xs font-medium text-ocean-700">
                    {useCase.persona}
                  </span>
                </div>

                <blockquote className="mb-6 flex-1">
                  <p className="text-lg italic text-text-primary leading-relaxed">
                    &ldquo;{useCase.quote}&rdquo;
                  </p>
                </blockquote>

                <div className="border-l-2 border-tidal-primary pl-4">
                  <p className="text-text-secondary">
                    <span className="mr-2 text-tidal-primary">&rarr;</span>
                    {useCase.response}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
