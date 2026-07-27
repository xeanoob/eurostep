'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getUpcomingMatches } from '@/lib/api/matches'
import { getUserPredictions, submitPrediction } from '@/lib/predictions'
import { MatchHeroCard } from '@/components/match-hero-card'
import { LeagueSwitcher } from '@/components/league-switcher'
import { createClient } from '@/lib/supabase/client'

interface Match {
  id: string
  home_team: string
  away_team: string
  league_name: string
  scheduled_at: string
  home_score: number | null
  away_score: number | null
  home_odds: number | null
  away_odds: number | null
  status: string
}

export default function PronosPage() {
  const { user, profile, loading: authLoading } = useUser()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number }>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [selectedLeague, setSelectedLeague] = useState<string>('all')

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setLoading(false)
      return
    }

    async function load() {
      const [up, preds] = await Promise.all([
        getUpcomingMatches(),
        getUserPredictions(user!.id),
      ])

      setMatches(up)

      const predMap: Record<string, { home: number; away: number }> = {}
      preds.forEach((p: any) => {
        predMap[p.match_id] = {
          home: p.predicted_home_score,
          away: p.predicted_away_score,
        }
      })
      setPredictions(predMap)

      setLoading(false)
    }

    load()

    // Realtime subscription for matches
    const supabase = createClient()
    const channel = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        getUpcomingMatches().then(setMatches)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, authLoading])

  async function handleSubmit(matchId: string, homeScore: number, awayScore: number) {
    if (!user) return
    setSubmitting(matchId)

    await submitPrediction(user.id, matchId, homeScore, awayScore)

    setPredictions((prev) => ({
      ...prev,
      [matchId]: { home: homeScore, away: awayScore },
    }))

    setSubmitting(null)
  }

  const leagues = Array.from(new Set(matches.map((m) => m.league_name)))
  const filteredMatches = selectedLeague === 'all'
    ? matches
    : matches.filter((m) => m.league_name === selectedLeague)

  if (!user) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md items-center justify-center bg-gray-50 px-6">
        <p className="text-center text-sm text-gray-500">
          Connecte-toi pour faire tes pronostics.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-gray-50 text-gray-900">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 flex flex-col items-start px-6 pt-14 pb-4"
      >
        <div className="flex w-full items-start justify-between">
          <div>
            <LeagueSwitcher />
            <p className="mt-2 text-xs font-semibold text-gray-500">
              {matches.length} Match{matches.length !== 1 ? 's' : ''} à venir
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Pronos<span className="text-blue-600">tics</span>
            </h1>
          </div>
          
          <Link href="/profil" className="shrink-0 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-105 active:scale-95">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profil" className="size-12 rounded-full object-cover" />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {(profile?.username || 'J')[0]?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>

        {leagues.length > 0 && (
          <div className="mt-6 flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedLeague('all')}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                selectedLeague === 'all'
                  ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Tous
            </button>
            {leagues.map((league) => (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                  selectedLeague === league
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {league}
              </button>
            ))}
          </div>
        )}
      </motion.header>

      <main className="flex flex-1 flex-col gap-8 pb-32">
        {authLoading || loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-gray-400 animate-pulse">Chargement...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="px-6 py-12 text-center border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Aucun match prévu pour le moment.
            </p>
          </div>
        ) : (
          filteredMatches.map((match, index) => (
             <motion.div 
               key={match.id} 
               className="px-4"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: index * 0.1 }}
             >
              <MatchHeroCard
                matchId={match.id}
                homeTeamName={match.home_team}
                awayTeamName={match.away_team}
                scheduledAt={match.scheduled_at}
                leagueName={match.league_name}
                homeOdds={match.home_odds}
                awayOdds={match.away_odds}
                existingPrediction={predictions[match.id]}
                onSubmit={handleSubmit}
                isSubmitting={submitting === match.id}
              />
            </motion.div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
