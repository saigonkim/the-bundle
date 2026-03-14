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

import { UserProfileDropdown } from './user-profile-dropdown'

export function Sidebar({ className, user }: { className?: string, user?: any }) {
  const pathname = usePathname()

  return (
    <aside className={cn(
      "border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen sticky top-0 bg-white dark:bg-zinc-950 overflow-hidden",
      className
    )}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          The Bundle
        </Link>
        {user && <UserProfileDropdown user={user} />}
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
        <Link
           href="/dashboard/settings"
           className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <Settings className="w-4 h-4" />
          시스템 설정
        </Link>
      </div>
    </aside>
  )
}
