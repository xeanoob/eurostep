'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { Share2 } from 'lucide-react'

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
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-gray-50 text-gray-900">
      <header className="flex items-start justify-between px-6 pt-14 pb-8">
        <div>
          <p className="text-xs font-semibold text-gray-500 ml-1">
            {entries.length} membre{entries.length !== 1 ? 's' : ''}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Classe<span className="text-blue-600">ment</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Partager"
            className="text-gray-400 transition-colors hover:text-gray-900"
          >
            <Share2 className="size-5" strokeWidth={1.5} />
          </button>
          
          <Link href="/profil" className="shrink-0 rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profil" className="size-10 rounded-full object-cover border-2 border-white" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white border-2 border-white">
                {(profile?.username || 'J')[0]?.toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col pb-28 px-4">
        {authLoading || loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-gray-400 animate-pulse">Chargement...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-500">
              {leagueId ? 'Aucun pronostic encore enregistré.' : 'Rejoins une ligue pour voir le classement.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const isTop3 = entry.rank <= 3
              const isFirst = entry.rank === 1
              const isUser = entry.userId === user?.id

              return (
                <Link
                  href={`/profil/${entry.userId}`}
                  key={entry.userId}
                  className={`flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-95 ${
                    isFirst ? 'border border-yellow-200 bg-yellow-50/30' : 'border border-gray-100'
                  } ${isUser && !isFirst ? 'bg-blue-50/30 border-blue-100' : ''}`}
                >
                  <span
                    className={`w-6 text-center font-bold text-lg tabular-nums ${
                      isFirst ? 'text-yellow-500' : isTop3 ? 'text-gray-500' : 'text-gray-300'
                    }`}
                  >
                    {entry.rank}
                  </span>

                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : isFirst
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {entry.username[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{entry.username}</span>
                      {isUser && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">TOI</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl bg-gray-50 px-3 py-1.5 border border-gray-200">
                    <span className="font-bold text-base text-gray-900 tabular-nums">
                      {entry.totalPoints} <span className="text-[10px] text-gray-500">pts</span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
