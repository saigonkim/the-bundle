import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Package, ArrowUpRight, Zap } from 'lucide-react'
import { createMockSubscription } from './subscription-action'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Get Subscription Status
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const isActive = subscription?.status === 'active'

  // 2. Get Latest Patience Log
  const { data: latestLog } = await supabase
    .from('patience_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_date', { ascending: false })
    .limit(1)
    .single()

  // 3. Get Latest Bundle if active
  let bundleData = null
  if (isActive) {
    const { data: bundle } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_items (*)
      `)
      .eq('status', 'published')
      .order('valid_from', { ascending: false })
      .limit(1)
      .single()
    bundleData = bundle
  }

  // Calculate current bundle NAV and ROI
  let currentBundleNav = 0
  let roi = 0
  if (isActive && bundleData) {
    // Get latest prices for tickers in bundle
    const tickers = bundleData.bundle_items.map((i: any) => i.etf_ticker)
    const { data: prices } = await supabase
      .from('etf_prices')
      .select('ticker, nav')
      .in('ticker', tickers)
      .order('price_date', { ascending: false })

    const latestPrices: Record<string, number> = {}
    prices?.forEach((p: any) => {
      if (!latestPrices[p.ticker]) latestPrices[p.ticker] = p.nav
    })

    currentBundleNav = bundleData.bundle_items.reduce((acc: number, item: any) => {
      const price = latestPrices[item.etf_ticker] || item.base_nav
      return acc + (price * item.weight / 100)
    }, 0)

    if (subscription.start_nav > 0) {
      roi = ((currentBundleNav - subscription.start_nav) / subscription.start_nav) * 100
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gradient">
            {isActive ? '나의 투자 번들' : '안녕하세요! 투자 준비 완료?'}
          </h1>
          <p className="text-zinc-500 border-l-2 border-indigo-500 pl-3 mt-2 font-medium">
            {isActive ? '준비된 ETF 번들로 꾸준히 자산을 불려가보세요.' : '구독을 시작하면 전문가의 큐레이션 번들을 확인할 수 있어요.'}
          </p>
        </div>
      </header>

      {!isActive ? (
        <div className="grid gap-6">
          <div className="relative overflow-hidden group rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 md:p-16 shadow-2xl shadow-indigo-500/10">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-1000">
              <Zap className="w-80 h-80 text-indigo-600" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <Badge className="mb-6 bg-indigo-500 text-white border-none px-4 py-1.5 rounded-full text-xs font-bold tracking-wider">
                EXCLUSIVE ACCESS
              </Badge>
              <h2 className="text-5xl font-black mb-6 leading-tight tracking-tighter">
                커피 한 잔 <span className="text-indigo-600">4,900원</span>으로<br />
                당신의 자산을 깨우세요.
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-xl leading-relaxed">
                매달 업데이트되는 최적의 ETF 조합과 투자 성향 리포트,<br />
                그리고 실시간 수익률 트래킹까지 한 번에 누리세요.
              </p>
              
              <form action={createMockSubscription}>
                <Button size="lg" className="rounded-2xl px-12 h-16 text-xl font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-2xl shadow-indigo-500/30 group transition-all hover:scale-105 active:scale-95">
                  무료체험 시작하기
                  <ArrowUpRight className="ml-2 w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Dashboard Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Bundle Overview */}
            {bundleData ? (
              <div className="glass premium-shadow rounded-[2.5rem] p-8 transition-all hover:border-indigo-500/30 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{bundleData.title}</h3>
                      <p className="text-sm text-zinc-500">{bundleData.theme}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-lg h-7 border-zinc-200 dark:border-zinc-800">
                    {new Date(bundleData.valid_from).toLocaleDateString()} 업데이트
                  </Badge>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  {bundleData.bundle_items.map((item: any) => (
                    <div key={item.etf_ticker} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                      <p className="text-xs text-zinc-500 mb-1">{item.metaphor}</p>
                      <h4 className="font-bold mb-2 truncate">{item.etf_name}</h4>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-bold">{item.weight}%</span>
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold">
                          {item.order_index}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30">
                  <p className="text-sm text-indigo-900 dark:text-indigo-200 italic">
                    " {bundleData.ai_commentary} "
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
                추천된 번들을 불러오는 중입니다...
              </div>
            )}
            
            {/* Market Trend or other small info */}
            <div className="grid sm:grid-cols-2 gap-6">
               <div className="p-6 rounded-3xl bg-zinc-900 text-zinc-50 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className={cn("w-4 h-4", roi >= 0 ? "text-emerald-400" : "text-rose-400")} />
                    <span className="text-xs font-medium uppercase tracking-wider opacity-60">Virtual ROI</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight">
                      {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs mt-4 opacity-60">구독 시작일로부터의 가상 수익률입니다.</p>
               </div>
               <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Next Rebalancing</span>
                  </div>
                  <div className="text-2xl font-bold">D-14 Days</div>
                  <div className="mt-4 w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-1/2" />
                  </div>
               </div>
            </div>
          </div>

          {/* Right Sidebar Stats */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center text-center shadow-sm h-full">
              <h3 className="font-bold text-lg mb-2">기다림 지수</h3>
              <p className="text-sm text-zinc-500 mb-8">당신의 투자 성숙도를 나타냅니다.</p>
              
              <div className="relative w-40 h-40 mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl font-black">{latestLog?.patience_score || 0}</span>
                    <span className="text-sm font-medium text-zinc-400 block">points</span>
                  </div>
                </div>
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-zinc-100 dark:text-zinc-800"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (latestLog?.patience_score || 0)) / 100}
                    strokeLinecap="round"
                    className="text-indigo-600 transition-all duration-1000 ease-in-out"
                  />
                </svg>
              </div>

              <div className="w-full space-y-4 text-left">
                <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-xs font-medium text-zinc-500">지수 등급</span>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-none shrink-0">
                    새싹 투자가
                  </Badge>
                </div>
                <div className="space-y-2 px-2">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                    <span>PROGRESS TO NEXT LEVEL</span>
                    <span>{latestLog?.patience_score || 0}/100</span>
                  </div>
                  <Progress value={latestLog?.patience_score || 0} className="h-2 rounded-full" />
                </div>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 w-full text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                기다림 지수는 시장의 유동성에도 흔들리지 않고 자산을 지키는 능력을 점수화합니다. 매일 0.1점씩 상승합니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
