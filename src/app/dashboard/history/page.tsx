import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch archived bundles
  const { data: archivedBundles } = await supabase
    .from('bundles')
    .select('*, bundle_series(name)')
    .eq('status', 'archived')
    .order('valid_until', { ascending: false })

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-4xl font-black tracking-tight">과거 번들 보기</h1>
        <p className="text-zinc-500 border-l-2 border-indigo-500 pl-3 mt-2">지난 기간 동안 제안되었던 큐레이션 역사를 살펴봅니다.</p>
      </header>

      {archivedBundles && archivedBundles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {archivedBundles.map((bundle) => (
            <Card key={bundle.id} className="rounded-[2rem] border-none shadow-lg bg-white dark:bg-zinc-900 group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none rounded-full px-3 py-1 text-[10px] font-bold">
                    {bundle.bundle_series?.name || bundle.theme}
                  </Badge>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5 slice-in-from-right-2 duration-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(bundle.valid_from).toLocaleDateString()} - {bundle.valid_until ? new Date(bundle.valid_until).toLocaleDateString() : 'Present'}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-indigo-600 transition-colors leading-tight">{bundle.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs font-medium mt-1 leading-relaxed">{bundle.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pt-4 mt-2 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 tracking-widest">ARCHIVED</span>
                  <Link 
                    href={`/dashboard/bundle/${bundle.id}`} 
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform"
                  >
                    상세보기
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-6 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 shadow-sm">
            <History className="w-16 h-16 text-zinc-200 dark:text-zinc-800" />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight">아직 보관된 번들이 없습니다.</p>
            <p className="text-sm text-zinc-400 font-medium mt-1">시간이 지나 번들이 업데이트되면 이곳에서 과거 기록을 보실 수 있습니다.</p>
          </div>
        </div>
      )}

      <div className="p-10 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
          <History className="w-40 h-40 text-indigo-900 dark:text-indigo-100" />
        </div>
        <h3 className="font-black text-2xl text-indigo-900 dark:text-indigo-300 mb-4 tracking-tight">과거 번들을 왜 보나요?</h3>
        <p className="text-sm text-indigo-700 dark:text-indigo-400/80 leading-relaxed font-medium max-w-2xl">
          The Bundle은 시장 환경의 변화에 따라 적절한 ETF 구성을 제안합니다. 과거 번들의 구성과 당시의 큐레이션 논리를 복기하는 것은 훌륭한 투자 복습 과정이 됩니다. 또한, 자신이 보유하고 있는 과거 번들의 성과를 현재와 비교해보며 꾸준히 투자하는 동력을 얻을 수 있습니다.
        </p>
      </div>
    </div>
  )
}

