"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RoiChartProps {
  data: {
    recorded_date: string
    roi: number
    patience_score: number
  }[]
}

export function RoiChart({ data }: RoiChartProps) {
  return (
    <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-900 pb-6">
        <div>
          <CardTitle className="text-xl font-bold">수익률 추이</CardTitle>
          <CardDescription>구독 시작 이후 나의 자산 성장 기록입니다.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis 
                dataKey="recorded_date" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-2xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 shadow-2xl">
                        <p className="text-xs font-bold text-zinc-400 mb-1">{payload[0].payload.recorded_date}</p>
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-black text-indigo-600">
                            ROI: {payload[0].value}%
                          </span>
                          <span className="text-xs text-zinc-500">
                            Patient Score: {payload[0].payload.patience_score}pt
                          </span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line 
                type="monotone" 
                dataKey="roi" 
                stroke="#4f46e5" 
                strokeWidth={4} 
                dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
