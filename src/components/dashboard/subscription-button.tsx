'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowUpRight } from 'lucide-react'

interface SubmitButtonProps {
  text: string
  className?: string
  showIcon?: boolean
}

export function SubscriptionSubmitButton({ text, className, showIcon = true }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button 
      type="submit" 
      disabled={pending} 
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          처리 중...
        </>
      ) : (
        <>
          {text}
          {showIcon && <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
        </>
      )}
    </Button>
  )
}
