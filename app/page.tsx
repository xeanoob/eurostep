'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getUpcomingMatches, getFinishedMatches } from '@/lib/api/matches'
import { getUserStats, getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { findTeam } from '@/lib/teams'
import { ArrowRight, Trophy, Target, TrendingUp } from 'lucide-react'
import { LeagueSwitcher } from '@/components/league-switcher'

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
        getFinishedMatches(3),
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
    return d.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col bg-gray-50 pb-24 relative overflow-hidden">
        
        <header className="relative flex items-center justify-between px-6 pt-14 pb-8 z-50">
          <div>
            <div className="h-6 w-32 rounded-md bg-gray-200 animate-pulse mb-1"></div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Euro<span className="text-blue-600">Step</span>
            </h1>
          </div>
          <div className="size-10 rounded-full bg-gray-200 animate-pulse" />
        </header>

        <main className="relative z-10 flex flex-1 flex-col gap-6 px-6">
          <div className="h-24 w-full rounded-2xl bg-white border border-gray-200 shadow-sm animate-pulse" />
          <div className="h-64 w-full rounded-2xl bg-white border border-gray-200 shadow-sm animate-pulse" />
          <div className="h-20 w-full rounded-2xl bg-white border border-gray-200 shadow-sm animate-pulse" />
        </main>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-gray-50 pb-24 text-gray-900">

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center justify-between px-6 pt-14 pb-8 z-50"
      >
        <div>
          <LeagueSwitcher />
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Euro<span className="text-blue-600">Step</span>
          </h1>
        </div>
        <Link href="/profil" className="shrink-0 rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profil" className="size-10 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white border-2 border-white shadow-sm">
              {(profile?.username || 'J')[0]?.toUpperCase()}
            </div>
          )}
        </Link>
      </motion.header>

      <main className="relative z-10 flex flex-1 flex-col gap-6 px-6">
        {/* Stats Neumorphism */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between rounded-2xl bg-white p-5 border border-gray-200 shadow-sm"
        >
          <div className="flex flex-col items-center">
            <Trophy className="mb-2 size-5 text-yellow-500" />
            <p className="text-2xl font-bold tabular-nums leading-none text-gray-900">{stats.totalPoints}</p>
            <p className="mt-1.5 text-[10px] font-semibold text-gray-500">Points</p>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="flex flex-col items-center">
            <TrendingUp className="mb-2 size-5 text-blue-500" />
            <p className="text-2xl font-bold tabular-nums leading-none text-gray-900">{typeof userRank === 'number' ? `#${userRank}` : userRank}</p>
            <p className="mt-1.5 text-[10px] font-semibold text-gray-500">Rang</p>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="flex flex-col items-center">
            <Target className="mb-2 size-5 text-pink-500" />
            <p className="text-2xl font-bold tabular-nums leading-none text-gray-900">
              {stats.successRate}<span className="text-base text-gray-500">%</span>
            </p>
            <p className="mt-1.5 text-[10px] font-semibold text-gray-500">Réussite</p>
          </div>
        </motion.section>

        {/* No league CTA */}
        {!leagueId && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center"
          >
            <p className="text-xs font-semibold text-blue-900">Tu n'es dans aucune ligue.</p>
            <Link
              href="/ligue"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95"
            >
              Créer ou rejoindre
            </Link>
          </motion.section>
        )}

        {/* Next match */}
        {upcoming.length > 0 && (() => {
          const m = upcoming[0];
          const home = findTeam(m.home_team);
          const away = findTeam(m.away_team);
          return (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(to right, ${home.colors.primary}, ${away.colors.primary})` }} />
              <div className="relative p-6">
                <p className="text-center text-[11px] font-semibold text-gray-500">
                  Prochain match · {formatDate(m.scheduled_at)}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex flex-col items-center w-1/3">
                    {home.logoUrl ? <img src={home.logoUrl} className="size-16 object-contain" /> : <div className="text-4xl font-bold text-gray-900">{home.shortName[0]}</div>}
                    <p className="mt-3 text-lg font-bold tracking-tight text-gray-900">{home.shortName}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-gray-400">VS</span>
                  </div>
                  <div className="flex flex-col items-center w-1/3">
                    {away.logoUrl ? <img src={away.logoUrl} className="size-16 object-contain" /> : <div className="text-4xl font-bold text-gray-900">{away.shortName[0]}</div>}
                    <p className="mt-3 text-lg font-bold tracking-tight text-gray-900">{away.shortName}</p>
                  </div>
                </div>
                <Link
                  href="/pronos"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-blue-700 shadow-sm"
                >
                  Faire mon pronostic
                </Link>
              </div>
            </motion.section>
          )
        })()}

        {/* Upcoming */}
        {upcoming.length > 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="mb-3 text-[12px] font-semibold text-gray-500 ml-1">À venir</p>
            <div className="flex flex-col gap-3">
              {upcoming.slice(1, 4).map((m) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {home.logoUrl ? <img src={home.logoUrl} className="size-8 rounded-full bg-gray-50 border-2 border-white p-1" /> : <div className="size-8 rounded-full bg-gray-100" />}
                        {away.logoUrl ? <img src={away.logoUrl} className="size-8 rounded-full bg-gray-50 border-2 border-white p-1" /> : <div className="size-8 rounded-full bg-gray-100" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {home.shortName} <span className="text-gray-400 font-normal mx-1">vs</span> {away.shortName}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">{m.league_name}</p>
                      </div>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-400">{formatDate(m.scheduled_at).split(' · ')[1] || formatDate(m.scheduled_at)}</p>
                  </div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* Finished */}
        {finished.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="mb-3 text-[12px] font-semibold text-gray-500 ml-1">Derniers résultats</p>
            <div className="flex flex-col gap-3">
              {finished.map((m) => {
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)
                const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0)
                const awayWon = (m.away_score ?? 0) > (m.home_score ?? 0)

                return (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {home.logoUrl ? <img src={home.logoUrl} className="size-8 rounded-full bg-gray-50 border-2 border-white p-1" /> : <div className="size-8 rounded-full bg-gray-100" />}
                        {away.logoUrl ? <img src={away.logoUrl} className="size-8 rounded-full bg-gray-50 border-2 border-white p-1" /> : <div className="size-8 rounded-full bg-gray-100" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {home.shortName} <span className="text-gray-400 font-normal mx-1">vs</span> {away.shortName}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">{m.league_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 border border-gray-200">
                      <span className={`font-bold ${homeWon ? 'text-gray-900' : 'text-gray-500'}`}>{m.home_score}</span>
                      <span className="text-gray-300 text-xs">-</span>
                      <span className={`font-bold ${awayWon ? 'text-gray-900' : 'text-gray-500'}`}>{m.away_score}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[12px] font-semibold text-gray-500">Top 3 de ta ligue</p>
              <Link href="/classement" className="text-[11px] font-bold text-blue-600 flex items-center hover:underline">
                Voir tout <ArrowRight className="ml-1 size-3" />
              </Link>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-2">
              {leaderboard.map((entry, index) => {
                const isUser = entry.userId === user?.id
                const isFirst = index === 0
                return (
                  <Link href={`/profil/${entry.userId}`} key={entry.userId} className={`flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 ${isUser ? 'bg-blue-50/50' : ''}`}>
                    <span className={`w-4 text-center text-sm font-bold ${isFirst ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                    <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${isUser ? 'bg-blue-600' : isFirst ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                      {entry.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{entry.username}</p>
                      {isUser && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">TOI</span>}
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1">
                      <span className="text-sm font-bold text-gray-900">{entry.totalPoints}</span>
                      <span className="ml-1 text-[10px] text-gray-500">pts</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {upcoming.length === 0 && finished.length === 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm"
          >
            <p className="text-sm text-gray-500 font-medium">
              Aucun match pour le moment. Synchronise les matchs depuis les paramètres.
            </p>
            <Link
              href="/pronos"
              className="group mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
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
