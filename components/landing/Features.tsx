"use client"

import { motion } from "motion/react"
import Container from "@/components/landing/Container"
import { BrainIcon, SliderIcon, EyeIcon } from "@/components/landing/icons"
import { staggerContainer, staggerItem, cardHover } from "@/lib/animations"

const features = [
  {
    icon: BrainIcon,
    title: "Personalized investment strategies",
    description:
      "Share your goals, timeline, and comfort level. Tidal's AI crafts strategies that fit your life and goals.",
  },
  {
    icon: SliderIcon,
    title: "Learn & discover DeFi opportunities",
    description:
      "No black boxes here. Every suggestion includes the why, so you understand DeFi as you use it.",
  },
  {
    icon: EyeIcon,
    title: "Hands off management & risk monitoring",
    description:
      "Set it and stay informed. Tidal monitors your positions around the clock and alerts you when needed.",
  },
]

export default function Features() {
  return (
    <section id="features" className="pt-24 pb-12 bg-white">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="flex flex-col"
        >
          <motion.h2
            variants={staggerItem}
            className="mb-8 text-3xl font-bold tracking-tighter text-tidal-primary md:text-4xl"
          >
            What makes Tidal different
          </motion.h2>

          <div className="grid w-full gap-3 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                whileHover={cardHover}
                className="flex flex-col items-start rounded-xl bg-[#E0F2FE] p-4 pb-8 text-start transition-colors"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tidal-primary/10 text-tidal-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold leading-tight text-ocean-900 tracking-tighter">
                  {feature.title}
                </h3>
                <p className="text-ocean-900 leading-snug">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
