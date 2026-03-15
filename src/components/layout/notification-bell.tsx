'use client'

import { useState } from 'react'
import { Bell, Check, Info, TrendingUp, Sparkles } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  description: string
  time: string
  type: 'update' | 'performance' | 'system'
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '새로운 반도체 번들 발행',
    description: '2026년 4월 AI 반도체 테마 번들이 업데이트되었습니다. 지금 종목 구성을 확인해보세요.',
    time: '방금 전',
    type: 'update',
    read: false
  },
  {
    id: '2',
    title: '수익률 달성 축하!',
    description: '구독 시작 이후 누적 수익률이 +5.2%를 기록했습니다. 기다림의 결실이 맺히고 있네요.',
    time: '2시간 전',
    type: 'performance',
    read: false
  },
  {
    id: '3',
    title: '주간 수익률 리포트 도착',
    description: '지난주 번들 성과 분석 리포트가 생성되었습니다. 수익률 트래킹 메뉴에서 확인하세요.',
    time: '어제',
    type: 'system',
    read: true
  }
]

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const hasUnread = notifications.some(n => !n.read)

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={(props) => (
          <button
            {...props}
            className="relative flex items-center justify-center p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all outline-none group"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            {hasUnread && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950 animate-bounce" />
            )}
          </button>
        )}
      />
      <DropdownMenuContent className="w-80 rounded-2xl p-0 shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <div className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-2xl">
            <DropdownMenuLabel className="font-bold text-sm m-0 text-zinc-900 dark:text-zinc-50">알림</DropdownMenuLabel>
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              모두 읽음으로 표시
            </button>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="m-0 bg-zinc-100 dark:bg-zinc-800" />
        <div className="max-h-80 overflow-y-auto">
          <DropdownMenuGroup className="p-2 space-y-1">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={(e) => {
                  e.preventDefault()
                  markAsRead(notification.id)
                }}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer transition-colors focus:bg-zinc-50 dark:focus:bg-zinc-800 outline-none",
                  !notification.read && "bg-indigo-50/30 dark:bg-indigo-900/10"
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    notification.type === 'update' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                    notification.type === 'performance' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                  )}>
                    {notification.type === 'update' && <Sparkles className="w-3 h-3" />}
                    {notification.type === 'performance' && <TrendingUp className="w-3 h-3" />}
                    {notification.type === 'system' && <Info className="w-3 h-3" />}
                  </div>
                  <span className="font-bold text-xs flex-1 text-zinc-900 dark:text-zinc-100">{notification.title}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">{notification.time}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-8">
                  {notification.description}
                </p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </div>
        <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl border-t border-zinc-100 dark:border-zinc-800">
          <button className="w-full text-[11px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            지난 알림 모두 보기
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
