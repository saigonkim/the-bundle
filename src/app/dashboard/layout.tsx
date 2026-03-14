import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar user={user} className="hidden md:flex w-64 border-r bg-white dark:bg-zinc-900" />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
