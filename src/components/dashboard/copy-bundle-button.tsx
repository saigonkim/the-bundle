'use client'

import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface CopyBundleButtonProps {
  bundleTitle: string
  items: {
    etf_name: string
    etf_ticker: string
    weight: number
  }[]
}

export function CopyBundleButton({ bundleTitle, items }: CopyBundleButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = `📦 [The Bundle] ${bundleTitle} 구성 정보\n\n` + 
      items.map(item => `- ${item.etf_name} (${item.etf_ticker}): ${item.weight}%`).join('\n') +
      `\n\n* 실제 증권사 계좌에서 위 비중대로 매수하시기를 제안합니다. ✨`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('종목 정보가 클립보드에 복사되었습니다!')
    
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button 
      onClick={handleCopy}
      className="w-full h-14 rounded-2xl bg-white text-zinc-950 font-black hover:bg-zinc-100 transition-all gap-2"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      {copied ? '복사 완료!' : '종목명 및 비중 복사하기'}
    </Button>
  )
}
