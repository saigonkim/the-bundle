import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const { error, success } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-200 shadow-xl dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">회원가입</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            [The Bundle]과 함께 현명한 투자 습관을 길러보세요
          </CardDescription>
        </CardHeader>
        <form action={signup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400 border border-green-500/20">
                인증 메일이 발송되었습니다. 이메일을 확인해주세요!
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" required className="h-11" />
              <p className="text-xs text-zinc-500">최소 6자 이상 입력해주세요.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-11 text-base font-medium transition-all hover:scale-[1.02]" type="submit">
              가입하기
            </Button>
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              이미 계정이 있으신가요?{' '}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                로그인
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
