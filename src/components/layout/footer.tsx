import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-12 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-sm font-bold text-zinc-400 italic">© 2026 The Bundle. All rights reserved.</p>
        <div className="flex gap-8 text-sm font-bold text-zinc-500">
          <Link href="#" className="hover:text-zinc-900 transition-colors">이용약관</Link>
          <Link href="#" className="hover:text-zinc-900 transition-colors">개인정보처리방침</Link>
          <Link href="#" className="hover:text-zinc-900 transition-colors">문의하기</Link>
        </div>
      </div>
    </footer>
  )
}
