import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, ArrowLeft, TrendingUp, Info, PieChart } from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { CopyBundleButton } from '@/components/dashboard/copy-bundle-button'

export default async function BundleDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: bundle } = await supabase
    .from('bundles')
    .select(`
      *,
      bundle_series (*),
      bundle_items (*)
    `)
    .eq('id', id)
    .single()

  if (!bundle) notFound()

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link 
        href="/dashboard" 
        className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드로 돌아가기
      </Link>

      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-none font-bold">
              {bundle.bundle_series?.name || bundle.theme}
            </Badge>
            <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800">
              {bundle.status === 'published' ? '현재 게시됨' : '아카이브됨'}
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight">{bundle.title}</h1>
          <p className="text-lg text-zinc-500 max-w-2xl">{bundle.summary}</p>
        </div>
        
        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-6 min-w-[280px]">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">유효 기간</p>
            <p className="font-bold">
              {formatDate(bundle.valid_from)} - {bundle.valid_until ? formatDate(bundle.valid_until) : '진행 중'}
            </p>
          </div>
          <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">종목 수</p>
            <p className="font-bold">{bundle.bundle_items?.length || 0}개 ETF</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: AI Analysis & Strategy */}
        <div className="lg:col-span-2 space-y-8">
          <section className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <TrendingUp className="w-48 h-48" />
            </div>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              AI 투자 전략 큐레이션
            </h3>
            <div className="space-y-6 text-white leading-relaxed relative z-10">
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <p className="text-xl font-bold italic leading-snug">
                   " {bundle.ai_commentary} "
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-300" />
                  이번 구성의 핵심 논리
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {bundle.bundle_items?.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="p-5 rounded-xl bg-black/20 border border-white/10">
                      <p className="text-sm text-indigo-200 mb-2 font-black uppercase tracking-wider">{item.etf_name}</p>
                      <p className="text-base font-medium text-white/90">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Detailed ETF List */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-2">
              번들 구성 ETF 상세
            </h3>
            <div className="grid gap-4">
              {bundle.bundle_items?.sort((a: any, b: any) => a.order_index - b.order_index).map((item: any) => (
                <div key={item.id} className="group p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/30 transition-all shadow-sm flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-lg font-black group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                      {item.order_index}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.etf_name}</h4>
                      <p className="text-xs text-zinc-400 font-mono tracking-tighter">{item.etf_ticker}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase">
                        {item.metaphor}
                      </Badge>
                    </div>
                    <p className="text-base text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">{item.rationale}</p>
                  </div>

                  <div className="flex items-end flex-col min-w-[100px]">
                    <span className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                      {item.weight}%
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">비중</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Quick Action & One-liner */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-zinc-900 text-white shadow-xl shadow-zinc-500/10">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              핵심 요약
            </h3>
            <p className="text-2xl font-black leading-tight mb-8">
              {bundle.summary}
            </p>
            <CopyBundleButton 
              bundleTitle={bundle.title} 
              items={bundle.bundle_items || []} 
            />
            <p className="text-xs text-zinc-400 mt-4 text-center font-medium">
              * 위 버튼을 눌러 종목 리스트를 복사한 뒤,<br />실제 증권사 계좌에서 매수하실 수 있습니다.
            </p>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h4 className="font-bold mb-4">투자 알림</h4>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex gap-3 border border-zinc-100 dark:border-zinc-800">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                  본 번들은 <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatDate(bundle.valid_from)}</span> 기준의 시장 데이터를 분석하여 생성되었습니다.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex gap-3 border border-zinc-100 dark:border-zinc-800">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                  과거 수익률이 미래 수익을 보장하지 않습니다. 신중한 투자 결정을 권장하며, 매월 초 새로운 큐레이션이 업데이트됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

