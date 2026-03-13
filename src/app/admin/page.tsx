"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, CheckCircle2, AlertCircle, List, Send, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [bundles, setBundles] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)

  const fetchBundles = async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/admin/bundles')
      const data = await res.json()
      if (res.ok) {
        setBundles(data.bundles)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchBundles()
  }, [])

  const generateBundle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/generate-bundle', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('AI 번들 초안이 생성되었습니다!')
        fetchBundles()
      } else {
        throw new Error(data.error || '생성 실패')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const publishBundle = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/bundles/${id}/publish`, {
        method: 'PUT',
      })
      if (res.ok) {
        toast.success('번들이 발행되었습니다!')
        fetchBundles()
      } else {
        const data = await res.json()
        throw new Error(data.error || '발행 실패')
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">관리자 대시보드</h1>
        <p className="text-zinc-500">The Bundle의 콘텐츠와 데이터 수집을 제어합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Action */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden relative glass">
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI 번들 큐레이션
              </CardTitle>
              <CardDescription>
                Gemini AI를 사용하여 이번 달 테마에 맞는 ETF를 자동으로 페어링합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <Button 
                size="lg" 
                onClick={generateBundle} 
                disabled={loading}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    새로운 번들 생성
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 glass">
            <CardHeader>
              <CardTitle className="text-sm font-medium">데이터 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">최신 ETF 가격 수집</span>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">정상</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bundle History & Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <List className="w-6 h-6" />
              번들 관리 히스토리
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchBundles} disabled={fetching}>
              {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : '새로고침'}
            </Button>
          </div>

          <div className="space-y-4">
            {bundles.length === 0 && !fetching && (
              <div className="p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400">
                생성된 번들이 없습니다.
              </div>
            )}

            {bundles.map((bundle) => (
              <Card key={bundle.id} className="border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">{bundle.title}</CardTitle>
                    <CardDescription>{bundle.theme}</CardDescription>
                  </div>
                  <Badge 
                    variant={bundle.status === 'published' ? 'default' : 'secondary'}
                    className={
                      bundle.status === 'published' 
                        ? "bg-indigo-600" 
                        : bundle.status === 'draft'
                          ? "bg-amber-500/10 text-amber-600 border-amber-200"
                          : "opacity-50"
                    }
                  >
                    {bundle.status.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-2">
                  <div className="text-xs text-zinc-500">
                    생성: {format(new Date(bundle.created_at), 'yyyy-MM-dd HH:mm')}
                    {bundle.published_at && ` | 발행: ${format(new Date(bundle.published_at), 'yyyy-MM-dd HH:mm')}`}
                  </div>
                  <div className="flex gap-2">
                    {bundle.status === 'draft' && (
                      <Button 
                        size="sm" 
                        onClick={() => publishBundle(bundle.id)}
                        className="bg-zinc-900 dark:bg-zinc-50 flex gap-1"
                      >
                        <Send className="w-3 h-3" /> 발행하기
                      </Button>
                    )}
                    {bundle.status === 'published' && (
                      <div className="text-emerald-600 flex items-center gap-1 text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> 게시됨
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
