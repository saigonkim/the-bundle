'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LandingActionButtonProps {
  href: string
  label: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function LandingActionButton({ href, label, size = "lg", className }: LandingActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    router.push(href)
  }

  return (
    <Button 
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      className={cn(
        "rounded-full transition-all group",
        size === "lg" && "h-14 px-8 text-lg font-semibold min-w-[200px]",
        size === "sm" && "px-5 font-medium",
        !className?.includes('bg-') && "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 hover:scale-105",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          로딩 중...
        </>
      ) : (
        <>
          {label} {size !== "sm" && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
        </>
      )}
    </Button>
  )
}
