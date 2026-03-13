import { createClient } from '@/lib/supabase/server'
import { RoiChart } from '@/components/dashboard/roi-chart'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Award, Zap, ArrowUpRight } from 'lucide-react'

export default async function PerformancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: logs } = await supabase
    .from('patience_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_date', { ascending: true })

  const latestLog = logs && logs.length > 0 ? logs[logs.length - 1] : null
  const firstLog = logs && logs.length > 0 ? logs[0] : null
  
  const totalGain = latestLog && firstLog ? (latestLog.roi - firstLog.roi).toFixed(2) : "0.00"

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">수익률 트래킹</h1>
        <p className="text-zinc-500">시간이 지날수록 단단해지는 나의 자산 성적표입니다.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Total ROI</p>
          <div className="text-4xl font-black mb-2">{latestLog?.roi.toFixed(2) || "0.00"}%</div>
          <div className="flex items-center gap-1 text-sm font-bold bg-white/20 w-fit px-2 py-0.5 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            지난 30일간 {totalGain}% 성장
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Award className="w-32 h-32 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Patience Score</p>
          <div className="text-4xl font-black mb-2">{latestLog?.patience_score || 0}pt</div>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-none">
            성실한 투자가
          </Badge>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 text-zinc-50 shadow-xl relative overflow-hidden group">
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Zap className="w-32 h-32 text-yellow-400" />
             </div>
             <p className="text-xs font-bold opacity-50 uppercase tracking-widest mb-1">Status</p>
             <div className="text-2xl font-bold mb-2">복리 마법 진행중</div>
             <p className="text-xs opacity-50">자산이 스스로 일하는 중입니다. ☕</p>
        </div>
      </div>

      <RoiChart data={logs || []} />

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8">
        <h3 className="text-lg font-bold mb-6">최근 기록</h3>
        <div className="space-y-4">
          {logs?.slice(-5).reverse().map((log) => (
            <div key={log.recorded_date} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  <TrendingUp className={cn("w-5 h-5", log.roi >= 0 ? "text-emerald-500" : "text-rose-500")} />
                </div>
                <div>
                  <p className="font-bold">{log.recorded_date}</p>
                  <p className="text-xs text-zinc-500">일간 성적표</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-bold text-lg", log.roi >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {log.roi >= 0 ? '+' : ''}{log.roi.toFixed(2)}%
                </p>
                <p className="text-[10px] text-zinc-400">SCORE: {log.patience_score}pt</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
