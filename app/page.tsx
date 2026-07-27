'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getUpcomingMatches, getFinishedMatches } from '@/lib/api/matches'
import { getUserStats, getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { findTeam } from '@/lib/teams'
import { ArrowRight, Trophy, ChevronRight } from 'lucide-react'
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

export default function AccueilPage() {
  const { user, profile, leagueId, loading: authLoading } = useUser()
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [finished, setFinished] = useState<Match[]>([])
  const [stats, setStats] = useState({ totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

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

  // Loading skeleton
  if (authLoading || loading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col bg-[#0B0E14] pb-24">
        <header className="flex items-center justify-between px-6 pt-14 pb-6">
          <div>
            <div className="h-4 w-20 rounded bg-zinc-800 animate-pulse mb-2" />
            <h1 className="text-3xl font-black tracking-tighter text-white">
              Euro<span className="text-orange-500">Step</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-16 rounded-lg bg-zinc-800 animate-pulse" />
            <div className="size-10 rounded-full bg-zinc-800 animate-pulse" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 px-6">
          <div className="h-64 w-full rounded-xl bg-[#161B26] border border-white/5 animate-pulse" />
          <div className="h-6 w-24 rounded bg-zinc-800 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-28 w-36 shrink-0 rounded-xl bg-[#161B26] border border-white/5 animate-pulse" />
            <div className="h-28 w-36 shrink-0 rounded-xl bg-[#161B26] border border-white/5 animate-pulse" />
            <div className="h-28 w-36 shrink-0 rounded-xl bg-[#161B26] border border-white/5 animate-pulse" />
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-[#0B0E14] pb-28 text-zinc-100">

      {/* ─── HEADER: Logo + Stats + Avatar ─── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 pt-14 pb-4 backdrop-blur-md bg-[#0B0E14]/80"
      >
        <div>
          <LeagueSwitcher />
          <h1 className="mt-0.5 text-3xl font-black tracking-tighter text-white">
            Euro<span className="text-orange-500">Step</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Compact stats pills */}
          <div className="flex items-center gap-1.5 rounded-lg bg-[#161B26] border border-white/5 px-2.5 py-1.5">
            <span className="text-lg font-black tabular-nums text-orange-500">
              #{typeof userRank === 'number' ? userRank : '—'}
            </span>
            <div className="h-4 w-px bg-zinc-700" />
            <span className="text-sm font-bold tabular-nums text-white">
              <AnimatedCounter value={stats.totalPoints} className="text-sm font-bold tabular-nums" />
            </span>
            <span className="text-[10px] text-zinc-500 font-semibold">pts</span>
          </div>

          {/* Avatar */}
          <Link href="/profil" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profil" className="size-10 rounded-full object-cover border-2 border-[#0B0E14] shadow-lg" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-b from-orange-500 to-orange-600 text-sm font-bold text-white border-2 border-[#0B0E14] shadow-lg">
                {(profile?.username || 'J')[0]?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </motion.header>

      <main className="flex flex-1 flex-col gap-8 px-5">

        {/* ─── NO LEAGUE CTA ─── */}
        {!leagueId && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 text-center"
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

        {/* ─── HERO MATCH (The Centerpiece) ─── */}
        {upcoming.length > 0 && (() => {
          const m = upcoming[0]
          const home = findTeam(m.home_team)
          const away = findTeam(m.away_team)
          return (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative overflow-hidden rounded-xl bg-[#161B26] border border-white/5 shadow-2xl"
            >
              {/* Background faded logos */}
              {home.logoUrl && (
                <img
                  src={home.logoUrl}
                  alt=""
                  className="absolute -left-8 top-1/2 -translate-y-1/2 h-48 opacity-[0.06] mix-blend-screen select-none pointer-events-none"
                />
              )}
              {away.logoUrl && (
                <img
                  src={away.logoUrl}
                  alt=""
                  className="absolute -right-8 top-1/2 -translate-y-1/2 h-48 opacity-[0.06] mix-blend-screen select-none pointer-events-none"
                />
              )}

              {/* Content */}
              <div className="relative p-6">
                {/* Top label */}
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {m.league_name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                    {formatDate(m.scheduled_at)}
                  </span>
                </div>

                {/* Teams face-off */}
                <div className="flex items-center justify-between">
                  {/* Home */}
                  <div className="flex flex-col items-center w-2/5">
                    <div className="relative size-20 flex items-center justify-center">
                      {home.logoUrl ? (
                        <img src={home.logoUrl} className="size-16 object-contain drop-shadow-lg" alt={home.shortName} />
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-full bg-zinc-800 text-2xl font-black text-white">
                          {home.shortName[0]}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-black italic uppercase tracking-tighter text-white text-center leading-tight">
                      {home.shortName}
                    </h3>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black italic text-zinc-600 drop-shadow">VS</span>
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center w-2/5">
                    <div className="relative size-20 flex items-center justify-center">
                      {away.logoUrl ? (
                        <img src={away.logoUrl} className="size-16 object-contain drop-shadow-lg" alt={away.shortName} />
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-full bg-zinc-800 text-2xl font-black text-white">
                          {away.shortName[0]}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-black italic uppercase tracking-tighter text-white text-center leading-tight">
                      {away.shortName}
                    </h3>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/pronos"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 border border-orange-700 py-3.5 font-display text-sm font-bold uppercase tracking-widest text-white shadow-[inset_0px_1px_0px_rgba(255,255,255,0.2)] transition-all active:scale-95 hover:from-orange-400 hover:to-orange-500"
                >
                  Pronostiquer le choc
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.section>
          )
        })()}

        {/* ─── UPCOMING MATCHES (Horizontal Scroll) ─── */}
        {upcoming.length > 1 && (
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
              {upcoming.slice(1, 6).map((m) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                return (
                  <Link
                    key={m.id}
                    href="/pronos"
                    className="group flex-none w-[150px] snap-start rounded-xl bg-[#161B26] border border-white/5 p-4 transition-colors hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex -space-x-2">
                        {home.logoUrl ? (
                          <img src={home.logoUrl} className="size-7 rounded-full bg-zinc-800 border border-[#161B26] p-0.5 object-contain" alt="" />
                        ) : (
                          <div className="size-7 rounded-full bg-zinc-800 border border-[#161B26] flex items-center justify-center text-[10px] font-bold text-white">{home.shortName[0]}</div>
                        )}
                        {away.logoUrl ? (
                          <img src={away.logoUrl} className="size-7 rounded-full bg-zinc-800 border border-[#161B26] p-0.5 object-contain" alt="" />
                        ) : (
                          <div className="size-7 rounded-full bg-zinc-800 border border-[#161B26] flex items-center justify-center text-[10px] font-bold text-white">{away.shortName[0]}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white leading-tight">
                      {home.shortName} <span className="text-zinc-500 font-normal">vs</span> {away.shortName}
                    </p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">
                      {formatTime(m.scheduled_at)}
                    </p>
                  </Link>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ─── RECENT RESULTS (Dense list, no boxes) ─── */}
        {finished.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 px-1">
              Derniers résultats
            </p>
            <div className="flex flex-col">
              {finished.map((m, i) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0)
                const awayWon = (m.away_score ?? 0) > (m.home_score ?? 0)

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between py-3.5 px-1 ${i < finished.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {home.logoUrl ? (
                          <img src={home.logoUrl} className="size-7 rounded-full bg-zinc-900 border border-[#0B0E14] p-0.5 object-contain" alt="" />
                        ) : (
                          <div className="size-7 rounded-full bg-zinc-800" />
                        )}
                        {away.logoUrl ? (
                          <img src={away.logoUrl} className="size-7 rounded-full bg-zinc-900 border border-[#0B0E14] p-0.5 object-contain" alt="" />
                        ) : (
                          <div className="size-7 rounded-full bg-zinc-800" />
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

            <div className="rounded-xl bg-[#161B26] border border-white/5 overflow-hidden">
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
            className="rounded-xl border border-white/5 bg-[#161B26] p-8 text-center"
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
