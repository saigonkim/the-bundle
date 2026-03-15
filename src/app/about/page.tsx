import { Header } from '@/components/layout/header'
import { LandingActionButton } from '@/components/landing/landing-action-button'
import { createClient } from '@/lib/supabase/server'
import { Coffee, Sparkles, ShieldCheck, TrendingUp, Heart, CheckCircle2, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Footer } from '@/components/layout/footer'

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const href = user ? "/dashboard" : "/auth/signup"

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 dark:opacity-10">
            <div className="absolute top-10 left-1/4 w-72 h-72 bg-indigo-400 rounded-full blur-[120px]" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-400 rounded-full blur-[120px]" />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Sparkles className="w-4 h-4" />
                금융이 쉬워지는 순간
              </div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl leading-[1.1]">
                복잡한 투자를<br />
                <span className="text-indigo-600">친절한 비유</span>로 번들링하다
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium">
                더 번들(The Bundle)은 사회초년생의 첫 자산 형성을 돕기 위해 태어났습니다.<br />
                우리는 숫자가 아닌 '가치'를 전달하며, 투자를 하나의 즐거운 습관으로 만듭니다.
              </p>
            </div>
          </div>
        </section>

        {/* Vision Cards */}
        <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Coffee className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black mb-4">커피 한 잔의 가치</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  월 4,900원. 스타벅스 아메리카노 한 잔보다 저렴한 비용으로 전문가가 엄선한 ETF 번들 리포트를 매월 받아보세요. 
                  우리는 진입장벽을 낮추는 것부터 시작합니다.
                </p>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black mb-4">쉬운 비유, 깊은 인사이트</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  '모멘텀', '괴리율' 같은 어려운 말은 잊으세요. AI가 리밸런싱 이유를 20대의 언어로 풀어드립니다. 
                  마치 친구가 설명해주는 것처럼 투자의 핵심을 이해할 수 있습니다.
                </p>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-black mb-4">견디는 힘, 기다림 지수</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  투자의 성공은 결국 '기다림'에서 옵니다. 단순히 수익률만 쫓는 것이 아니라, 
                  당신이 얼마나 안정적으로 포트폴리오를 유지하고 있는지 데이터로 증명해드립니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 space-y-8">
                <h2 className="text-4xl font-black tracking-tight">서비스가 작동하는 방식</h2>
                <div className="space-y-10">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-lg shadow-lg">1</div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold">테마별 번들 큐레이션</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">관리자가 직접 선정하고 리밸런싱하는 미국 우량주, K-혁신, 반도체 등 다양한 테마의 ETF 번들을 제공합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-lg shadow-lg">2</div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold">성공적인 투자 루틴 형성</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">매일 업데이트되는 수익률과 기다림 지수를 통해 일상의 투자를 가볍고 즐겁게 관리할 수 있습니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-lg shadow-lg">3</div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold">위클리 리포트 & 알림</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">시장 상황을 반영한 주간 인사이트 리포트와 뉴스레터를 통해 투자의 맥락을 놓치지 않게 도와드립니다.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full max-w-sm lg:max-w-none">
                <div className="relative aspect-square rounded-[3rem] bg-indigo-600 p-8 shadow-2xl shadow-indigo-500/30 overflow-hidden flex flex-col justify-center text-white">
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent pointer-events-none" />
                  <TrendingUp className="w-20 h-20 mb-6" />
                  <h3 className="text-3xl font-black mb-4">복리보다 강력한건<br />나의 꾸준함입니다.</h3>
                  <p className="opacity-80 font-medium">The Bundle은 당신의 꾸준함을 수치화하고 응원합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-5xl p-12 lg:p-20 rounded-[4rem] bg-zinc-950 dark:bg-indigo-600 text-white text-center space-y-10 relative overflow-hidden">
             <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                  더 이상 헤매지 마세요.<br />
                  당신의 첫 번들을 만나보세요.
                </h2>
                <p className="text-zinc-400 dark:text-white/80 max-w-xl mx-auto text-lg mt-6">
                  오늘 커피 한 잔을 아껴 당신의 미래를 번들링하세요.
                </p>
                <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <LandingActionButton 
                    href={href} 
                    label={user ? '내 대시보드로 돌아가기' : '지금 바로 시작하기 (4,900원/월)'} 
                    size="lg"
                  />
                </div>
             </div>
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
