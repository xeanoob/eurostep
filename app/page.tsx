'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getUpcomingMatches, getFinishedMatches } from '@/lib/api/matches'
import { getUserStats, getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { findTeam } from '@/lib/teams'
import { ArrowRight, Trophy, ChevronRight, Flame } from 'lucide-react'
import { LeagueSwitcher } from '@/components/league-switcher'
import { AnimatedCounter } from '@/components/animated-counter'

interface Match {
  id: string
  home_team: string
  away_team: string
  league_name: string
  scheduled_at: string
  home_score: number | null
  away_score: number | null
  status: string
}

const LEAGUE_FILTERS = ['Tous', 'WNBA', 'NBA', 'EuroLeague', 'Betclic Élite'] as const

export default function AccueilPage() {
  const { user, profile, leagueId, loading: authLoading } = useUser()
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [finished, setFinished] = useState<Match[]>([])
  const [stats, setStats] = useState({ totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('Tous')

  useEffect(() => {
    if (authLoading || !user) return

    async function load() {
      const [up, fin, userStats] = await Promise.all([
        getUpcomingMatches(),
        getFinishedMatches(5),
        getUserStats(user!.id),
      ])
      setUpcoming(up)
      setFinished(fin)
      setStats(userStats)

      if (leagueId) {
        const lb = await getLeaderboard(leagueId)
        setLeaderboard(lb.slice(0, 3))
      }

      setLoading(false)
    }

    load()
  }, [user, authLoading, leagueId])

  // Live Scores Polling
  useEffect(() => {
    if (authLoading || !user) return

    async function fetchLiveScores() {
      try {
        const res = await fetch('/api/matches/live')
        if (res.ok) {
          const data = await res.json()
          if (data.matches && data.matches.length > 0) {
            setUpcoming(prevUpcoming => {
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
            })
          }
        }
      } catch (e) {
        console.error('Failed to fetch live scores', e)
      }
    }

    // Fetch immediately on mount, then every 60 seconds
    fetchLiveScores()
    const interval = setInterval(fetchLiveScores, 60000)
    return () => clearInterval(interval)
  }, [user, authLoading])
  // Filter matches by league
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

  // ─── LOADING SKELETON ───
  if (authLoading || loading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col pb-24">
        <header className="flex items-center justify-between px-5 pt-14 pb-4">
          <div>
            <div className="h-3 w-16 rounded-full bg-white/5 animate-pulse mb-2" />
            <h1 className="text-3xl font-black tracking-tighter text-white">
              Euro<span className="text-orange-500">Step</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-20 rounded-full bg-white/5 animate-pulse" />
            <div className="size-10 rounded-full bg-white/5 animate-pulse" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-5 px-5">
          {/* Filter pills skeleton */}
          <div className="flex gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-9 w-20 rounded-full bg-white/5 animate-pulse" />
            ))}
          </div>
          {/* Hero card skeleton */}
          <div className="h-[340px] w-full rounded-2xl bg-[#161B26] border border-white/5 animate-pulse" />
          {/* Upcoming skeleton */}
          <div className="h-5 w-20 rounded bg-white/5 animate-pulse" />
          <div className="flex gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-[200px] w-[160px] shrink-0 rounded-2xl bg-[#161B26] border border-white/5 animate-pulse" />
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col pb-28 text-zinc-100">

      {/* ─── HEADER ─── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 flex items-center justify-between px-5 pt-14 pb-3 backdrop-blur-xl bg-[#0B0E14]/80"
      >
        <div>
          <LeagueSwitcher />
          <h1 className="mt-0.5 text-3xl font-black tracking-tighter text-white">
            Euro<span className="text-orange-500">Step</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-2">
            <span className="text-sm font-black tabular-nums text-orange-500">
              #{typeof userRank === 'number' ? userRank : '—'}
            </span>
            <div className="h-3.5 w-px bg-white/10" />
            <span className="text-sm font-bold tabular-nums text-white">
              <AnimatedCounter value={stats.totalPoints} className="text-sm font-bold tabular-nums" />
            </span>
            <span className="text-[9px] text-zinc-500 font-semibold">pts</span>
          </div>

          {/* Avatar */}
          <Link href="/profil" className="shrink-0 transition-transform active:scale-95">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profil" className="size-10 rounded-full object-cover ring-2 ring-orange-500/30 shadow-lg" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-b from-orange-500 to-orange-600 text-sm font-bold text-white ring-2 ring-orange-500/30 shadow-lg">
                {(profile?.username || 'J')[0]?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </motion.header>

      <main className="flex flex-1 flex-col gap-6 px-5">

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
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                activeFilter === filter
                  ? 'bg-white text-black shadow-lg'
                  : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
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
            className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 text-center"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400">Tu n'es dans aucune ligue</p>
            <Link
              href="/ligue"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 border border-orange-700 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-[inset_0px_1px_0px_rgba(255,255,255,0.2)] transition-transform active:scale-95"
            >
              Créer ou rejoindre
            </Link>
          </motion.section>
        )}

        {/* ─── HERO MATCH CARD (Full-Bleed Betclic Style) ─── */}
        {filteredUpcoming.length > 0 && (() => {
          const m = filteredUpcoming[0]
          const home = findTeam(m.home_team)
          const away = findTeam(m.away_team)
          return (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative h-[340px] overflow-hidden rounded-2xl shadow-2xl"
            >
              {/* Background: team colors gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${home.colors.primary}40 0%, ${away.colors.primary}40 100%)`,
                }}
              />

              {/* Faded team logos as background texture */}
              {home.logoUrl && (
                <img
                  src={home.logoUrl}
                  alt=""
                  className="absolute -left-6 top-4 h-44 opacity-[0.12] blur-[1px] select-none pointer-events-none"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
              {away.logoUrl && (
                <img
                  src={away.logoUrl}
                  alt=""
                  className="absolute -right-6 top-4 h-44 opacity-[0.12] blur-[1px] select-none pointer-events-none"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}

              {/* Heavy gradient overlay from bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/90 to-transparent" />

              {/* Content */}
              <div className="relative flex flex-col justify-between h-full p-5">
                {/* Top: league & time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 border border-white/10">
                      <Flame className="size-3 text-orange-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                        {m.league_name}
                      </span>
                    </div>
                  </div>
                  {m.status === 'live' ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse border border-red-500/20">
                      <span className="size-1.5 rounded-full bg-red-500" />
                      EN DIRECT
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                      {formatDate(m.scheduled_at)}
                    </span>
                  )}
                </div>

                {/* Center: Teams face-off */}
                <div className="flex items-center justify-between px-2">
                  {/* Home */}
                  <div className="flex flex-col items-center w-2/5">
                    <div className="relative size-20 flex items-center justify-center">
                      {home.logoUrl ? (
                        <img src={home.logoUrl} className="size-16 object-contain drop-shadow-2xl" alt={home.shortName} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <div
                          className="flex size-16 items-center justify-center rounded-full text-2xl font-black text-white shadow-xl"
                          style={{ backgroundColor: home.colors.primary }}
                        >
                          {home.shortName[0]}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-black italic uppercase tracking-tight text-white text-center leading-tight">
                      {home.shortName}
                    </h3>
                  </div>

                  {/* VS / Score */}
                  <div className="flex flex-col items-center">
                    {m.status === 'live' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-black text-white">{m.home_score}</span>
                        <span className="text-xl font-black text-white/30">-</span>
                        <span className="text-4xl font-black text-white">{m.away_score}</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-black italic text-white/20">VS</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center w-2/5">
                    <div className="relative size-20 flex items-center justify-center">
                      {away.logoUrl ? (
                        <img src={away.logoUrl} className="size-16 object-contain drop-shadow-2xl" alt={away.shortName} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <div
                          className="flex size-16 items-center justify-center rounded-full text-2xl font-black text-white shadow-xl"
                          style={{ backgroundColor: away.colors.primary }}
                        >
                          {away.shortName[0]}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-black italic uppercase tracking-tight text-white text-center leading-tight">
                      {away.shortName}
                    </h3>
                  </div>
                </div>

                {/* Bottom: Two massive CTA buttons side-by-side */}
                <div className="flex gap-2.5">
                  <Link
                    href={`/match/${m.id}`}
                    className="flex-1 flex flex-col items-center gap-1 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 border border-orange-700 py-3 shadow-[inset_0px_1px_0px_rgba(255,255,255,0.2)] transition-all active:scale-95 hover:from-orange-400 hover:to-orange-500"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">{home.shortName}</span>
                    <span className="text-sm font-black uppercase tracking-wider text-white">Pronostiquer</span>
                  </Link>
                  <Link
                    href={`/match/${m.id}`}
                    className="flex-1 flex flex-col items-center gap-1 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 border border-orange-700 py-3 shadow-[inset_0px_1px_0px_rgba(255,255,255,0.2)] transition-all active:scale-95 hover:from-orange-400 hover:to-orange-500"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">{away.shortName}</span>
                    <span className="text-sm font-black uppercase tracking-wider text-white">Pronostiquer</span>
                  </Link>
                </div>
              </div>
            </motion.section>
          )
        })()}

        {/* ─── UPCOMING MATCHES (Immersive cards) ─── */}
        {filteredUpcoming.length > 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">À venir</p>
              <Link href="/pronos" className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1 hover:text-orange-400">
                Tout voir <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-1 px-1">
              {filteredUpcoming.slice(1, 6).map((m) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                return (
                  <Link
                    key={m.id}
                    href={`/match/${m.id}`}
                    className="group relative flex-none w-[160px] h-[200px] snap-start rounded-2xl overflow-hidden transition-transform active:scale-95"
                  >
                    {/* Background gradient from team colors */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(160deg, ${home.colors.primary}30 0%, ${away.colors.primary}30 100%)`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent" />

                    {/* Faded team logos */}
                    {home.logoUrl && (
                      <img src={home.logoUrl} className="absolute -left-3 top-2 h-20 opacity-[0.1] select-none pointer-events-none" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                    {away.logoUrl && (
                      <img src={away.logoUrl} className="absolute -right-3 top-2 h-20 opacity-[0.1] select-none pointer-events-none" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}

                    {/* Content */}
                    <div className="relative flex flex-col justify-between h-full p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-white/10 backdrop-blur-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/60 border border-white/10">
                          {m.league_name}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2 -space-x-1">
                        <div className="flex -space-x-3">
                          {home.logoUrl ? (
                            <img src={home.logoUrl} className="size-10 rounded-full bg-black/50 border-2 border-[#0B0E14] p-1 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          ) : (
                            <div className="size-10 rounded-full border-2 border-[#0B0E14] flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: home.colors.primary }}>{home.shortName[0]}</div>
                          )}
                          {away.logoUrl ? (
                            <img src={away.logoUrl} className="size-10 rounded-full bg-black/50 border-2 border-[#0B0E14] p-1 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          ) : (
                            <div className="size-10 rounded-full border-2 border-[#0B0E14] flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: away.colors.primary }}>{away.shortName[0]}</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white leading-tight text-center">
                          {home.shortName} <span className="text-white/30 font-normal">vs</span> {away.shortName}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-orange-400 text-center">
                          {formatTime(m.scheduled_at)}
                        </p>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 px-1">
              Derniers résultats
            </p>
            <div className="rounded-2xl bg-[#161B26]/50 border border-white/5 overflow-hidden backdrop-blur-sm">
              {filteredFinished.map((m, i) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0)
                const awayWon = (m.away_score ?? 0) > (m.home_score ?? 0)

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between py-3.5 px-4 transition-colors hover:bg-white/[0.02] ${i < filteredFinished.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {home.logoUrl ? (
                          <img src={home.logoUrl} className="size-7 rounded-full bg-black/30 border border-[#0B0E14] p-0.5 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-7 rounded-full" style={{ backgroundColor: home.colors.primary }} />
                        )}
                        {away.logoUrl ? (
                          <img src={away.logoUrl} className="size-7 rounded-full bg-black/30 border border-[#0B0E14] p-0.5 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-7 rounded-full" style={{ backgroundColor: away.colors.primary }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {home.shortName} <span className="text-zinc-500 font-normal text-xs mx-0.5">vs</span> {away.shortName}
                        </p>
                        <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">{m.league_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-display text-base tabular-nums">
                      <span className={homeWon ? 'font-black text-white' : 'font-bold text-zinc-500'}>{m.home_score}</span>
                      <span className="text-zinc-700 text-xs">–</span>
                      <span className={awayWon ? 'font-black text-white' : 'font-bold text-zinc-500'}>{m.away_score}</span>
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
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <Trophy className="inline size-3 mr-1 text-yellow-500" />
                Top 3 de ta ligue
              </p>
              <Link href="/classement" className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1 hover:text-orange-400">
                Classement <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="rounded-2xl bg-[#161B26]/50 border border-white/5 overflow-hidden backdrop-blur-sm">
              {leaderboard.map((entry, index) => {
                const isUser = entry.userId === user?.id
                const isFirst = index === 0
                return (
                  <Link
                    href={`/profil/${entry.userId}`}
                    key={entry.userId}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                      index < leaderboard.length - 1 ? 'border-b border-white/5' : ''
                    } ${isUser ? 'bg-orange-500/5' : ''}`}
                  >
                    <span className={`w-5 text-center text-sm font-black tabular-nums ${isFirst ? 'text-yellow-500' : 'text-zinc-500'}`}>
                      {index + 1}
                    </span>
                    <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                      isUser ? 'bg-gradient-to-b from-orange-500 to-orange-600' : isFirst ? 'bg-gradient-to-b from-yellow-500 to-yellow-600' : 'bg-zinc-700'
                    }`}>
                      {entry.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{entry.username}</p>
                      {isUser && <span className="rounded-md bg-orange-500/15 border border-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">Toi</span>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black tabular-nums text-white">{entry.totalPoints}</span>
                      <span className="text-[10px] font-semibold text-zinc-500">pts</span>
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
            className="rounded-2xl border border-white/5 bg-[#161B26]/50 p-8 text-center backdrop-blur-sm"
          >
            <p className="text-sm text-zinc-400 font-medium">
              Aucun match pour le moment. Synchronise les matchs depuis les paramètres.
            </p>
            <Link
              href="/pronos"
              className="group mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-400"
            >
              Aller aux pronos
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
