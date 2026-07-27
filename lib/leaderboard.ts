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

export async function getLeaderboard(leagueId: string): Promise<LeaderboardEntry[]> {
  // Get all members of the league
  const { data: members } = await supabase
    .from('league_members')
    .select('user_id, profiles(id, username)')
    .eq('league_id', leagueId)

  if (!members) return []

  // For each member, calculate their total points
  const entries: LeaderboardEntry[] = []

  for (const member of members) {
    const profile = member.profiles as unknown as { id: string; username: string }

    const { data: predictions } = await supabase
      .from('predictions')
      .select('points_earned, matches(date)')
      .eq('user_id', member.user_id)
      .not('points_earned', 'is', null)

    const totalPoints = predictions?.reduce((sum, p) => sum + (p.points_earned ?? 0), 0) ?? 0
    const exactScores = predictions?.filter((p) => (p.points_earned ?? 0) >= 10).length ?? 0

    // Calculate recent form
    const sortedPredictions = [...(predictions || [])].sort((a, b) => {
      // @ts-ignore - Supabase types might be strict here
      const dateA = a.matches?.date ? new Date(a.matches.date).getTime() : 0
      // @ts-ignore
      const dateB = b.matches?.date ? new Date(b.matches.date).getTime() : 0
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
      predictionsCount: predictions?.length ?? 0,
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
