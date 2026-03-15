'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { domToPng } from 'modern-screenshot'
import jsPDF from 'jspdf'

export function DownloadReportButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadPDF = async () => {
    const element = document.getElementById('performance-insight-report')
    if (!element) {
      toast.error('리포트 영역을 찾을 수 없습니다.')
      return
    }

    setIsGenerating(true)
    try {
      // Temporarily force mobile layout
      element.classList.add('force-mobile-layout')
      
      // Wait a bit for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100))

      const dataUrl = await domToPng(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: 450,
      })

      // Restore original layout
      element.classList.remove('force-mobile-layout')

      const img = new Image()
      img.src = dataUrl
      
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [img.width / 2, img.height / 2]
      })

      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width / 2, img.height / 2)
      pdf.save(`TheBundle_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success('리포트 다운로드가 완료되었습니다.')
    } catch (error) {
      console.error('PDF Generation error:', error)
      toast.error('PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      onClick={downloadPDF}
      disabled={isGenerating}
      className="bg-white text-indigo-600 hover:bg-zinc-100 font-black rounded-2xl h-12 px-6 shadow-xl shrink-0"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          생성 중...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" />
          PDF 다운로드
        </>
      )}
    </Button>
  )
}
