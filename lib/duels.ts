import { createClient } from '@/lib/supabase/client'
import { H2HChallenge } from './reactions'

const supabase = createClient()

export async function getUnseenCompletedDuels(userId: string): Promise<H2HChallenge[]> {
  const { data } = await supabase
    .from('h2h_challenges')
    .select(`
      *,
      challenger:profiles!h2h_challenges_challenger_id_fkey(username, avatar_url),
      challenged:profiles!h2h_challenges_challenged_id_fkey(username, avatar_url),
      match:matches!h2h_challenges_match_id_fkey(home_team, away_team, scheduled_at, home_score, away_score)
    `)
    .eq('status', 'completed')
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (!data) return []

  // Filter those where the current user hasn't seen it yet
  return (data as H2HChallenge[]).filter(duel => {
    if (duel.challenger_id === userId && !duel.viewed_by_challenger) return true
    if (duel.challenged_id === userId && !duel.viewed_by_challenged) return true
    return false
  })
}

export async function markDuelAsSeen(duelId: string, userId: string, isChallenger: boolean) {
  const updateData = isChallenger 
    ? { viewed_by_challenger: true }
    : { viewed_by_challenged: true }

  await supabase
    .from('h2h_challenges')
    .update(updateData)
    .eq('id', duelId)
}
