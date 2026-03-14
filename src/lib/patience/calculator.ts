export type PatienceStage = 'seed' | 'sprout' | 'tree' | 'sage'

export interface PatienceInfo {
  score: number
  stage: PatienceStage
  label: string
  color: string
  nextThreshold: number
}

export function getPatienceInfo(score: number): PatienceInfo {
  if (score < 26) {
    return {
      score,
      stage: 'seed',
      label: '씨앗 투자가',
      color: 'text-orange-500',
      nextThreshold: 26
    }
  } else if (score < 51) {
    return {
      score,
      stage: 'sprout',
      label: '새싹 투자가',
      color: 'text-emerald-500',
      nextThreshold: 51
    }
  } else if (score < 76) {
    return {
      score,
      stage: 'tree',
      label: '나무 투자가',
      color: 'text-indigo-500',
      nextThreshold: 76
    }
  } else {
    return {
      score,
      stage: 'sage',
      label: '현인 투자가',
      color: 'text-purple-500',
      nextThreshold: 100
    }
  }
}

export function calculateDailyPatienceIncrement(consecutiveDays: number): number {
  // Base increment: 0.1 per day
  // Bonus if they hold for long (e.g., > 30 days): 0.2
  // For now, simple 0.1 as per PRD
  return 0.1
}
