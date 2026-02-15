"use client"

import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/hooks/useWallet"
import { useRiskDepth } from "@/lib/hooks/useRiskDepth"
import Button from "@/components/landing/Button"

interface LaunchAppButtonProps {
  size?: "default" | "large"
  className?: string
}

export default function LaunchAppButton({
  size = "default",
  className = "",
}: LaunchAppButtonProps) {
  const router = useRouter()
  const { ready, authenticated, login } = useWallet()
  const { isLoaded, hasSelected } = useRiskDepth()

  const handleClick = () => {
    if (!ready) return
    if (authenticated) {
      if (isLoaded && hasSelected) {
        router.push("/dashboard")
      } else {
        router.push("/onboard")
      }
    } else {
      login()
    }
  }

  return (
    <Button size={size} className={className} onClick={handleClick}>
      Launch App
    </Button>
  )
}
