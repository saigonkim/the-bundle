import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Coffee, ShieldCheck, Sparkles } from 'lucide-react'
import { LandingActionButton } from '@/components/landing/landing-action-button'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const href = user ? "/dashboard" : "/auth/signup"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32 bg-white dark:bg-zinc-950">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-16 animate-float opacity-20">
              <Sparkles className="w-24 h-24 text-indigo-600" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-7xl mb-8 leading-tight text-gradient">
              커피 한 잔으로 시작하는<br />
              당신의 첫 번째 ETF 번들
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400 mb-10">
              어려운 금융 용어도, 복잡한 종목 분석도 필요 없습니다.<br />
              20대 사회초년생을 위해 친숙한 비유로 큐레이션된 10종의 ETF를 경험하세요.
            </p>
            <div className="flex items-center justify-center gap-6">
              <LandingActionButton 
                href={href} 
                label={user ? '내 대시보드 바로가기' : '구독 시작하기'} 
              />
              <Link href="/about">
                <Button variant="ghost" size="lg" className="h-14 px-8 text-lg font-medium rounded-full">
                  더 알아보기
                </Button>
              </Link>
            </div>

            {/* Feature Icons */}
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center mb-4 shadow-sm">
                  <Coffee className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">한 달 4,900원</h3>
                <p className="text-sm text-zinc-500 mt-2 text-center">커피 한 잔보다 저렴한 비용으로<br />전문적인 금융 큐레이션 제공</p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center mb-4 shadow-sm">
                  <Sparkles className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">20대 맞춤 언어</h3>
                <p className="text-sm text-zinc-500 mt-2 text-center">AI가 풀어주는 쉬운 비유로<br />어려운 경제도 척척 이해해요</p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center mb-4 shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">기다림 지수</h3>
                <p className="text-sm text-zinc-500 mt-2 text-center">얼마나 잘 견뎠는지 지표로 확인하며<br />건강한 투자 습관을 형성합니다</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
