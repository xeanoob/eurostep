'use client'

import { useEffect, useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useUser } from '@/components/user-provider'
import { getUpcomingMatches, getFinishedMatches } from '@/lib/api/matches'
import { getUserStats, getLeaderboard } from '@/lib/leaderboard'
import { findTeam } from '@/lib/teams'
import { ArrowRight, Trophy, ChevronRight, Flame } from 'lucide-react'
import { LeagueSwitcher } from '@/components/league-switcher'
import { TopRightProfile } from '@/components/top-right-profile'

const LEAGUE_FILTERS = ['Tous', 'WNBA', 'NBA', 'EuroLeague', 'Betclic Élite'] as const

export function HomeView() {
  const { user, profile, leagueId, loading: authLoading } = useUser()
  const [activeFilter, setActiveFilter] = useState<string>('Tous')

  const { data: upcoming = [], mutate: mutateUpcoming, isLoading: upcomingLoading } = useSWR('upcoming-matches', getUpcomingMatches)
  const { data: finished = [], isLoading: finishedLoading } = useSWR('finished-matches', () => getFinishedMatches(5))
  
  const { data: stats = { totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 }, isLoading: statsLoading } = useSWR(
    user ? `user-stats-${user.id}` : null,
    () => user ? getUserStats(user.id) : null
  )

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useSWR(
    leagueId ? `leaderboard-${leagueId}` : null,
    async () => {
      if (!leagueId) return []
      return getLeaderboard(leagueId)
    }
  )

  const loading = authLoading || upcomingLoading || finishedLoading

  // Live Scores Polling
  useEffect(() => {
    if (authLoading || !user) return

    async function fetchLiveScores() {
      try {
        const res = await fetch('/api/matches/live')
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json()
          if (data.matches && data.matches.length > 0) {
            mutateUpcoming((prevUpcoming) => {
              if (!prevUpcoming) return []
              const newUpcoming = [...prevUpcoming]
              data.matches.forEach((liveMatch: any) => {
                const idx = newUpcoming.findIndex(m => m.external_id === liveMatch.external_id || m.home_team === liveMatch.home_team)
                if (idx !== -1) {
                  newUpcoming[idx] = {
                    ...newUpcoming[idx],
                    status: 'live',
                    home_score: liveMatch.home_score,
                    away_score: liveMatch.away_score
                  }
                }
              })
              return newUpcoming
            }, { revalidate: false })
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
  }, [user, authLoading])

  const filteredUpcoming = useMemo(() => {
    if (activeFilter === 'Tous') return upcoming
    return upcoming.filter(m => {
      const ln = m.league_name?.toLowerCase() || ''
      const filter = activeFilter.toLowerCase()
      return ln.includes(filter) || filter.includes(ln)
    })
  }, [upcoming, activeFilter])

  const filteredFinished = useMemo(() => {
    if (activeFilter === 'Tous') return finished
    return finished.filter(m => {
      const ln = m.league_name?.toLowerCase() || ''
      const filter = activeFilter.toLowerCase()
      return ln.includes(filter) || filter.includes(ln)
    })
  }, [finished, activeFilter])

  const userRank = leaderboard.find((e) => e.userId === user?.id)?.rank ?? '—'

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffH = diffMs / (1000 * 60 * 60)

    if (diffH < 0) return 'Terminé'
    if (diffH < 24) {
      return `Aujourd'hui · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffH < 48) {
      return `Demain · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) + ` · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <header className="flex items-center justify-between px-5 pt-14 pb-4">
          <div>
            <div className="h-3 w-16 rounded-full bg-black/5 animate-pulse mb-2" />
            <h1 className="text-3xl font-black tracking-tighter text-white">
              Euro<span className="text-blaze">Step</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-20 rounded-full bg-black/5 animate-pulse" />
            <div className="size-10 rounded-full bg-black/5 animate-pulse" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 px-5 pb-24">
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-9 w-20 rounded-full bg-black/5 animate-pulse" />)}
          </div>
          <div className="h-[360px] w-full rounded-[40px] bg-white/10 shadow-sm border border-white/10 animate-pulse" />
          <div className="h-5 w-20 rounded bg-black/5 animate-pulse mt-4" />
          <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="h-[220px] w-[180px] shrink-0 rounded-[40px] bg-white/10 shadow-sm border border-white/10 animate-pulse" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full pb-28 text-white selection:bg-blaze/20">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 pt-14 pb-4 bg-transparent">
        <div>
          <LeagueSwitcher />
          <h1 className="mt-0.5 text-3xl font-black tracking-tighter text-white">
            Euro<span className="text-blaze">Step</span>
          </h1>
        </div>

        <TopRightProfile />
      </header>

      <main className="flex flex-1 flex-col gap-8 px-5">
        {/* ─── FILTER TABS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
        >
          {LEAGUE_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                activeFilter === filter
                  ? 'bg-[#111317] text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)]'
                  : 'bg-white/10 text-zinc-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:bg-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* ─── NO LEAGUE CTA ─── */}
        {!leagueId && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[40px] bg-gradient-to-br from-blaze/10 to-ruby/5 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-blaze">Tu n'es dans aucune ligue</p>
            <Link
              href="/ligue"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#111317] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-transform active:scale-95 hover:bg-black"
            >
              Créer ou rejoindre
            </Link>
          </motion.section>
        )}

        {/* ─── HERO MATCH CARD (Fluid Premium Cinematic) ─── */}
        {filteredUpcoming.length > 0 && (() => {
          const m = filteredUpcoming[0]
          const home = findTeam(m.home_team)
          const away = findTeam(m.away_team)
          return (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative overflow-hidden rounded-2xl shadow-sm bg-white/10 border border-white/10"
            >
              {/* Clean solid header inside card */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-blaze" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">
                    {m.league_name}
                  </span>
                </div>
                {m.status === 'live' ? (
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-ruby animate-pulse">
                    <span className="size-1.5 rounded-full bg-ruby" />
                    LIVE
                  </span>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    {formatDate(m.scheduled_at)}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col p-6">
                {/* Center: Teams face-off */}
                <div className="flex items-center justify-between mt-2">
                  {/* Home */}
                  <div className="flex flex-col items-center w-[40%]">
                    <div className="relative size-20 flex items-center justify-center">
                      {home.logoUrl ? (
                        <img src={home.logoUrl} className="size-20 object-contain relative z-10" alt={home.shortName} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <div className="flex size-20 items-center justify-center rounded-xl text-3xl font-black text-white relative z-10" style={{ backgroundColor: home.colors.primary }}>
                          {home.shortName[0]}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-helvetica italic font-black uppercase tracking-tight text-white text-center leading-tight">
                      {home.shortName}
                    </h3>
                  </div>

                  {/* VS / Score */}
                  <div className="flex flex-col items-center">
                    {m.status === 'live' ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-black font-display tracking-tighter text-white">{m.home_score}</span>
                          <span className="text-xl font-black text-zinc-300">-</span>
                          <span className="text-4xl font-black font-display tracking-tighter text-white">{m.away_score}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-2xl font-black italic text-zinc-200 font-display opacity-80">VS</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center w-[40%]">
                    <div className="relative size-20 flex items-center justify-center">
                      {away.logoUrl ? (
                        <img src={away.logoUrl} className="size-20 object-contain relative z-10" alt={away.shortName} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <div className="flex size-20 items-center justify-center rounded-xl text-3xl font-black text-white relative z-10" style={{ backgroundColor: away.colors.primary }}>
                          {away.shortName[0]}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-helvetica italic font-black uppercase tracking-tight text-white text-center leading-tight">
                      {away.shortName}
                    </h3>
                  </div>
                </div>

                {/* Bottom CTA */}
                <Link
                  href={`/match/${m.id}`}
                  className="mt-8 flex items-center justify-center gap-3 rounded-full bg-[#111317] py-4 transition-all active:scale-95 hover:bg-black group"
                >
                  <span className="text-sm font-bold uppercase tracking-widest text-white transition-colors">
                    Faire mon Pronostic
                  </span>
                  <ArrowRight className="size-4 text-white/50 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </motion.section>
          )
        })()}

        {/* ─── UPCOMING MATCHES (Cinematic Cards) ─── */}
        {filteredUpcoming.length > 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-5 px-1">
              <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">À venir</p>
              <Link href="/?tab=pronos" className="text-[11px] font-bold uppercase tracking-widest text-blaze flex items-center gap-1 hover:text-ruby transition-colors">
                Tout voir <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-hide -mx-1 px-1">
              {filteredUpcoming.slice(1, 6).map((m) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                return (
                  <Link
                    key={m.id}
                    href={`/match/${m.id}`}
                    className="group relative flex-none w-[160px] h-[200px] snap-start rounded-2xl overflow-hidden bg-white/10 shadow-sm border border-white/10 transition-transform active:scale-95"
                  >
                    {/* Content */}
                    <div className="relative flex flex-col justify-between h-full p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                          {m.league_name}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-4 my-2">
                        {home.logoUrl ? (
                          <img src={home.logoUrl} className="size-10 object-contain relative z-10" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-10 rounded-full flex items-center justify-center text-xs font-bold text-white relative z-10" style={{ backgroundColor: home.colors.primary }}>{home.shortName[0]}</div>
                        )}
                        {away.logoUrl ? (
                          <img src={away.logoUrl} className="size-10 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: away.colors.primary }}>{away.shortName[0]}</div>
                        )}
                      </div>

                      <div className="text-center mt-2">
                        <p className="text-xs font-black text-white leading-tight mb-2">
                          {home.shortName} <span className="text-zinc-400 font-normal">vs</span> {away.shortName}
                        </p>
                        <div className="inline-block text-[10px] font-bold uppercase tracking-widest text-blaze bg-white/10 border border-white/10 rounded-full px-3 py-1 shadow-sm">
                          {formatTime(m.scheduled_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ─── RECENT RESULTS ─── */}
        {filteredFinished.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mb-5 px-1">
              Derniers résultats
            </p>
            <div className="rounded-2xl bg-white/10 shadow-sm border border-white/10 overflow-hidden p-0">
              {filteredFinished.map((m, i) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0)
                const awayWon = (m.away_score ?? 0) > (m.home_score ?? 0)

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between py-4 px-5 transition-colors hover:bg-white/5 border-b border-white/10 last:border-0`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-1">
                        {home.logoUrl ? (
                          <img src={home.logoUrl} className="size-8 object-contain relative z-10" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-8 rounded-full relative z-10 border border-white" style={{ backgroundColor: home.colors.primary }} />
                        )}
                        {away.logoUrl ? (
                          <img src={away.logoUrl} className="size-8 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-8 rounded-full border border-white" style={{ backgroundColor: away.colors.primary }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {home.shortName} <span className="text-zinc-300 font-normal text-[11px] mx-1">vs</span> {away.shortName}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{m.league_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-display text-2xl tabular-nums tracking-tighter">
                      <span className={homeWon ? 'font-black text-white' : 'font-bold text-zinc-300'}>{m.home_score}</span>
                      <span className="text-zinc-200 text-sm">–</span>
                      <span className={awayWon ? 'font-black text-white' : 'font-bold text-zinc-300'}>{m.away_score}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ─── LEADERBOARD PEEK ─── */}
        {leaderboard.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <div className="flex items-center justify-between mb-5 px-1">
              <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">
                <Trophy className="inline size-3.5 mr-1 text-sandy" />
                Top 3 de ta ligue
              </p>
              <Link href="/?tab=classement" className="text-[11px] font-bold uppercase tracking-widest text-blaze flex items-center gap-1 hover:text-ruby transition-colors">
                Classement <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="rounded-2xl bg-white/10 shadow-sm border border-white/10 overflow-hidden p-0">
              {leaderboard.slice(0, 3).map((entry, index) => {
                const isUser = entry.userId === user?.id
                const isFirst = index === 0
                return (
                  <Link
                    href={`/profil/${entry.userId}`}
                    key={entry.userId}
                    className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/5 border-b border-white/10 last:border-0 ${isUser ? 'bg-white/5/50' : ''}`}
                  >
                    <div className="w-6 text-center flex justify-center">
                      <span className={`text-xl font-black font-display tabular-nums tracking-tighter ${isFirst ? 'text-sandy' : 'text-zinc-300'}`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className={`flex size-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
                      isUser ? 'bg-[#111317]' : isFirst ? 'bg-sandy' : 'bg-zinc-200 text-zinc-400'
                    }`}>
                      {entry.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 flex flex-col justify-center ml-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{entry.username}</p>
                        {isUser && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">Toi</span>}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-black tabular-nums text-white font-display">{entry.totalPoints}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">pts</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ─── EMPTY STATE ─── */}
        {upcoming.length === 0 && finished.length === 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[40px] bg-white/10 shadow-sm p-12 text-center border border-white"
          >
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <span className="text-2xl opacity-50">😴</span>
            </div>
            <p className="text-sm text-zinc-400 font-medium">
              Aucun match pour le moment.
            </p>
            <Link
              href="/?tab=pronos"
              className="group mt-6 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#111317] px-6 py-3 rounded-full shadow-lg transition-transform active:scale-95 hover:bg-black"
            >
              Chercher des matchs
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.section>
        )}
      </main>
    </div>
  )
}
