import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-200 shadow-xl dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">The Bundle</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            커피 한 잔의 가치로 시작하는 스마트한 자산 관리
          </CardDescription>
        </CardHeader>
        <form action={login}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" required className="h-11" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-11 text-base font-medium transition-all hover:scale-[1.02]" type="submit">
              로그인
            </Button>
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              계정이 없으신가요?{' '}
              <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
