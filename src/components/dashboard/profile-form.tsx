'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateProfile } from '@/app/dashboard/settings/profile-action'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProfileFormProps {
  initialName: string
  email: string
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('닉네임을 입력해주세요.')
      return
    }

    setIsPending(true)
    try {
      const result = await updateProfile(name)
      if (result.success) {
        toast.success('프로필이 업데이트되었습니다.')
        router.refresh()
      } else {
        toast.error(result.error || '업데이트에 실패했습니다.')
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">이메일 주소</Label>
          <Input 
            id="email" 
            value={email} 
            disabled 
            className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 font-medium" 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">이름 (닉네임)</Label>
          <Input 
            id="name" 
            placeholder="닉네임을 입력하세요" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 transition-all font-medium" 
          />
        </div>
      </div>
      <Button 
        onClick={handleSave}
        disabled={isPending}
        className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none min-w-[140px]"
      >
        {isPending ? '저장 중...' : '변경 사항 저장'}
      </Button>
    </div>
  )
}
