import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LandingActionButton } from '@/components/landing/landing-action-button'
import { createClient } from '@/lib/supabase/server'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="glass sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            The Bundle
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">대시보드</Link>
            <Link href="/about" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">서비스 소개</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <LandingActionButton 
              href="/dashboard" 
              label="내 대시보드" 
              size="sm"
            />
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="font-medium">로그인</Button>
              </Link>
              <LandingActionButton 
                href="/auth/signup" 
                label="시작하기" 
                size="sm"
              />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
