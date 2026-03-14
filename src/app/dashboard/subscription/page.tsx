import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, CreditCard, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { SubscriptionSubmitButton } from '@/components/dashboard/subscription-button'
import { createMockSubscription } from '../subscription-action'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const isSubscribed = subscription?.status === 'active'

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">내 구독 정보</h1>
        <p className="text-zinc-500">결제 및 서비스 이용 내역을 관리합니다.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="p-2 w-fit rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                <Wallet className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
              </div>
              <Badge variant={isSubscribed ? "default" : "secondary"} className={isSubscribed ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                {isSubscribed ? "구독 중" : "미구독"}
              </Badge>
            </div>
            <CardTitle className="text-2xl mt-4">The Bundle Premium</CardTitle>
            <CardDescription>매월 큐레이션되는 테마별 ETF 번들을 무제한으로 이용하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-medium">결제 금액</span>
              </div>
              <span className="font-bold">4,900원 / 월</span>
            </div>
            
            {isSubscribed && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium">다음 결제 예정일</span>
                </div>
                <span className="font-bold">
                  {new Date(subscription.next_billing_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            {isSubscribed ? (
              <Button variant="outline" className="w-full rounded-2xl h-12 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-100 dark:border-rose-900">
                구독 해지하기
              </Button>
            ) : (
              <form action={createMockSubscription} className="w-full">
                <SubscriptionSubmitButton 
                  text="구독 시작하기"
                  className="w-full rounded-2xl h-12 bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 hover:scale-[1.02] transition-transform"
                />
              </form>
            )}
          </CardFooter>
        </Card>


        <Card className="rounded-3xl border-none shadow-xl bg-zinc-950 dark:bg-zinc-900 text-white overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              프리미엄 혜택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                "10가지 고정 테마 번들 실시간 업데이트 전용 접근",
                "AI 기반의 ETF 상세 큐레이션 및 비유 리포트",
                "수익률 트래킹 및 기다림 지수(Patience Gauge) 시스템",
                "과거 아카이브 번들 무제한 조회",
                "프리미엄 전용 금융 분석 알림"
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  <span className="text-sm text-zinc-300 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-zinc-400" />
          결제 내역
        </h2>
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2">
          {isSubscribed ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase">
                <tr>
                  <th className="px-6 py-4">날짜</th>
                  <th className="px-6 py-4">항목</th>
                  <th className="px-6 py-4">금액</th>
                  <th className="px-6 py-4 text-right">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="px-6 py-4 font-medium">{new Date(subscription.subscribed_at).toLocaleDateString('ko-KR')}</td>
                  <td className="px-6 py-4">The Bundle Premium 전용 (1개월)</td>
                  <td className="px-6 py-4">4,900원</td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">결제 완료</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-20 text-center space-y-2">
              <p className="text-zinc-500">결제 내역이 없습니다.</p>
              <p className="text-xs text-zinc-400">구독을 시작하시면 결제 내역을 확인할 수 있습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
