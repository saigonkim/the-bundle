'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Series {
  id: string
  name: string
}

export function SeriesFilter({ seriesList }: { seriesList: Series[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSeriesId = searchParams.get('series') || 'aabe7761-e6e2-45d0-aee9-29c727644c3f'

  const selectedSeries = seriesList.find(s => s.id === currentSeriesId)

  const handleValueChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('series', value)
    router.push(`/dashboard/performance?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-zinc-500 hidden md:inline">테마 선택:</span>
      <Select value={currentSeriesId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold shadow-sm h-10">
          <SelectValue placeholder="테마 선택">
            {selectedSeries?.name || "테마 선택"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
          {seriesList.map((s) => (
            <SelectItem key={s.id} value={s.id} className="font-medium">
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
