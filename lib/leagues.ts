import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function createLeague(name: string, userId: string) {
  const { data: league, error } = await supabase
    .from('leagues')
    .insert({ name, created_by: userId })
    .select()
    .single()

  if (error || !league) return { league: null, error }

  // Auto-join the creator
  await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: userId })

  return { league, error: null }
}

export async function joinLeague(code: string, userId: string) {
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name')
    .eq('code', code.toUpperCase())
    .single()

  if (!league) return { league: null, error: 'Code invalide' }

  const { error } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: userId })

  if (error?.code === '23505') return { league, error: 'Tu fais déjà partie de cette ligue' }
  if (error) return { league: null, error: error.message }

  return { league, error: null }
}

export async function getUserLeagues(userId: string) {
  const { data } = await supabase
    .from('league_members')
    .select('league_id, leagues(id, name, code, created_by)')
    .eq('user_id', userId)

  return data?.map((d) => d.leagues).filter(Boolean) ?? []
}

export async function getLeagueMembers(leagueId: string) {
  const { data } = await supabase
    .from('league_members')
    .select('user_id, profiles(id, username)')
    .eq('league_id', leagueId)

  return data ?? []
}

export async function leaveLeague(leagueId: string, userId: string) {
  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId)

  return { error }
}
