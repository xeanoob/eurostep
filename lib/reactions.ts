import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ─── Prediction Reactions ───────────────────────────────────

export interface PredictionReaction {
  id: string
  prediction_id: string
  user_id: string
  emoji: string
  created_at: string
  profiles?: { username: string }
}

const REACTION_EMOJIS = ['🤡', '🐐', '🧱', '🔥', '💀'] as const
export type ReactionEmoji = typeof REACTION_EMOJIS[number]
export { REACTION_EMOJIS }

export async function getReactionsForPredictions(predictionIds: string[]): Promise<PredictionReaction[]> {
  if (predictionIds.length === 0) return []
  
  const { data } = await supabase
    .from('prediction_reactions')
    .select('*, profiles(username)')
    .in('prediction_id', predictionIds)
    .order('created_at', { ascending: true })

  return (data as PredictionReaction[]) ?? []
}

export async function toggleReaction(predictionId: string, userId: string, emoji: string) {
  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('prediction_reactions')
    .select('id')
    .eq('prediction_id', predictionId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    await supabase
      .from('prediction_reactions')
      .delete()
      .eq('id', existing.id)
    return { action: 'removed' as const }
  } else {
    // Add reaction
    const { error } = await supabase
      .from('prediction_reactions')
      .insert({ prediction_id: predictionId, user_id: userId, emoji })
    return { action: error ? ('error' as const) : ('added' as const) }
  }
}

// ─── Head-to-Head Challenges ───────────────────────────────

export type H2HStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

export interface H2HChallenge {
  id: string
  match_id: string
  challenger_id: string
  challenged_id: string
  points_wagered: number
  status: H2HStatus
  winner_id: string | null
  created_at: string
  // Joined data
  challenger?: { username: string; avatar_url: string | null }
  challenged?: { username: string; avatar_url: string | null }
  match?: { home_team: string; away_team: string; scheduled_at: string }
}

export async function createChallenge(
  matchId: string,
  challengerId: string,
  challengedId: string,
  pointsWagered: number
) {
  const { data, error } = await supabase
    .from('h2h_challenges')
    .insert({
      match_id: matchId,
      challenger_id: challengerId,
      challenged_id: challengedId,
      points_wagered: pointsWagered,
    })
    .select()
    .single()

  return { data, error }
}

export async function respondToChallenge(challengeId: string, accept: boolean) {
  const { error } = await supabase
    .from('h2h_challenges')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', challengeId)

  return { error }
}

export async function getMyChallenges(userId: string): Promise<H2HChallenge[]> {
  const { data } = await supabase
    .from('h2h_challenges')
    .select(`
      *,
      challenger:profiles!h2h_challenges_challenger_id_fkey(username, avatar_url),
      challenged:profiles!h2h_challenges_challenged_id_fkey(username, avatar_url),
      match:matches!h2h_challenges_match_id_fkey(home_team, away_team, scheduled_at)
    `)
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false })

  return (data as H2HChallenge[]) ?? []
}
