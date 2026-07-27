'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getUserStats } from '@/lib/leaderboard'
import { getUserPredictions } from '@/lib/predictions'
import { findTeam } from '@/lib/teams'
import { ChevronLeft, Trophy, Target, TrendingUp, Star, Crown, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/user-provider'

interface PredictionWithMatch {
  id: string
  predicted_home_score: number
  predicted_away_score: number
  points_earned: number | null
  matches: {
    home_team: string
    away_team: string
    home_score: number | null
    away_score: number | null
    status: string
  }
}

export default function PublicProfilePage({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useUser()
  
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null; current_streak: number; longest_streak: number } | null>(null)
  const [stats, setStats] = useState({ totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 })
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, current_streak, longest_streak')
        .eq('id', params.userId)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      const [userStats, preds] = await Promise.all([
        getUserStats(params.userId),
        getUserPredictions(params.userId),
      ])
      
      setStats(userStats)
      setPredictions(preds as unknown as PredictionWithMatch[])
      setLoading(false)
    }

    load()
  }, [params.userId])

  if (loading || authLoading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center bg-zinc-950">
        <div className="size-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <p>Utilisateur introuvable</p>
        <button onClick={() => router.back()} className="mt-4 text-orange-500 hover:underline">Retour</button>
      </div>
    )
  }

  const username = profile.username ?? 'Joueur'
  const avatarUrl = profile.avatar_url
  const isCurrentUser = currentUser?.id === params.userId

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      
      {/* Navbar iOS Cinematic */}
      <div className="sticky top-0 z-50 flex items-center gap-3 bg-zinc-950/80 px-4 py-3 backdrop-blur-2xl border-b border-zinc-800 shadow-sm">
        <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-zinc-800 transition-colors">
          <ChevronLeft className="size-6 text-white" />
        </button>
        <p className="font-semibold text-white tracking-wide">Profil</p>
      </div>

      <main className="flex-1 overflow-y-auto">
        {/* Banner Discord Style (Gradient pop) */}
        <div className="relative h-32 w-full bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20" />

        {/* Profile Info */}
        <div className="relative px-4 pb-6">
          {/* Overlapping Avatar */}
          <div className="absolute -top-12 left-4 rounded-full border-[6px] border-zinc-950 bg-zinc-950">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="size-20 rounded-full object-cover" />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-orange-500 text-3xl font-bold text-white">
                {username[0]?.toUpperCase()}
              </div>
            )}
            
            {/* Online Status Indicator */}
            <div className="absolute bottom-0 right-0 size-5 rounded-full border-[4px] border-zinc-950 bg-green-500" />
          </div>

          <div className="flex justify-end pt-3 h-14">
            {isCurrentUser ? (
              <button onClick={() => router.push('/profil')} className="rounded-lg bg-zinc-800 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 shadow-sm">
                Modifier
              </button>
            ) : (
              <button className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 shadow-sm">
                Ajouter ami
              </button>
            )}
          </div>

          <div className="mt-2 rounded-2xl bg-zinc-900 p-5 shadow-sm border border-zinc-800">
            <h1 className="text-2xl font-bold text-white tracking-tight">{username}</h1>
            <p className="text-sm font-medium text-zinc-400 mt-1">Membre d'EuroStep depuis toujours ✨</p>
            
            <div className="mt-4 h-px w-full bg-zinc-800" />

            <div className="mt-5">
              <h2 className="text-[11px] font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Badges & Stats</h2>
              <div className="flex flex-wrap gap-2.5">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 border border-zinc-700">
                  <Crown className="size-4 text-yellow-500" />
                  <span className="text-sm font-bold text-white">{stats.totalPoints} pts</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 border border-zinc-700">
                  <Target className="size-4 text-pink-500" />
                  <span className="text-sm font-bold text-white">{stats.exactScores} perfects</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 border border-zinc-700">
                  <TrendingUp className="size-4 text-orange-500" />
                  <span className="text-sm font-bold text-white">{stats.successRate}% win</span>
                </div>
                {(profile.current_streak > 0 || profile.longest_streak > 0) && (
                  <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-3 py-2 border border-orange-500/20">
                    <Flame className="size-4 text-orange-400" />
                    <span className="text-sm font-bold text-orange-400">
                      {profile.current_streak > 0 ? `${profile.current_streak} série` : `Record: ${profile.longest_streak}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Predictions History */}
        <div className="px-4 pb-12">
          <h2 className="mb-4 text-[12px] font-semibold text-zinc-500 pl-2 uppercase tracking-wider">Activité Récente</h2>
          
          <div className="flex flex-col gap-3">
            {predictions.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900 p-8 text-center shadow-sm border border-zinc-800">
                <p className="text-sm font-medium text-zinc-400">Aucun match pronostiqué pour l'instant... ZzZ 😴</p>
              </div>
            ) : (
              predictions.slice(0, 10).map((pred) => {
                const m = pred.matches
                const isExact = pred.points_earned === 10
                const isWon = (pred.points_earned ?? 0) > 0
                const isFinished = m.status === 'finished'

                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)

                return (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between rounded-2xl p-4 shadow-sm border ${
                      isExact ? 'border-pink-900/50 bg-pink-950/20' : 'border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex -space-x-1.5">
                          {home.logoUrl ? <img src={home.logoUrl} className="size-6 rounded-full bg-zinc-800 border border-zinc-900" /> : <div className="size-6 rounded-full bg-zinc-800 border border-zinc-900" />}
                          {away.logoUrl ? <img src={away.logoUrl} className="size-6 rounded-full bg-zinc-800 border border-zinc-900" /> : <div className="size-6 rounded-full bg-zinc-800 border border-zinc-900" />}
                        </div>
                        <p className="text-sm font-bold text-white tracking-tight">
                          {home.shortName} <span className="text-zinc-500 font-normal mx-0.5">vs</span> {away.shortName}
                        </p>
                      </div>
                      
                      <div className="flex gap-4 mt-2 pl-1">
                        <p className="text-xs font-semibold text-zinc-400">
                          Prono: <span className="font-bold text-white ml-1">{pred.predicted_home_score}–{pred.predicted_away_score}</span>
                        </p>
                        {isFinished && (
                          <p className="text-xs font-semibold text-zinc-400">
                            Vrai: <span className="font-bold text-white ml-1">{m.home_score}–{m.away_score}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center ml-4">
                      {isFinished ? (
                        <div className={`flex items-center justify-center rounded-lg px-2.5 py-1 ${isWon ? 'bg-green-900/30 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          <span className="font-bold text-sm">
                            {isWon ? `+${pred.points_earned}` : '0'}
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-orange-500/20 px-2 py-1">
                          <span className="text-[10px] font-bold text-orange-400">WAIT</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
