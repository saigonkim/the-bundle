import { createClient } from '@/lib/supabase/server'
import { RoiChart } from '@/components/dashboard/roi-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Award, Zap, ArrowUpRight, Info, FileText, CheckCircle2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { getPatienceInfo } from '@/lib/patience/calculator'
import { DownloadReportButton } from '@/components/dashboard/download-report-button'

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
        </div>
        <RoiChart data={chartData} />
      </div>

      <div className="rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20 p-8 space-y-4">
        <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
          <Info className="w-5 h-5" />
          The Bundle 지수 가이드
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">📈 누적 ROI (Bundle Index)</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              매달 번들이 업데이트(리밸런싱)되어도 수익률이 끊기지 않도록 체이닝된 통합 지수입니다. 
              가입일 대비 자산의 순수 성장률을 의미합니다.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">💎 기다림 지수 (Patience Score)</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              수익률과 별개로, 시장의 흔들림에도 번들을 유지하며 길게 투자한 시간을 점수화한 당신의 투자 근력입니다.
            </p>
          </div>
        </div>
      </div>

      <div id="performance-insight-report" className="rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm space-y-8">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          주간 성과 인사이트
          <Badge className="bg-emerald-500 text-white border-none ml-2">NEW</Badge>
        </h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              Performance Snapshot
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Benchmark (S&P 500)</span>
                <span className="font-bold">+1.2%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">My Bundle</span>
                <span className="font-bold text-emerald-500">+2.4%</span>
              </div>
              <Progress value={75} className="h-1.5 mt-2" />
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              Bundle Health
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-xs font-black">
                92%
              </div>
              <div>
                <p className="text-sm font-bold">안정적인 분산</p>
                <p className="text-[10px] text-zinc-500">기술주 비중 65% 유지중</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              Weekly Action
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">"현 상태 유지 (HODL)"</p>
              <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 mt-1">4월 리밸런싱까지 추가 대응이 필요 없습니다.</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-indigo-600 text-white relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-lg mb-1">AI 요약 인사이트 🤖</h4>
              <p className="text-sm opacity-90 leading-relaxed max-w-2xl">
                금리 인하 동결에 따라 나스닥의 변동성이 컸지만, 반도체 올인 번들이 보유한 제조 ETF들이 방어력을 보여주었습니다. 
                현재 지수는 가입 시점 대비 순항 중이며 리밸런싱 주기인 월초까지 보유를 권장합니다.
              </p>
            </div>
            <DownloadReportButton />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        </div>
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
                  <p className="font-bold text-lg">{formatDate(log.recorded_date)}</p>
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

