'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useUser } from '@/components/user-provider'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { Share2, Loader2, Trophy, Target, Copy, CheckCircle2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TopRightProfile } from '@/components/top-right-profile'

export function ClassementView() {
  const { user, profile, leagueId, loading: authLoading } = useUser()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; code: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [timeframe, setTimeframe] = useState<'all-time' | 'week'>('all-time')

  const myEntry = entries.find(e => e.userId === user?.id)

  const handleCopyCode = () => {
    if (leagueInfo?.code) {
      navigator.clipboard.writeText(leagueInfo.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!leagueId) {
      setLoading(false)
      return
    }

    async function load() {
      const supabase = createClient()
      
      const [data, { data: leagueData }] = await Promise.all([
        getLeaderboard(leagueId!, timeframe),
        supabase.from('leagues').select('name, code').eq('id', leagueId).single()
      ])
      
      setEntries(data)
      if (leagueData) {
        setLeagueInfo(leagueData)
      }
      setLoading(false)
    }

    load()
  }, [leagueId, authLoading, timeframe])

  if (!user && !authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 bg-transparent">
        <p className="text-center text-sm font-semibold text-zinc-400">
          Connecte-toi pour voir le classement.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full pb-28 text-white selection:bg-blaze/20">
      <header className="sticky top-0 z-50 flex flex-col px-5 pt-14 pb-4 bg-transparent">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white line-clamp-1">
              {leagueInfo?.name || 'Classement'}
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
              {entries.length} membre{entries.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Partager"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              <Share2 className="size-5" strokeWidth={1.5} />
            </button>
            
            <TopRightProfile />
          </div>
        </div>

        {/* Timeframe Toggle */}
        <div className="mt-6 flex bg-white/10 rounded-xl p-1 border border-white/10 shadow-sm">
          <button
            onClick={() => setTimeframe('all-time')}
            className={`flex-1 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${timeframe === 'all-time' ? 'bg-[#111317] text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`flex-1 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${timeframe === 'week' ? 'bg-[#111317] text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Cette semaine
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 pt-4">
        {authLoading || loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-[40px] bg-white/10 shadow-sm p-12 text-center border border-white mt-8 mx-1">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <Trophy className="size-8 text-zinc-300" />
            </div>
            <p className="text-sm text-zinc-400 font-medium">
              {leagueId ? 'Aucun pronostic encore enregistré.' : 'Rejoins une ligue pour voir le classement.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* ─── MA SAISON (CURRENT USER STATS) ─── */}
            {myEntry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mx-1 overflow-hidden rounded-2xl bg-white/10 border border-white/10 shadow-sm"
              >
                <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="size-4 text-sandy" />
                    Ma Saison
                  </h2>
                </div>
                <div className="grid grid-cols-3 divide-x divide-black/5 p-4">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-black text-white font-display">{myEntry.rank}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Rang</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-black text-blaze font-display">{myEntry.totalPoints}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Points</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-xl font-black text-white flex items-center gap-1 font-display">
                      {myEntry.exactScores} <Target className="size-4 text-zinc-300" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Exacts</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PODIUM TOP 3 ─── */}
            {entries.length > 0 && (
              <div className="flex items-end justify-center gap-4 pt-4">
                {/* 2nd Place */}
                {entries[1] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex w-1/3 flex-col items-center">
                    <Link href={`/profil/${entries[1].userId}`} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 p-1 shadow-md">
                          <div className="flex size-full items-center justify-center rounded-full bg-white/10 font-bold text-white">
                            {entries[1].username[0]?.toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full bg-zinc-300 text-xs font-black text-white border-2 border-white">2</div>
                      </div>
                      <p className="mt-4 w-full truncate text-center text-xs font-bold text-white">{entries[1].username}</p>
                      <p className="text-[10px] font-bold text-zinc-400">{entries[1].totalPoints} pts</p>
                    </Link>
                  </motion.div>
                )}

                {/* 1st Place */}
                {entries[0] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="flex w-1/3 flex-col items-center">
                    <Link href={`/profil/${entries[0].userId}`} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                        <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 p-1.5 shadow-lg shadow-yellow-500/20">
                          <div className="flex size-full items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
                            {entries[0].username[0]?.toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex size-7 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-white border-2 border-white">1</div>
                      </div>
                      <p className="mt-5 w-full truncate text-center text-sm font-bold text-yellow-600">{entries[0].username}</p>
                      <p className="text-xs font-bold text-zinc-400">{entries[0].totalPoints} pts</p>
                    </Link>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {entries[2] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex w-1/3 flex-col items-center">
                    <Link href={`/profil/${entries[2].userId}`} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 p-1 shadow-md">
                          <div className="flex size-full items-center justify-center rounded-full bg-white/10 font-bold text-white">
                            {entries[2].username[0]?.toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full bg-amber-600 text-xs font-black text-white border-2 border-white">3</div>
                      </div>
                      <p className="mt-4 w-full truncate text-center text-xs font-bold text-white">{entries[2].username}</p>
                      <p className="text-[10px] font-bold text-zinc-400">{entries[2].totalPoints} pts</p>
                    </Link>
                  </motion.div>
                )}
              </div>
            )}

            {/* ─── REST OF THE LEADERBOARD ─── */}
            {entries.length > 3 && (
              <div className="flex flex-col gap-3 mt-4 mx-1">
                {entries.slice(3).map((entry, index) => {
                  const isUser = entry.userId === user?.id

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link
                        href={`/profil/${entry.userId}`}
                        className={`flex items-center gap-4 rounded-2xl p-4 shadow-sm transition-all active:scale-[0.98] border ${
                          isUser
                            ? 'bg-white/5 border-white/10'
                            : 'bg-white/10 border-white/10'
                        }`}
                      >
                        <span className="w-8 text-center font-black font-display text-lg tabular-nums text-zinc-300">
                          {entry.rank}
                        </span>

                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${isUser ? 'bg-[#111317] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                          {entry.username[0]?.toUpperCase()}
                        </div>

                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{entry.username}</span>
                            {isUser && (
                              <span className="text-[9px] font-bold text-white bg-black/5 px-2 py-0.5 rounded-full uppercase tracking-widest">Toi</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            <span>{entry.predictionsCount} prono{entry.predictionsCount > 1 ? 's' : ''}</span>
                            
                            {entry.recentForm.length > 0 && (
                              <>
                                <span className="text-zinc-200">•</span>
                                <div className="flex gap-0.5">
                                  {entry.recentForm.map((res, i) => (
                                    <span key={i} className="text-[9px]" title={res === 'exact' ? 'Score exact' : res === 'good' ? 'Bon vainqueur' : 'Mauvais pronostic'}>
                                      {res === 'exact' ? '🎯' : res === 'good' ? '✅' : '❌'}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10">
                          <span className="font-black text-sm font-display text-white tabular-nums">
                            {entry.totalPoints} <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest ml-0.5">pts</span>
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* ─── INVITE BLOCK ─── */}
            {entries.length < 5 && leagueInfo?.code && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-4 mx-1 rounded-2xl border border-dashed border-blaze/30 bg-blaze/5 p-6 text-center"
              >
                <h3 className="text-sm font-bold text-blaze">Invite tes potes !</h3>
                <p className="mt-1 text-xs text-zinc-400 font-medium">Plus on est de fous, plus on rit. Partage le code de la ligue pour les défier.</p>
                <button
                  onClick={handleCopyCode}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#111317] py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-transform active:scale-95 shadow-md hover:bg-black"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copier le code ({leagueInfo.code})
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* ─── RULES BLOCK ─── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-4 mx-1 rounded-2xl bg-white/10 p-6 border border-white/10 shadow-sm"
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Info className="size-4 text-zinc-400" />
                Barème des points
              </h3>
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-sm font-semibold text-zinc-400">Score exact 🎯</span>
                  <span className="font-black text-blaze">+10 pts</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-sm font-semibold text-zinc-400">Bon écart (± 3) 🤏</span>
                  <span className="font-black text-white">+5 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-400">Bon vainqueur ✅</span>
                  <span className="font-black text-white">+3 pts</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}
