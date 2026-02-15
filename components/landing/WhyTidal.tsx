"use client"

import { motion } from "motion/react"
import Container from "@/components/landing/Container"
import { staggerContainer, staggerItem, tableStagger, tableRow } from "@/lib/animations"

const comparisons = [
  {
    aspect: "Research",
    manual: "You do it",
    aggregator: "None",
    tidal: "AI does it",
  },
  {
    aspect: "Execution",
    manual: "Multiple txs",
    aggregator: "One-click",
    tidal: "AI handles",
  },
  {
    aspect: "Monitoring",
    manual: "Constant",
    aggregator: "Set & forget",
    tidal: "AI watches",
  },
  {
    aspect: "Understanding",
    manual: "Figure it out",
    aggregator: "Black box",
    tidal: "Explained",
  },
  {
    aspect: "Risk control",
    manual: "Hope for best",
    aggregator: "Limited",
    tidal: "You choose",
  },
]

export default function WhyTidal() {
  return (
    <section id="why-tidal" className="pt-24 pb-24 bg-white">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={staggerItem}
            className="mb-6 text-3xl font-bold tracking-tighter text-tidal-primary md:text-4xl"
          >
            DeFi doesn&apos;t have to be hard
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="mb-12 text-lg text-ocean-900 max-w-3xl"
          >
            Traditional yield aggregators are set-and-forget black boxes. Manual
            DeFi requires constant attention and expertise.{" "}
            <span className="text-ocean-900 font-bold">
              Tidal gives you an AI partner that explains, adapts, and keeps you
              in control.
            </span>
          </motion.p>

          <motion.div
            variants={tableStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="py-4 px-4 text-left text-sm font-medium text-text-muted"></th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-text-muted">
                    Manual DeFi
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-text-muted">
                    Yield Aggregators
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-tidal-primary">
                    Tidal
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <motion.tr
                    key={row.aspect}
                    variants={tableRow}
                    className="border-b border-card-border"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-text-primary">
                      {row.aspect}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-text-secondary">
                      {row.manual}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-text-secondary">
                      {row.aggregator}
                    </td>
                    <td className="py-4 px-4 text-center text-sm font-medium text-tidal-primary bg-tidal-primary/5 border-l-2 border-tidal-primary">
                      {row.tidal}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
