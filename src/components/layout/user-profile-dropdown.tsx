'use client'

import { logout } from '@/app/auth/actions'
import { useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface UserProfileDropdownProps {
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await logout()
    })
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자'
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={(props) => (
          <button
            {...props}
            className="flex items-center justify-center p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all outline-none group"
            aria-label="User profile"
          >
            <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-zinc-950 text-white dark:bg-zinc-800 dark:text-zinc-200 font-bold text-[10px] uppercase">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      />
      <DropdownMenuContent className="w-56 rounded-2xl p-2 shadow-xl border border-zinc-200 dark:border-zinc-800" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-zinc-500 truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
        <DropdownMenuItem
          render={(props) => (
            <Link
              {...props}
              href="/dashboard/settings"
              className="flex items-center gap-2 rounded-xl focus:bg-zinc-50 dark:focus:bg-zinc-800 p-2 text-sm font-medium cursor-pointer"
            >
              <User className="w-4 h-4" />
              프로필 보기
            </Link>
          )}
        />
        <DropdownMenuItem
          render={(props) => (
            <Link
              {...props}
              href="/dashboard/settings"
              className="flex items-center gap-2 rounded-xl focus:bg-zinc-50 dark:focus:bg-zinc-800 p-2 text-sm font-medium cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
              설정
            </Link>
          )}
        />
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
        <DropdownMenuItem 
          nativeButton={true}
          render={(props) => (
            <button
              {...props}
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center gap-2 rounded-xl focus:bg-rose-50 dark:focus:bg-rose-950/30 p-2 text-sm font-medium cursor-pointer text-rose-500 focus:text-rose-600 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isPending ? '로그아웃 중...' : '로그아웃'}
            </button>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
