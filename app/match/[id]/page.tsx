'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Info } from 'lucide-react'
import { useUser } from '@/components/user-provider'
import { getMatch } from '@/lib/api/matches'
import { getLeaguePredictions } from '@/lib/predictions'
import { MatchHeroCard } from '@/components/match-hero-card'

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  const { user, leagueId, loading: authLoading } = useUser()

  const [match, setMatch] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    async function load() {
      const matchData = await getMatch(matchId)
      if (!matchData) {
        setLoading(false)
        return
      }
      setMatch(matchData)

      if (leagueId) {
        const preds = await getLeaguePredictions(leagueId, matchId)
        setPredictions(preds)
      }
      setLoading(false)
    }
    load()
  }, [matchId, leagueId, authLoading])

  // Live Scores Polling
  useEffect(() => {
    if (authLoading || !match) return
    
    // Only poll if the match is not explicitly finished in our DB
    if (match.status === 'finished') return

    async function fetchLiveScores() {
      try {
        const res = await fetch('/api/matches/live')
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json()
            if (data.matches && data.matches.length > 0) {
              const liveMatch = data.matches.find((m: any) => m.external_id === match.external_id || m.home_team === match.home_team)
              if (liveMatch) {
                setMatch((prev: any) => ({
                  ...prev,
                  status: 'live',
                  home_score: liveMatch.home_score,
                  away_score: liveMatch.away_score
                }))
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch live scores', e)
      }
    }

    fetchLiveScores()
    const interval = setInterval(fetchLiveScores, 60000)
    return () => clearInterval(interval)
  }, [match?.status, match?.external_id, match?.home_team, authLoading])

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col text-zinc-100 bg-[#0B0E14]">
        <header className="flex items-center gap-4 px-5 pt-14 pb-4">
          <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
          <div className="h-6 w-32 rounded-full bg-white/5 animate-pulse" />
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-500" />
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col text-zinc-100 p-5 items-center justify-center">
        <p className="text-zinc-500">Match introuvable.</p>
        <button onClick={() => router.back()} className="mt-4 text-orange-500 font-bold">Retour</button>
      </div>
    )
  }

  const isUpcoming = match.status === 'upcoming'
  const myPrediction = predictions.find(p => p.userId === user?.id)

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col text-zinc-100 pb-28">
      {/* ─── HEADER ─── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 flex items-center gap-4 px-5 pt-14 pb-4 backdrop-blur-xl bg-[#0B0E14]/80"
      >
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-black tracking-tight text-white line-clamp-1">
          Détail du match
        </h1>
      </motion.header>

      <main className="flex flex-col gap-6 px-5 mt-2">
        {/* HERO CARD */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
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
            existingPrediction={myPrediction ? { home: myPrediction.homeScore, away: myPrediction.awayScore } : null}
          />
        </motion.div>

        {/* PREDICTIONS DE LA LIGUE */}
        {leagueId ? (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Pronos de la ligue
              </h2>
              <span className="text-xs font-bold text-zinc-500">{predictions.length} prono{predictions.length > 1 ? 's' : ''}</span>
            </div>

            {predictions.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center">
                <p className="text-sm text-zinc-500">Aucun pronostic pour ce match pour le moment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {predictions.map((p, i) => {
                  const isMe = p.userId === user?.id
                  const hidden = isUpcoming && !isMe

                  return (
                    <motion.div
                      key={p.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-all ${
                        isMe 
                          ? 'bg-orange-500/10 border-orange-500/30' 
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="size-10 rounded-full object-cover" alt="" />
                        ) : (
                          <div className={`flex size-10 items-center justify-center rounded-full text-sm font-bold text-white ${isMe ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                            {p.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className={`text-sm font-bold ${isMe ? 'text-orange-400' : 'text-zinc-200'}`}>
                            {p.username} {isMe && '(Toi)'}
                          </p>
                          {!isUpcoming && p.points !== null && (
                            <p className="text-xs font-semibold text-green-400">+{p.points} pts</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-center">
                        {hidden ? (
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 blur-sm select-none">
                            100 - 100
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black tabular-nums text-white">
                              {p.homeScore}
                            </span>
                            <span className="text-zinc-500">-</span>
                            <span className="text-lg font-black tabular-nums text-white">
                              {p.awayScore}
                            </span>
                          </div>
                        )}
                        {hidden && (
                          <p className="text-[9px] font-semibold uppercase text-zinc-600 mt-1">
                            Caché
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.section>
        ) : (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 text-center mt-4">
            <Info className="size-5 text-orange-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-400">
              Rejoins une ligue pour voir les pronostics de tes amis.
            </p>
            <Link
              href="/ligue"
              className="mt-3 inline-block rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-md active:scale-95"
            >
              Ma Ligue
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
