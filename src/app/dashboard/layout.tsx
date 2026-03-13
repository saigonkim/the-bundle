import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar className="hidden md:flex w-64 border-r bg-white dark:bg-zinc-900" />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
