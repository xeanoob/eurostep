import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const BALLDONTLIE_BASE = 'https://api.balldontlie.io/v1'

interface BDLGame {
  id: number
  date: string
  home_team: { full_name: string; abbreviation: string }
  visitor_team: { full_name: string; abbreviation: string }
  home_team_score: number
  visitor_team_score: number
  status: string
}

export async function fetchUpcomingGames(date?: string): Promise<BDLGame[]> {
  const d = date ?? new Date().toISOString().split('T')[0]
  try {
    const res = await fetch(`${BALLDONTLIE_BASE}/games?dates[]=${d}`, {
      headers: { Authorization: process.env.BALLDONTLIE_API_KEY ?? '' },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

export async function fetchGamesByDateRange(startDate: string, endDate: string): Promise<BDLGame[]> {
  try {
    const res = await fetch(
      `${BALLDONTLIE_BASE}/games?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: process.env.BALLDONTLIE_API_KEY ?? '' } },
    )
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

export async function syncMatchesToSupabase(games: BDLGame[]) {
  for (const game of games) {
    const isFinished = game.status === 'Final'
    const matchData = {
      external_id: `bdl_${game.id}`,
      home_team: game.home_team.full_name,
      away_team: game.visitor_team.full_name,
      league_name: 'NBA',
      scheduled_at: new Date(game.date).toISOString(),
      home_score: isFinished ? game.home_team_score : null,
      away_score: isFinished ? game.visitor_team_score : null,
      status: isFinished ? 'finished' as const : 'upcoming' as const,
    }

    await supabase
      .from('matches')
      .upsert(matchData, { onConflict: 'external_id' })
  }
}

export async function getUpcomingMatches() {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'upcoming')
    .order('scheduled_at', { ascending: true })
    .limit(10)

  return data ?? []
}

export async function getFinishedMatches(limit = 10) {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished')
    .order('scheduled_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getMatch(matchId: string) {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  return data
}
