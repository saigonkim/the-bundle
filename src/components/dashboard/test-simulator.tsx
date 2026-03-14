'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { seedTestData } from '@/lib/patience/actions'
import { RefreshCw, CheckCircle2, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'

export function TestSimulator() {
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    try {
      await seedTestData()
      toast.success('테스트 데이터가 생성되었습니다!')
    } catch (error) {
      console.error(error)
      toast.error('데이터 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
          <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-100">테스트 시뮬레이터</h4>
          <p className="text-[10px] text-amber-700/60 dark:text-amber-400/60 font-medium">그래프와 지표 변화를 즉시 확인하기 위한 도구입니다.</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed font-medium">
          버튼을 클릭하면 최근 14일간의 가상 수익률과 기다림 지수 로그를 생성합니다. 
          기존 테스트 데이터는 삭제되고 새롭게 초기화됩니다.
        </p>
        
        <Button 
          onClick={handleSeed} 
          disabled={loading}
          variant="outline"
          className="w-full h-11 rounded-xl bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          14일치 테스트 데이터 생성하기
        </Button>
      </div>
    </div>
  )
}
