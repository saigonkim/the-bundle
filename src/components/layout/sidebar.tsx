'use client'

import { LayoutDashboard, Wallet, TrendingUp, History, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const sidebarItems = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '내 구독 정보', href: '/dashboard/subscription', icon: Wallet },
  { name: '수익률 트래킹', href: '/dashboard/performance', icon: TrendingUp },
  { name: '과거 번들 보기', href: '/dashboard/history', icon: History },
  { name: '설정', href: '/dashboard/settings', icon: Settings },
]

import { logout } from '@/app/auth/actions'

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside className={cn(
      "border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-950 overflow-hidden",
      className
    )}>
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          The Bundle
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive 
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 shadow-md transform scale-[1.02]" 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-inherit" : "group-hover:text-inherit")} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800">
        <form action={logout}>
             <button
               type="submit"
               className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all text-left"
             >
               <LogOut className="w-5 h-5" />
               로그아웃
             </button>
        </form>
      </div>
    </aside>
  )
}
