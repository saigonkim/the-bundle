import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { User, Bell, Shield, Smartphone, ChevronRight, FlaskConical } from 'lucide-react'
import { TestSimulator } from '@/components/dashboard/test-simulator'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-4xl font-black tracking-tight">설정</h1>
        <p className="text-zinc-500 border-l-2 border-indigo-500 pl-3 mt-2">계정 관리 및 서비스 알림 설정을 관리합니다.</p>
      </header>

      <div className="grid gap-8">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900/50 overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">프로필 정보</CardTitle>
                <CardDescription className="font-medium text-xs">로그인 및 서비스 이용에 필요한 기본 정보입니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">이메일 주소</Label>
                <Input id="email" value={user.email} disabled className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 font-medium" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">이름 (닉네임)</Label>
                <Input id="name" placeholder="닉네임을 입력하세요" className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 transition-all font-medium" />
              </div>
            </div>
            <Button className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
              변경 사항 저장
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900/50 overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">알림 및 푸시</CardTitle>
                <CardDescription className="font-medium text-xs">꼭 필요한 정보만 선별해서 보내드립니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-4">
            {[
              { title: '새 번들 업데이트 알림', desc: '선택한 테마의 새 번들이 발행되면 실시간으로 알려드립니다.', checked: true },
              { title: '수익률 분석 리포트', desc: '나의 번들 수익률과 성과 지표를 주간 단위로 요약해 드립니다.', checked: true },
              { title: '마케팅 정보 수신', desc: 'The Bundle의 새로운 이벤트와 혜택 정보를 가장 먼저 받아봅니다.', checked: false },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group">
                <div className="space-y-1">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                  <p className="text-xs text-zinc-400 font-medium">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.checked} className="data-[state=checked]:bg-indigo-600" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="rounded-3xl border-none shadow-xl bg-white dark:bg-zinc-900/50 overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800 group hover:shadow-2xl transition-all duration-500">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                  <CardTitle className="text-base font-bold">보안 설정</CardTitle>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <Button variant="outline" className="w-full h-12 rounded-xl border-zinc-200 font-bold hover:bg-zinc-50 transition-all">비밀번호 변경</Button>
            </CardContent>
          </Card>
          
          <Card className="rounded-3xl border-none shadow-xl bg-white dark:bg-zinc-900/50 overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800 group hover:shadow-2xl transition-all duration-500">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-zinc-400 group-hover:text-sky-500 transition-colors" />
                  <CardTitle className="text-base font-bold">로그인 기기 관리</CardTitle>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <Button variant="outline" className="w-full h-12 rounded-xl border-zinc-200 font-bold hover:bg-zinc-50 transition-all text-rose-500 hover:text-rose-600 hover:border-rose-100">모든 기기에서 로그아웃</Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Tools Section */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
           <TestSimulator />
        </div>
      </div>
    </div>
  )
}

