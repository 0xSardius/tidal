"use client"

import { motion } from "motion/react"
import Image from "next/image"
import Container from "@/components/landing/Container"
import LaunchAppButton from "@/components/landing/LaunchAppButton"
import { heroStagger, fadeInUp } from "@/lib/animations"

export default function Hero() {
  return (
    <section className="relative min-h-[80vh] flex flex-col bg-linear-to-br from-ocean-200 to-ocean-50 pt-16 overflow-hidden">
      {/* Animated wave background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          backgroundImage: "linear-gradient(45deg, var(--ocean-50), var(--ocean-100), var(--ocean-300), var(--ocean-400), var(--ocean-50))",
          backgroundSize: "300% 300%",
          opacity: 0.4,
        }}
      />
      <Container className="relative z-10 px-0 flex-1 flex flex-col">

        <div className="flex-1 flex items-center">
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start text-start px-6"
        >
          <div className="flex flex-col gap-0">
          <motion.h1
            variants={fadeInUp}
            className="w-full text-4xl font-bold leading-tighter tracking-tighter text-ocean-900 md:text-5xl lg:text-7xl mb-1"
          >
            When AI meets DeFi,
          </motion.h1>
          <motion.h1
            variants={fadeInUp}
            className="w-full text-4xl font-bold leading-tighter tracking-tighter text-tidal-primary md:text-5xl lg:text-7xl mb-1"
          >
            possibilities arise.
          </motion.h1>
          </div>

          <motion.p
            variants={fadeInUp}
            className="w-3/4 mt-6 text-lg text-ocean-900 md:text-xl"
          >
            Tidal is your AI-powered guide to DeFi. Tell it your goals, choose your risk level, and let it handle the rest — from finding the best strategies to monitoring your positions 24/7.
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="w-3/4 mt-2 text-lg text-ocean-900 md:text-xl"
          >
            Every recommendation explained. <span className="font-bold">Every decision yours.</span>
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-8">
            <LaunchAppButton size="large" className="bg-ocean-900 hover:bg-ocean-800" />
          </motion.div>
        </motion.div>
        </div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="pb-8 flex items-center justify-center gap-3"
        >
          <span className="text-sm text-ocean-700">Built as part of <span className="font-bold">Hack Money </span>by</span>
          <Image
            src="/ETH Global.png"
            alt="ETH Global"
            width={120}
            height={40}
            className="object-contain"
          />
        </motion.div>
      </Container>
    </section>
  )
}
