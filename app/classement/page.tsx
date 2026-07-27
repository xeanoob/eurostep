'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { Share2, Flame, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ClassementPage() {
  const { user, profile, leagueId, loading: authLoading } = useUser()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!leagueId) {
      setLoading(false)
      return
    }

    async function load() {
      const data = await getLeaderboard(leagueId!)
      setEntries(data)
      setLoading(false)
    }

    load()
  }, [leagueId, authLoading])

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-[#0B0E14] text-zinc-100">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between px-6 pt-14 pb-8"
      >
        <div>
          <p className="text-xs font-semibold text-zinc-500 ml-1">
            {entries.length} membre{entries.length !== 1 ? 's' : ''}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Classe<span className="text-orange-500">ment</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Partager"
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <Share2 className="size-5" strokeWidth={1.5} />
          </button>
          
          <Link href="/profil" className="shrink-0 rounded-full border-2 border-zinc-950 shadow-sm transition-transform hover:scale-105 active:scale-95">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profil" className="size-10 rounded-full object-cover" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {(profile?.username || 'J')[0]?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </motion.header>

      <main className="flex flex-1 flex-col pb-28 px-4">
        {authLoading || loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-center shadow-sm border border-zinc-800">
            <p className="text-sm font-semibold text-zinc-400">
              {leagueId ? 'Aucun pronostic encore enregistré.' : 'Rejoins une ligue pour voir le classement.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry, index) => {
              const isTop3 = entry.rank <= 3
              const isFirst = entry.rank === 1
              const isSecond = entry.rank === 2
              const isThird = entry.rank === 3
              const isUser = entry.userId === user?.id

              const rankColors = isFirst
                ? 'text-yellow-400'
                : isSecond
                  ? 'text-zinc-300'
                  : isThird
                    ? 'text-amber-600'
                    : 'text-zinc-600'

              const avatarColors = isUser
                ? 'bg-orange-500 text-white'
                : isFirst
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    href={`/profil/${entry.userId}`}
                    className={`flex items-center gap-4 rounded-2xl p-4 shadow-sm transition-all active:scale-[0.98] border ${
                      isFirst
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : isUser && !isFirst
                          ? 'bg-orange-500/5 border-orange-500/20'
                          : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-6 text-center font-bold text-lg tabular-nums ${rankColors}`}
                    >
                      {isFirst ? '👑' : entry.rank}
                    </span>

                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${avatarColors}`}
                    >
                      {entry.username[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{entry.username}</span>
                        {isUser && (
                          <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">TOI</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-xl bg-zinc-800/50 px-3 py-1.5 border border-zinc-700">
                      <span className="font-bold text-base text-white tabular-nums">
                        {entry.totalPoints} <span className="text-[10px] text-zinc-500">pts</span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

