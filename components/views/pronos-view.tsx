'use client'

import { useEffect, useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/components/user-provider'
import { getUpcomingMatches } from '@/lib/api/matches'
import { getUserPredictions, submitPrediction } from '@/lib/predictions'
import { MatchHeroCard } from '@/components/match-hero-card'
import { LeagueSwitcher } from '@/components/league-switcher'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { TopRightProfile } from '@/components/top-right-profile'
import { playSwoosh } from '@/lib/sound'

export function PronosView() {
  const { user, profile, loading: authLoading } = useUser()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<string>('all')

  const { data: matches = [], mutate: mutateMatches, isLoading: matchesLoading } = useSWR('upcoming-matches', getUpcomingMatches)
  
  const { data: preds = [], mutate: mutatePreds, isLoading: predsLoading } = useSWR(
    user ? `user-predictions-${user.id}` : null,
    () => user ? getUserPredictions(user.id) : null
  )

  const predictions = useMemo(() => {
    const predMap: Record<string, { home: number; away: number; isBoosted: boolean }> = {}
    preds?.forEach((p: any) => {
      predMap[p.match_id] = {
        home: p.predicted_home_score,
        away: p.predicted_away_score,
        isBoosted: p.is_boosted,
      }
    })
    return predMap
  }, [preds])

  const loading = authLoading || matchesLoading || predsLoading

  useEffect(() => {
    if (authLoading || !user) return

    // Realtime subscription for matches
    const supabase = createClient()
    const channel = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate && payload.eventType === 'UPDATE') {
          navigator.vibrate([200, 100, 200])
        }
        mutateMatches()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, authLoading])

  async function handleSubmit(matchId: string, homeScore: number, awayScore: number, isBoosted: boolean = false) {
    if (!user) return
    
    // Play swoosh sound and haptic feedback instantly
    playSwoosh()
    setSubmitting(matchId)

    // Optimistic UI update
    mutatePreds((prevPreds: any = []) => {
      const newPreds = [...prevPreds]
      const existingIdx = newPreds.findIndex(p => p.match_id === matchId)
      const newPred = {
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        is_boosted: isBoosted
      }
      if (existingIdx >= 0) {
        newPreds[existingIdx] = { ...newPreds[existingIdx], ...newPred }
      } else {
        newPreds.push(newPred)
      }
      return newPreds
    }, { revalidate: false })

    // Background Submit without blocking UI
    submitPrediction(user.id, matchId, homeScore, awayScore, isBoosted).finally(() => {
      setSubmitting(null)
    }).catch(err => {
      console.error("Erreur lors de l'enregistrement de la prédiction", err)
    })
  }

  const leagues = Array.from(new Set(matches.map((m) => m.league_name)))
  const filteredMatches = selectedLeague === 'all'
    ? matches
    : matches.filter((m) => m.league_name === selectedLeague)

  if (!user && !authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 bg-transparent">
        <p className="text-center text-sm font-semibold text-zinc-400">
          Connecte-toi pour faire tes pronostics.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full pb-28 text-white selection:bg-blaze/20">
      <header 
        className="sticky top-0 z-50 flex flex-col items-start px-5 pt-14 pb-4 bg-black/80 backdrop-blur-md"
      >
        <div className="flex w-full items-start justify-between">
          <div>
            <LeagueSwitcher />
            <h1 className="mt-0.5 text-3xl font-black tracking-tighter text-white">
              Pronostics
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
              {matches.length} Match{matches.length !== 1 ? 's' : ''} à venir
            </p>
          </div>
          
          <TopRightProfile />
        </div>

        {leagues.length > 0 && (
          <div className="mt-6 flex w-full gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setSelectedLeague('all')}
              className={`shrink-0 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                selectedLeague === 'all'
                  ? 'bg-[#111317] text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)]'
                  : 'bg-white/10 text-zinc-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:bg-white/5'
              }`}
            >
              Tous
            </button>
            {leagues.map((league) => (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  selectedLeague === league
                    ? 'bg-[#111317] text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)]'
                    : 'bg-white/10 text-zinc-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:bg-white/5'
                }`}
              >
                {league}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-8 px-4 pt-4">
        {authLoading || loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-[40px] bg-white/10 shadow-sm p-12 text-center border border-white mt-8 mx-1">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <span className="text-2xl opacity-50">😴</span>
            </div>
            <p className="text-sm text-zinc-400 font-medium">
              Aucun match prévu pour le moment.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match, index) => (
              <motion.div 
                key={match.id} 
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 24, 
                  delay: index * 0.05 
                }}
              >
                <MatchHeroCard
                  matchId={match.id}
                  homeTeamName={match.home_team}
                  awayTeamName={match.away_team}
                  scheduledAt={match.scheduled_at}
                  leagueName={match.league_name}
                  homeOdds={match.home_odds}
                  awayOdds={match.away_odds}
                  matchStatus={match.status}
                  actualHomeScore={match.home_score}
                  actualAwayScore={match.away_score}
                  existingPrediction={predictions[match.id]}
                  onSubmit={handleSubmit}
                  isSubmitting={submitting === match.id}
                  hasActiveBoost={Object.values(predictions).some(p => p.isBoosted) && !predictions[match.id]?.isBoosted}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
