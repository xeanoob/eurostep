import { createClient } from '@/lib/supabase/client'
import { generateOdds } from '@/lib/utils'

const supabase = createClient()

/**
 * Scoring (avec cotes):
 * - Score exact     = 10 pts * cote
 * - Bon écart (±2)  = 5 pts * cote
 * - Bon vainqueur   = 2 pts * cote
 * - Mauvais         = 0 pt
 */
export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  homeOdds: number,
  awayOdds: number
): number {
  let basePoints = 0

  // Score exact
  if (predictedHome === actualHome && predictedAway === actualAway) {
    basePoints = 10
  } else {
    const predictedDiff = predictedHome - predictedAway
    const actualDiff = actualHome - actualAway

    // Bon écart (±2)
    if (Math.abs(predictedDiff - actualDiff) <= 2) {
      if (
        (predictedDiff > 0 && actualDiff > 0) ||
        (predictedDiff < 0 && actualDiff < 0) ||
        (predictedDiff === 0 && actualDiff === 0)
      ) {
        basePoints = 5
      }
    } 
    // Bon vainqueur
    else if (
      (predictedDiff > 0 && actualDiff > 0) ||
      (predictedDiff < 0 && actualDiff < 0)
    ) {
      basePoints = 2
    }
  }

  if (basePoints === 0) return 0

  const predictedDiff = predictedHome - predictedAway
  const oddsMultiplier = predictedDiff > 0 ? homeOdds : predictedDiff < 0 ? awayOdds : 1

  return Math.round(basePoints * oddsMultiplier)
}

export async function submitPrediction(
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
  isBoosted: boolean = false
) {
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        is_boosted: isBoosted,
      },
      { onConflict: 'user_id,match_id' }
    )
    .select()

  return { data, error }
}

export async function getLeaguePredictions(leagueId: string, matchId: string) {
  // Get all users in the league
  const { data: members, error: memberError } = await supabase
    .from('league_members')
    .select('user_id, profiles(username, avatar_url)')
    .eq('league_id', leagueId)

  if (memberError || !members) return []

  const userIds = members.map((m) => m.user_id)

  // Get their predictions for this match
  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('*')
    .in('user_id', userIds)
    .eq('match_id', matchId)

  if (predError || !predictions) return []

  return predictions.map((p) => {
    const member = members.find((m) => m.user_id === p.user_id)
    return {
      userId: p.user_id,
      username: (member?.profiles as any)?.username ?? 'Joueur',
      avatar_url: (member?.profiles as any)?.avatar_url,
      homeScore: p.predicted_home_score,
      awayScore: p.predicted_away_score,
      points: p.points_earned,
    }
  }).sort((a, b) => (b.points || 0) - (a.points || 0))
}

export async function calculateMatchPoints(matchId: string, actualHomeScore: number, actualAwayScore: number, externalSupabase?: any) {
  const db = externalSupabase || supabase

  const { data: predictions, error } = await db
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)

  if (error || !predictions) return

  const actualDiff = actualHomeScore - actualAwayScore
  const actualWinner = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'draw'

  await Promise.all(predictions.map(async (pred: any) => {
    const predDiff = pred.predicted_home_score - pred.predicted_away_score
    const predWinner = predDiff > 0 ? 'home' : predDiff < 0 ? 'away' : 'draw'
    
    let points = 0

    if (predWinner === actualWinner) points += 3 // Bon vainqueur
    
    if (predDiff === actualDiff) points += 2 // Écart parfait
    
    if (pred.predicted_home_score === actualHomeScore) points += 2 // Score exact équipe Domicile
    if (pred.predicted_away_score === actualAwayScore) points += 2 // Score exact équipe Extérieur
    
    // Perfect: Bon vainqueur (3) + Ecart (2) + 2 Scores Exacts (4) = 9
    // On rajoute +1 bonus pour faire 10 pts si tout est parfait
    if (pred.predicted_home_score === actualHomeScore && pred.predicted_away_score === actualAwayScore) {
      points += 1
    }

    await db
      .from('predictions')
      .update({ points_earned: points })
      .eq('id', pred.id)

    // Streak logic
    const { data: profile } = await db
      .from('profiles')
      .select('current_streak, longest_streak')
      .eq('id', pred.user_id)
      .single()
      
    if (profile) {
      const newStreak = points > 0 ? (profile.current_streak || 0) + 1 : 0;
      const newLongest = Math.max(profile.longest_streak || 0, newStreak);
      
      if (newStreak !== profile.current_streak || newLongest !== profile.longest_streak) {
        await db
          .from('profiles')
          .update({ current_streak: newStreak, longest_streak: newLongest })
          .eq('id', pred.user_id)
      }
    }
  }))
}

export async function getUserPrediction(userId: string, matchId: string) {
  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle()

  return data
}

export async function getUserPredictions(userId: string) {
  const { data } = await supabase
    .from('predictions')
    .select('*, matches(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function scorePredictionsForMatch(matchId: string) {
  // Get the match result and odds
  const { data: match } = await supabase
    .from('matches')
    .select('home_team, away_team, home_score, away_score, home_odds, away_odds')
    .eq('id', matchId)
    .single()

  if (!match || match.home_score == null || match.away_score == null) return

  // Get all predictions for this match
  const { data: predictions } = await supabase
    .from('predictions')
    .select('id, user_id, predicted_home_score, predicted_away_score, is_boosted')
    .eq('match_id', matchId)

  if (!predictions) return

  // Fallback to generated odds if not stored
  const fallbackOdds = generateOdds(match.home_team, match.away_team)
  const homeOdds = match.home_odds ?? fallbackOdds.home
  const awayOdds = match.away_odds ?? fallbackOdds.away

  // Calculate and update points for each prediction
  await Promise.all(predictions.map(async (pred) => {
    let points = calculatePoints(
      pred.predicted_home_score,
      pred.predicted_away_score,
      match.home_score,
      match.away_score,
      homeOdds,
      awayOdds
    )
    
    if (pred.is_boosted) {
      points *= 2
    }
    
    await supabase
      .from('predictions')
      .update({ points_earned: points })
      .eq('id', pred.id)
      
    // Streak logic
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak')
      .eq('id', pred.user_id)
      .single()
      
    if (profile) {
      const newStreak = points > 0 ? (profile.current_streak || 0) + 1 : 0;
      const newLongest = Math.max(profile.longest_streak || 0, newStreak);
      
      if (newStreak !== profile.current_streak || newLongest !== profile.longest_streak) {
        await supabase
          .from('profiles')
          .update({ current_streak: newStreak, longest_streak: newLongest })
          .eq('id', pred.user_id)
      }
    }
  }))

  // Resolve H2H Challenges for this match
  const { data: challenges } = await supabase
    .from('h2h_challenges')
    .select('*')
    .eq('match_id', matchId)
    .eq('status', 'accepted')

  if (challenges && challenges.length > 0) {
    // Re-fetch all updated predictions to know exactly how many points each user got
    const { data: updatedPredictions } = await supabase
      .from('predictions')
      .select('user_id, points_earned')
      .eq('match_id', matchId)

    const userPointsMap = new Map<string, number>()
    updatedPredictions?.forEach(p => {
      userPointsMap.set(p.user_id, p.points_earned || 0)
    })

    await Promise.all(challenges.map(async (challenge) => {
      const challengerPoints = userPointsMap.get(challenge.challenger_id) || 0
      const challengedPoints = userPointsMap.get(challenge.challenged_id) || 0

      let winnerId = null
      if (challengerPoints > challengedPoints) {
        winnerId = challenge.challenger_id
      } else if (challengedPoints > challengerPoints) {
        winnerId = challenge.challenged_id
      }

      await supabase
        .from('h2h_challenges')
        .update({
          status: 'completed',
          winner_id: winnerId
        })
        .eq('id', challenge.id)
    }))
  }
}
