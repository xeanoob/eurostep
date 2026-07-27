import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  totalPoints: number
  predictionsCount: number
  exactScores: number
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
      .select('points_earned')
      .eq('user_id', member.user_id)
      .not('points_earned', 'is', null)

    const totalPoints = predictions?.reduce((sum, p) => sum + (p.points_earned ?? 0), 0) ?? 0
    const exactScores = predictions?.filter((p) => p.points_earned === 10).length ?? 0

    entries.push({
      rank: 0,
      userId: member.user_id,
      username: profile?.username ?? 'Joueur',
      totalPoints,
      predictionsCount: predictions?.length ?? 0,
      exactScores,
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
