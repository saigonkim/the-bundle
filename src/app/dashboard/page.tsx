import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Package, ArrowUpRight, Zap, Target } from 'lucide-react'
import { SubscriptionSubmitButton } from '@/components/dashboard/subscription-button'
import { createMockSubscription } from './subscription-action'
import { cn, formatDate } from '@/lib/utils'
import { getPatienceInfo } from '@/lib/patience/calculator'

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
    .maybeSingle()

  const isActive = subscription?.status === 'active'

  // 2. Get Latest Patience Log
  const { data: latestLog } = await supabase
    .from('patience_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_date', { ascending: false })
    .limit(1)
    .single()

  // 3. Get All Current Published Bundles (One per Series)
  const { data: allBundles } = await supabase
    .from('bundles')
    .select(`
      *,
      bundle_series (*),
      bundle_items (*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Find the user's active bundle data from the list
  const bundleData = allBundles?.find(b => b.id === subscription?.current_bundle_id) || allBundles?.[0] || null

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

    // Option B: Cumulative ROI using Bundle Index
    const { data: latestIndex } = await supabase
      .from('bundle_index_history')
      .select('index_value')
      .order('recorded_date', { ascending: false })
      .limit(1)
      .single()

    if (latestIndex && subscription.start_index_value) {
      const currentIndex = Number(latestIndex.index_value)
      const startIndex = Number(subscription.start_index_value)
      roi = ((currentIndex - startIndex) / startIndex) * 100
    } else if (subscription.start_nav > 0) {
      // Fallback to simple ROI if index not found
      roi = ((currentBundleNav - subscription.start_nav) / subscription.start_nav) * 100
    }
  }

  const patienceInfo = getPatienceInfo(latestLog?.patience_score || 0)

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
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
                <SubscriptionSubmitButton 
                  text="무료체험 시작하기"
                  className="rounded-2xl px-12 h-16 text-xl font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-2xl shadow-indigo-500/30 group transition-all hover:scale-105 active:scale-95"
                />
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Dashboard Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Bundle Overview */}
            {bundleData ? (
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 transition-all hover:border-indigo-500/30 duration-500 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                  <Package className="w-40 h-40 text-indigo-600" />
                </div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <Link 
                    href={`/dashboard/bundle/${bundleData.id}`}
                    className="flex items-center gap-4 group/title hover:opacity-90 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover/title:scale-110 transition-transform duration-300">
                      <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-2xl tracking-tight group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors">
                          {bundleData.bundle_series?.name || bundleData.theme}
                        </h3>
                        <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover/title:text-indigo-500 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 transition-all" />
                      </div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{bundleData.title}</p>
                    </div>
                  </Link>
                  <Badge variant="outline" className="rounded-full px-4 h-8 border-zinc-200 dark:border-zinc-800 font-bold text-[10px] tracking-widest text-zinc-400">
                    UPDATED: {formatDate(bundleData.valid_from)}
                  </Badge>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3 relative z-10">
                  {bundleData.bundle_items.sort((a: any, b: any) => a.order_index - b.order_index).map((item: any) => (
                    <div key={item.etf_ticker} className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all hover:shadow-lg">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{item.metaphor}</p>
                      <h4 className="font-bold mb-3 truncate text-lg tracking-tight">{item.etf_name}</h4>
                      <div className="flex items-end justify-between">
                        <span className="text-3xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">{item.weight}%</span>
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-black">
                          {item.order_index}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30 relative z-10">
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 leading-relaxed italic">
                    " {bundleData.ai_commentary} "
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
                추천된 번들을 불러오는 중입니다...
              </div>
            )}

            {/* Other Bundles Explorer */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black flex items-center gap-3 px-2 tracking-tight">
                <Target className="w-6 h-6 text-indigo-500" />
                다른 테마 둘러보기
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {allBundles?.filter(b => b.id !== bundleData?.id).map((b) => (
                  <Link href={`/dashboard/bundle/${b.id}`} key={b.id} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 hover:border-indigo-600/50 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <Package className="w-24 h-24" />
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-none rounded-full px-3 py-1 text-[10px] font-bold">
                        {b.bundle_series?.category}
                      </Badge>
                      <ArrowUpRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <h4 className="font-black text-xl mb-1 tracking-tight relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{b.bundle_series?.name || b.theme}</h4>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 truncate relative z-10">{b.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

            {/* Right Sidebar Stats */}
          <div className="space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-zinc-950 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <TrendingUp className="w-48 h-48 text-emerald-400" />
               </div>
               <div className="flex items-center gap-2 mb-6 relative z-10 font-bold opacity-60">
                 <span className="text-[10px] uppercase tracking-[0.2em]">Portfolio Returns</span>
               </div>
               <div className="flex items-baseline gap-2 relative z-10">
                 <span className="text-6xl font-black tracking-tighter">
                   {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                 </span>
               </div>
                <p className="text-[11px] mt-6 font-semibold text-zinc-400 leading-relaxed uppercase tracking-widest relative z-10 group-hover:text-zinc-300 transition-colors">
                  Cumulative growth since<br />subscription start
                </p>
            </div>

            <div className="rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Target className="w-32 h-32" />
              </div>
              <h3 className="font-black text-2xl tracking-tight mb-2 relative z-10">기다림 지수</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10 relative z-10">Patience Maturity Score</p>
              
              <div className="relative w-48 h-48 mb-10 group-hover:scale-105 transition-transform duration-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-5xl font-black tracking-tighter">{patienceInfo.score.toFixed(1)}</span>
                    <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-tighter mt-1">points</span>
                  </div>
                </div>
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="85"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    className="text-zinc-50 dark:text-zinc-800"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="85"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={534}
                    strokeDashoffset={534 - (534 * patienceInfo.score) / 100}
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-in-out drop-shadow-[0_0_8px_rgba(var(--color-primary),0.3)]", 
                      patienceInfo.stage === 'seed' ? 'text-orange-500' :
                      patienceInfo.stage === 'sprout' ? 'text-emerald-500' :
                      patienceInfo.stage === 'tree' ? 'text-indigo-600' : 'text-purple-600'
                    )}
                  />
                </svg>
              </div>

              <div className="w-full space-y-6 text-left relative z-10">
                <div className="flex justify-between items-center px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Level</span>
                  <Badge className={cn("border-none shrink-0 rounded-full px-4 py-1 font-bold text-xs shadow-sm", 
                    patienceInfo.stage === 'seed' ? 'bg-orange-100 text-orange-700' :
                    patienceInfo.stage === 'sprout' ? 'bg-emerald-100 text-emerald-700' :
                    patienceInfo.stage === 'tree' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                  )}>
                    {patienceInfo.label}
                  </Badge>
                </div>
                <div className="space-y-3 px-2">
                  <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <span>Target: {patienceInfo.nextThreshold}%</span>
                    <span>{patienceInfo.score.toFixed(1)}/100</span>
                  </div>
                  <Progress value={patienceInfo.score} className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>

              <div className="mt-10 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 w-full text-xs leading-relaxed text-zinc-500 font-medium italic relative z-10">
                "시장의 소음에도 흔들리지 않고 자산을 지키는 능력을 나타냅니다. 시간이 흐를수록 당신의 나무는 단단해집니다."
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

