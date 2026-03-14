import { createClient } from '@/lib/supabase/server'
import { RoiChart } from '@/components/dashboard/roi-chart'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Award, Zap, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPatienceInfo } from '@/lib/patience/calculator'

export default async function PerformancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Current subscription to get start_nav
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const isActive = subscription?.status === 'active'

  if (!isActive) {
    return (
      <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header>
          <h1 className="text-4xl font-black tracking-tight">수익률 트래킹</h1>
          <p className="text-zinc-500 border-l-2 border-indigo-500 pl-3 mt-2">시간이 지날수록 단단해지는 나의 자산 성적표입니다.</p>
        </header>

        <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-8 bg-zinc-50/50 dark:bg-zinc-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-white/80 dark:to-zinc-950/80 pointer-events-none" />
          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-2xl relative z-10">
            <TrendingUp className="w-16 h-16 text-indigo-500 animate-pulse" />
          </div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-black tracking-tight">프리미엄 전용 기능입니다</h2>
            <p className="text-zinc-500 font-medium max-w-md mx-auto">
              구독을 시작하면 실시간 수익률 추이와<br />
              나의 투자 기다림 지수를 그래프로 한눈에 확인할 수 있습니다.
            </p>
          </div>
          <div className="relative z-10">
            <Badge className="bg-indigo-500 text-white border-none px-4 py-1.5 rounded-full text-xs font-bold mb-6">
              PREMIUM ACCESS ONLY
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  const { data: logs } = await supabase
    .from('patience_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_date', { ascending: true })

  const latestLog = logs && logs.length > 0 ? logs[logs.length - 1] : null
  const firstLog = logs && logs.length > 0 ? logs[0] : null
  
  const currentRoi = latestLog?.virtual_return_pct ? Number(latestLog.virtual_return_pct) : 0
  const patienceInfo = getPatienceInfo(latestLog?.patience_score ? Number(latestLog.patience_score) : 0)
  
  const totalGain = latestLog && firstLog ? (Number(latestLog.virtual_return_pct) - Number(firstLog.virtual_return_pct)).toFixed(2) : "0.00"

  // Transform logs for chart
  const chartData = logs?.map(log => ({
    ...log,
    roi: Number(log.virtual_return_pct)
  })) || []

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-4xl font-black tracking-tight">수익률 트래킹</h1>
        <p className="text-zinc-500 border-l-2 border-indigo-500 pl-3 mt-2">시간이 지날수록 단단해지는 나의 자산 성적표입니다.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-2">Cumulative ROI</p>
          <div className="text-5xl font-black mb-4">{currentRoi.toFixed(2)}%</div>
          <div className="flex items-center gap-1 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
            <ArrowUpRight className="w-3 h-3" />
            최근 {totalGain}% 변동
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Award className="w-32 h-32 text-emerald-600" />
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Patience Score</p>
          <div className="text-5xl font-black mb-4">{patienceInfo.score.toFixed(1)}pt</div>
          <Badge className={cn("border-none px-3 py-1 rounded-full", 
            patienceInfo.stage === 'seed' ? 'bg-orange-100 text-orange-700' :
            patienceInfo.stage === 'sprout' ? 'bg-emerald-100 text-emerald-700' :
            patienceInfo.stage === 'tree' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
          )}>
            {patienceInfo.label}
          </Badge>
        </div>

        <div className="p-8 rounded-[2rem] bg-zinc-950 text-zinc-50 shadow-xl relative overflow-hidden group">
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Zap className="w-32 h-32 text-yellow-400" />
             </div>
             <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-2">Service Status</p>
             <div className="text-3xl font-black mb-2">복리 마법 작동중</div>
             <p className="text-xs opacity-50 leading-relaxed font-medium">자산이 스스로 일하는 구조가<br />안정적으로 유지되고 있습니다. ☕</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold">누적 수익률 추이</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-lg h-7 border-zinc-200 dark:border-zinc-800">1주</Badge>
            <Badge variant="outline" className="rounded-lg h-7 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-none">1개월</Badge>
            <Badge variant="outline" className="rounded-lg h-7 border-zinc-200 dark:border-zinc-800">전체</Badge>
          </div>
        </div>
        <RoiChart data={chartData} />
      </div>

      <div className="rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          최근 기록
          <Badge variant="secondary" className="font-normal text-[10px]">{logs?.length || 0} Records</Badge>
        </h3>
        <div className="space-y-4">
          {logs && logs.length > 0 ? logs.slice(-5).reverse().map((log) => (
            <div key={log.id} className="flex items-center justify-between p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <TrendingUp className={cn("w-6 h-6", Number(log.virtual_return_pct) >= 0 ? "text-emerald-500" : "text-rose-500")} />
                </div>
                <div>
                  <p className="font-bold text-lg">{new Date(log.recorded_date).toLocaleDateString()}</p>
                  <p className="text-xs text-zinc-500 font-medium">{log.reason || '일간 자본 성장 기록'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-black text-2xl tracking-tighter", Number(log.virtual_return_pct) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {Number(log.virtual_return_pct) >= 0 ? '+' : ''}{Number(log.virtual_return_pct).toFixed(2)}%
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold border-zinc-200 dark:border-zinc-700">
                    SCORE: {Number(log.patience_score).toFixed(1)}pt
                  </Badge>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-zinc-400">
              <p>기록된 데이터가 아직 없습니다.</p>
              <p className="text-xs mt-1">내일부터 첫 성적표가 도착할 예정입니다!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

