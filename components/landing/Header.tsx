"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import Container from "@/components/landing/Container"
import LaunchAppButton from "@/components/landing/LaunchAppButton"
import { MenuIcon, CloseIcon } from "@/components/landing/icons"
import {
  buttonTap,
  mobileMenuOverlay,
  mobileMenuDrawer,
  mobileNavStagger,
  mobileNavItem,
} from "@/lib/animations"

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: "Why Tidal", href: "#features" },
  { label: "The Process", href: "#the-process" },
  { label: "Comparisons", href: "#why-tidal" },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
      if (window.scrollY < window.innerHeight * 0.5) {
        setActiveSection("")
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.href.replace("#", ""))
    const observers: IntersectionObserver[] = []

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveSection(`#${id}`)
              }
            })
          },
          { rootMargin: "-50% 0px -50% 0px" }
        )
        observer.observe(element)
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md border-b border-card-border"
            : "bg-transparent"
        }`}
      >
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/tidal-logo.svg"
                alt="Tidal"
                width={100}
                height={32}
                priority
                className="h-8 w-auto"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                    activeSection === item.href
                      ? "bg-tidal-primary/10 text-tidal-primary"
                      : "text-ocean-900 hover:bg-tidal-primary/10 hover:text-tidal-primary"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:block">
              <LaunchAppButton />
            </div>

            <motion.button
              className="md:hidden p-2 text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={buttonTap}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon />
            </motion.button>
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              variants={mobileMenuOverlay}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 md:hidden shadow-2xl"
              variants={mobileMenuDrawer}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex justify-end p-4">
                <motion.button
                  className="p-2 text-text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                  whileTap={buttonTap}
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </motion.button>
              </div>

              <motion.nav
                className="flex flex-col px-6 py-4"
                variants={mobileNavStagger}
                initial="hidden"
                animate="visible"
              >
                {navItems.map((item) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    variants={mobileNavItem}
                    className={`py-4 text-lg font-medium border-b border-card-border transition-colors ${
                      activeSection === item.href
                        ? "text-tidal-primary"
                        : "text-text-primary hover:text-tidal-primary"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}

                <motion.div variants={mobileNavItem} className="pt-6">
                  <LaunchAppButton className="w-full" />
                </motion.div>
              </motion.nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
