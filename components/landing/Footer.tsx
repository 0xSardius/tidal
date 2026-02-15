"use client"

import { motion } from "motion/react"
import Image from "next/image"
import Button from "@/components/landing/Button"
import Container from "@/components/landing/Container"
import { CheckCircleIcon, CircleDotIcon } from "@/components/landing/icons"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { useWallet } from "@/lib/hooks/useWallet"

const currentFeatures = [
  "AI-powered yield strategy recommendations",
  "Smart wallet integration with passkey auth",
  "Real-time portfolio monitoring",
  "Risk tier selection (Shallows, Mid, Deep)",
]

const upcomingFeatures = [
  "Cross-chain yield optimization",
  "Advanced risk analytics dashboard",
  "Social sharing of strategies",
  "Mobile app (iOS & Android)",
  "Institutional API access",
  "DAO governance integration",
]

export default function Footer() {
  const { login } = useWallet()

  return (
    <footer className="bg-[#E0F2FE] pt-24 pb-6">
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
            Ready to get started?
          </motion.h2>

          <div className="grid w-full gap-3 md:grid-cols-2">
            <motion.div
              variants={staggerItem}
              className="flex flex-col items-start rounded-xl bg-white p-4 pb-6 text-start transition-colors"
            >
              <h3 className="mb-2 text-xl font-semibold leading-tight text-ocean-900 tracking-tighter">
                Create New Smart Wallet
              </h3>
              <p className="mb-6 text-ocean-900 leading-snug">
                New to crypto? No problem. We&apos;ll set up everything you need — no extensions, no seed phrases, no technical setup required.
              </p>
              <Button onClick={login}>
                Get Started
              </Button>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="flex flex-col items-start rounded-xl bg-white p-4 pb-6 text-start transition-colors"
            >
              <h3 className="mb-2 text-xl font-semibold leading-tight text-ocean-900 tracking-tighter">
                Connect Existing Wallet
              </h3>
              <p className="mb-6 text-ocean-900 leading-snug">
                Bring your existing wallet and optionally upgrade to smart wallet features while keeping your same address.
              </p>
              <Button onClick={login}>
                Connect
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Roadmap Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="mt-24"
        >
          <motion.h3
            variants={staggerItem}
            className="mb-8 text-3xl font-bold tracking-tighter text-tidal-primary md:text-4xl"
          >
            Tidal Roadmap
          </motion.h3>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Current Features Column */}
            <motion.div
              variants={staggerItem}
              className="rounded-xl bg-white p-4 pb-8 transition-colors"
            >
              <h4 className="mb-4 text-xl font-semibold leading-tight text-ocean-900 tracking-tighter">
                Current Features
              </h4>
              <ul className="space-y-3">
                {currentFeatures.map((feature) => (
                  <motion.li
                    key={feature}
                    variants={staggerItem}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tidal-primary/10 text-tidal-primary">
                      <CheckCircleIcon className="h-4 w-4" />
                    </div>
                    <span className="text-ocean-900 leading-snug">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Upcoming Features Column */}
            <motion.div
              variants={staggerItem}
              className="rounded-xl bg-white p-4 pb-8 transition-colors"
            >
              <h4 className="mb-4 text-xl font-semibold leading-tight text-ocean-900 tracking-tighter">
                Upcoming Features
              </h4>
              <ul className="space-y-3">
                {upcomingFeatures.map((feature) => (
                  <motion.li
                    key={feature}
                    variants={staggerItem}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-ocean-500">
                      <CircleDotIcon className="h-4 w-4" />
                    </div>
                    <span className="text-ocean-900 leading-snug">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>

      </Container>

      {/* Full-width logo */}
      <div className="mt-24 w-full px-4">
        <Image
          src="/tidal-single-logo.svg"
          alt="Tidal"
          width={310}
          height={146}
          className="w-full h-auto opacity-20"
        />
      </div>
    </footer>
  )
}
