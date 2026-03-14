"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, CheckCircle2, AlertCircle, List, Send, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [bundles, setBundles] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<any>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [series, setSeries] = useState<any[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')

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

  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/admin/series')
      const data = await res.json()
      if (res.ok) {
        setSeries(data.series)
        if (data.series.length > 0) setSelectedSeriesId(data.series[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchBundles()
    fetchSeries()
  }, [])

  const generateBundle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/generate-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series_id: selectedSeriesId })
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
        if (selectedBundle?.bundle?.id === id) {
          setSelectedBundle((prev: any) => ({
            ...prev,
            bundle: { ...prev.bundle, status: 'published' }
          }))
        }
      } else {
        const data = await res.json()
        throw new Error(data.error || '발행 실패')
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const viewDetail = async (id: string) => {
    setIsDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/bundles/${id}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedBundle(data)
      } else {
        toast.error(data.error || '상세 조회 실패')
      }
    } catch (err) {
      console.error(err)
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsDetailLoading(false)
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
                고정된 10가지 테마 중 하나를 선택하여 이번 달 구성을 업데이트합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-tight">테마 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {series.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeriesId(s.id)}
                      className={`p-3 text-left text-xs rounded-xl border-2 transition-all ${
                        selectedSeriesId === s.id 
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 font-bold' 
                          : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 text-zinc-500'
                      }`}
                    >
                      <div className="opacity-60 mb-0.5">{s.category}</div>
                      <div className="truncate">{s.name}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                    <CardTitle className="text-xl font-bold italic text-indigo-600">{bundle.bundle_series?.name || bundle.theme}</CardTitle>
                    <CardDescription>{bundle.title}</CardDescription>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewDetail(bundle.id)}
                    >
                      상세보기
                    </Button>
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
                      <div className="text-emerald-600 flex items-center gap-1 text-sm font-bold px-2">
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

      {/* Bundle Detail Dialog */}
      <Dialog open={!!selectedBundle} onOpenChange={(open) => !open && setSelectedBundle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">{selectedBundle?.bundle?.title}</DialogTitle>
              <Badge variant={selectedBundle?.bundle?.status === 'published' ? 'default' : 'secondary'}>
                {selectedBundle?.bundle?.status?.toUpperCase()}
              </Badge>
            </div>
            <DialogDescription className="text-indigo-600 font-medium pt-1">
              {selectedBundle?.bundle?.theme}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 p-6 pt-0 overflow-y-auto">
            <div className="space-y-8 py-4">
              {/* Summary Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">AI 생성 요약</h3>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 italic leading-relaxed">
                  "{selectedBundle?.bundle?.summary}"
                </div>
              </section>

              {/* Commentary Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">사용자 응원 메시지</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {selectedBundle?.bundle?.ai_commentary}
                </p>
              </section>

              {/* ETF Cards Section */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">구성 ETF 종목 ({selectedBundle?.items?.length}종)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBundle?.items?.map((item: any) => (
                    <Card key={item.id} className="border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">
                            {item.etf_ticker}
                          </div>
                          <span className="text-xs font-bold text-zinc-400">{item.weight}%</span>
                        </div>
                        <CardTitle className="text-base font-bold pt-1">{item.etf_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <p className="text-sm text-indigo-600 font-medium">"{item.metaphor}"</p>
                        <p className="text-xs text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg">
                          {item.rationale}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="p-6 border-t bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedBundle(null)}>
              닫기
            </Button>
            {selectedBundle?.bundle?.status === 'draft' && (
              <Button 
                onClick={() => publishBundle(selectedBundle.bundle.id)}
                className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 px-8"
              >
                <Send className="w-4 h-4 mr-2" /> 이대로 발행하기
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
