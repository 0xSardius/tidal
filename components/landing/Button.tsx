"use client"

import { motion } from "motion/react"
import { buttonHover, buttonTap } from "@/lib/animations"

interface ButtonProps {
  children: React.ReactNode
  variant?: "primary" | "secondary"
  onClick?: () => void
  className?: string
  size?: "default" | "large"
}

export default function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  size = "default",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200"

  const sizeStyles = {
    default: "px-6 py-2 text-base",
    large: "px-8 py-4 text-lg",
  }

  const variants = {
    primary:
      "bg-tidal-primary text-white hover:bg-tidal-secondary active:bg-ocean-600",
    secondary:
      "border-2 border-tidal-primary text-tidal-primary hover:bg-tidal-primary/10 active:bg-tidal-primary/20",
  }

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`

  return (
    <motion.button
      onClick={onClick}
      className={combinedClassName}
      whileHover={buttonHover}
      whileTap={buttonTap}
    >
      {children}
    </motion.button>
  )
}
