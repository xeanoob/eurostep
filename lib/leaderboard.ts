import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type FormResult = 'exact' | 'good' | 'bad'

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  totalPoints: number
  predictionsCount: number
  exactScores: number
  recentForm: FormResult[]
}

export async function getLeaderboard(leagueId: string, timeframe: 'all-time' | 'week' = 'all-time'): Promise<LeaderboardEntry[]> {
  // Get all members of the league
  const { data: members } = await supabase
    .from('league_members')
    .select('user_id, profiles(id, username)')
    .eq('league_id', leagueId)

  if (!members) return []

  // Calculate the start of the week if timeframe is 'week'
  let startOfWeek: Date | null = null
  if (timeframe === 'week') {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    startOfWeek = new Date(now.setDate(diff))
    startOfWeek.setHours(0, 0, 0, 0)
  }

  // For each member, calculate their total points
  const entries: LeaderboardEntry[] = []

  for (const member of members) {
    const profile = member.profiles as unknown as { id: string; username: string }

    const { data: predictions } = await supabase
      .from('predictions')
      .select('points_earned, matches(scheduled_at)')
      .eq('user_id', member.user_id)
      .not('points_earned', 'is', null)

    // Filter predictions by timeframe
    const validPredictions = predictions?.filter(p => {
      if (timeframe === 'all-time') return true
      // @ts-ignore
      const matchDate = p.matches?.scheduled_at ? new Date(p.matches.scheduled_at) : null
      if (!matchDate || !startOfWeek) return false
      return matchDate >= startOfWeek
    }) || []

    const totalPoints = validPredictions.reduce((sum, p) => sum + (p.points_earned ?? 0), 0)
    const exactScores = validPredictions.filter((p) => (p.points_earned ?? 0) >= 10).length

    // Calculate recent form (based on validPredictions)
    const sortedPredictions = [...validPredictions].sort((a, b) => {
      // @ts-ignore
      const dateA = a.matches?.scheduled_at ? new Date(a.matches.scheduled_at).getTime() : 0
      // @ts-ignore
      const dateB = b.matches?.scheduled_at ? new Date(b.matches.scheduled_at).getTime() : 0
      return dateB - dateA
    })

    const recentForm: FormResult[] = sortedPredictions.slice(0, 5).map(p => {
      const pts = p.points_earned ?? 0
      if (pts >= 10) return 'exact'
      if (pts > 0) return 'good'
      return 'bad'
    })

    entries.push({
      rank: 0,
      userId: member.user_id,
      username: profile?.username ?? 'Joueur',
      totalPoints,
      predictionsCount: validPredictions.length,
      exactScores,
      recentForm,
    })
  }

  // Sort by total points descending
  entries.sort((a, b) => b.totalPoints - a.totalPoints)
  entries.forEach((entry, i) => (entry.rank = i + 1))

  return entries
}

export async function getUserStats(userId: string) {
  const { data: predictions } = await supabase
    .from('predictions')
    .select('points_earned')
    .eq('user_id', userId)
    .not('points_earned', 'is', null)

  const totalPoints = predictions?.reduce((sum, p) => sum + (p.points_earned ?? 0), 0) ?? 0
  const exactScores = predictions?.filter((p) => p.points_earned === 10).length ?? 0
  const totalPredictions = predictions?.length ?? 0
  const correctPredictions = predictions?.filter((p) => (p.points_earned ?? 0) > 0).length ?? 0
  const successRate = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0

  return { totalPoints, exactScores, totalPredictions, successRate }
}
