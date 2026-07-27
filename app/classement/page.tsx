'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getLeaderboard, type LeaderboardEntry, type FormResult } from '@/lib/leaderboard'
import { Share2, Flame, Loader2, Trophy, Target, Copy, CheckCircle2, Info } from 'lucide-react'
import { motion } from 'framer-motion'

import { createClient } from '@/lib/supabase/client'

export default function ClassementPage() {
  const { user, profile, leagueId, loading: authLoading } = useUser()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; code: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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
        getLeaderboard(leagueId!),
        supabase.from('leagues').select('name, code').eq('id', leagueId).single()
      ])
      
      setEntries(data)
      if (leagueData) {
        setLeagueInfo(leagueData)
      }
      setLoading(false)
    }

    load()
  }, [leagueId, authLoading])

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col text-zinc-100">
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
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white line-clamp-1">
            {leagueInfo?.name || 'Classement'}
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
          <div className="flex flex-col gap-10">
            {/* ─── MA SAISON (CURRENT USER STATS) ─── */}
            {myEntry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mx-2 overflow-hidden rounded-2xl bg-gradient-to-br from-[#161B26] to-zinc-900/50 border border-white/5 shadow-lg"
              >
                <div className="border-b border-white/5 bg-white/5 px-4 py-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="size-4 text-orange-500" />
                    Ma Saison
                  </h2>
                </div>
                <div className="grid grid-cols-3 divide-x divide-white/5 p-4">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-black text-white">{myEntry.rank}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rang</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-black text-orange-400">{myEntry.totalPoints}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Points</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-xl font-black text-white flex items-center gap-1">
                      {myEntry.exactScores} <Target className="size-4 text-zinc-400" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Exacts</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PODIUM TOP 3 ─── */}
            {entries.length > 0 && (
              <div className="flex items-end justify-center gap-4 pt-8">
                {/* 2nd Place */}
                {entries[1] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex w-1/3 flex-col items-center">
                    <Link href={`/profil/${entries[1].userId}`} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 p-[3px] shadow-[0_0_15px_rgba(161,161,170,0.3)]">
                          <div className="flex size-full items-center justify-center rounded-full bg-[#161B26] font-bold text-white">
                            {entries[1].username[0]?.toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full bg-zinc-400 text-xs font-black text-white border-2 border-[#161B26]">2</div>
                      </div>
                      <p className="mt-4 w-full truncate text-center text-xs font-bold text-white">{entries[1].username}</p>
                      <p className="text-[10px] font-bold text-zinc-500">{entries[1].totalPoints} pts</p>
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-zinc-600 font-medium">
                        <span>{entries[1].predictionsCount} prono{entries[1].predictionsCount > 1 ? 's' : ''}</span>
                        {entries[1].exactScores > 0 && <span>• 🎯 {entries[1].exactScores}</span>}
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {entries[1].recentForm.map((res, i) => (
                          <span key={i} className="text-[8px]" title={res === 'exact' ? 'Score exact' : res === 'good' ? 'Bon vainqueur' : 'Mauvais pronostic'}>
                            {res === 'exact' ? '🎯' : res === 'good' ? '✅' : '❌'}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* 1st Place */}
                {entries[0] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="flex w-1/3 flex-col items-center">
                    <Link href={`/profil/${entries[0].userId}`} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                        <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 p-[4px] shadow-[0_0_25px_rgba(234,179,8,0.4)]">
                          <div className="flex size-full items-center justify-center rounded-full bg-[#161B26] text-2xl font-bold text-white">
                            {entries[0].username[0]?.toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex size-7 items-center justify-center rounded-full bg-yellow-500 text-sm font-black text-white border-2 border-[#161B26]">1</div>
                      </div>
                      <p className="mt-5 w-full truncate text-center text-sm font-bold text-yellow-400">{entries[0].username}</p>
                      <p className="text-xs font-bold text-yellow-500/50">{entries[0].totalPoints} pts</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-yellow-500/40 font-medium">
                        <span>{entries[0].predictionsCount} prono{entries[0].predictionsCount > 1 ? 's' : ''}</span>
                        {entries[0].exactScores > 0 && <span>• 🎯 {entries[0].exactScores}</span>}
                      </div>
                      <div className="mt-1.5 flex gap-0.5">
                        {entries[0].recentForm.map((res, i) => (
                          <span key={i} className="text-[10px]" title={res === 'exact' ? 'Score exact' : res === 'good' ? 'Bon vainqueur' : 'Mauvais pronostic'}>
                            {res === 'exact' ? '🎯' : res === 'good' ? '✅' : '❌'}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {entries[2] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex w-1/3 flex-col items-center">
                    <Link href={`/profil/${entries[2].userId}`} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 p-[3px] shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                          <div className="flex size-full items-center justify-center rounded-full bg-[#161B26] font-bold text-white">
                            {entries[2].username[0]?.toUpperCase()}
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full bg-amber-700 text-xs font-black text-white border-2 border-[#161B26]">3</div>
                      </div>
                      <p className="mt-4 w-full truncate text-center text-xs font-bold text-white">{entries[2].username}</p>
                      <p className="text-[10px] font-bold text-zinc-500">{entries[2].totalPoints} pts</p>
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-zinc-600 font-medium">
                        <span>{entries[2].predictionsCount} prono{entries[2].predictionsCount > 1 ? 's' : ''}</span>
                        {entries[2].exactScores > 0 && <span>• 🎯 {entries[2].exactScores}</span>}
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {entries[2].recentForm.map((res, i) => (
                          <span key={i} className="text-[8px]" title={res === 'exact' ? 'Score exact' : res === 'good' ? 'Bon vainqueur' : 'Mauvais pronostic'}>
                            {res === 'exact' ? '🎯' : res === 'good' ? '✅' : '❌'}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </motion.div>
                )}
              </div>
            )}

            {/* ─── REST OF THE LEADERBOARD ─── */}
            {entries.length > 3 && (
              <div className="flex flex-col gap-3 mt-4">
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
                            ? 'bg-orange-500/10 border-orange-500/30'
                            : 'bg-[#161B26] border-white/5'
                        }`}
                      >
                        <span className="w-8 text-center font-bold text-base tabular-nums text-zinc-500">
                          {entry.rank}
                        </span>

                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${isUser ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                          {entry.username[0]?.toUpperCase()}
                        </div>

                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{entry.username}</span>
                            {isUser && (
                              <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">TOI</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <span>{entry.predictionsCount} prono{entry.predictionsCount > 1 ? 's' : ''}</span>
                            
                            {entry.recentForm.length > 0 && (
                              <>
                                <span className="text-zinc-700">•</span>
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

                        <div className="shrink-0 rounded-xl bg-zinc-950/50 px-3 py-1.5 border border-white/5">
                          <span className="font-bold text-sm text-white tabular-nums">
                            {entry.totalPoints} <span className="text-[9px] text-zinc-500">pts</span>
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
                className="mt-4 mx-2 rounded-2xl border border-dashed border-orange-500/30 bg-orange-500/5 p-5 text-center"
              >
                <h3 className="text-sm font-bold text-orange-400">Invite tes potes !</h3>
                <p className="mt-1 text-xs text-zinc-400">Plus on est de fous, plus on rit. Partage le code de la ligue pour les défier.</p>
                <button
                  onClick={handleCopyCode}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-transform active:scale-95"
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
              className="mt-4 mx-2 rounded-2xl bg-[#161B26] p-5 border border-white/5"
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Info className="size-4 text-zinc-400" />
                Barème des points
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Score exact 🎯</span>
                  <span className="font-bold text-orange-400">+10 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Bon écart (± 3) 🤏</span>
                  <span className="font-bold text-white">+5 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Bon vainqueur ✅</span>
                  <span className="font-bold text-white">+3 pts</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

