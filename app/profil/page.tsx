'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getUserStats } from '@/lib/leaderboard'
import { getUserPredictions } from '@/lib/predictions'
import { findTeam } from '@/lib/teams'
import { signOut } from '@/lib/auth'
import { ArrowRight, LogOut, Camera, Trophy, Target, TrendingUp, CalendarDays, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export default function ProfilPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useUser()
  const [stats, setStats] = useState({ totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 })
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authLoading || !user) return

    async function load() {
      const [userStats, preds] = await Promise.all([
        getUserStats(user!.id),
        getUserPredictions(user!.id),
      ])
      setStats(userStats)
      setPredictions(preds as unknown as PredictionWithMatch[])
      setLoading(false)
    }

    load()
  }, [user, authLoading])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingAvatar(true)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      alert("Erreur lors du téléchargement de l'image.")
      setIsUploadingAvatar(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const newAvatarUrl = data.publicUrl

    await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id)
    window.location.reload()
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center bg-zinc-950">
        <div className="size-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const username = profile?.username ?? 'Joueur'
  const avatarUrl = profile?.avatar_url

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-zinc-950 pb-24 text-zinc-100">
      {/* Background Effect */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-orange-500/10 to-transparent" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center px-6 pt-14 pb-8"
      >
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleFileSelect} 
            disabled={isUploadingAvatar}
          />
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className={`size-24 rounded-full object-cover shadow-md border-4 border-zinc-950 transition-opacity ${isUploadingAvatar ? 'opacity-50' : 'group-hover:opacity-80'}`} />
          ) : (
            <div className={`flex size-24 items-center justify-center rounded-full bg-orange-500 text-3xl font-bold text-white shadow-md border-4 border-zinc-950 transition-opacity ${isUploadingAvatar ? 'opacity-50' : 'group-hover:opacity-80'}`}>
              {username[0]?.toUpperCase()}
            </div>
          )}
          
          {isUploadingAvatar ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="size-6 text-white animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="size-6 text-white" />
            </div>
          )}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">{username}</h1>
        <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-orange-500">
          Membre EuroStep
        </p>
      </motion.header>

      <main className="relative z-10 flex flex-1 flex-col gap-8 px-6 pb-28">
        {/* Stats Glassmorphism */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between rounded-2xl bg-zinc-900 p-5 border border-zinc-800 shadow-sm"
        >
          <div className="flex flex-col items-center">
            <Trophy className="mb-2 size-4 text-yellow-500" />
            <p className="text-3xl font-bold tabular-nums leading-none text-white">{stats.totalPoints}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Points</p>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <div className="flex flex-col items-center">
            <Target className="mb-2 size-4 text-pink-500" />
            <p className="text-3xl font-bold tabular-nums leading-none text-white">{stats.exactScores}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Exacts</p>
          </div>
          <div className="h-10 w-px bg-zinc-800" />
          <div className="flex flex-col items-center">
            <TrendingUp className="mb-2 size-4 text-orange-500" />
            <p className="text-3xl font-bold tabular-nums leading-none text-white">
              {stats.successRate}<span className="text-lg text-zinc-500">%</span>
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Réussite</p>
          </div>
        </motion.section>

        {/* Predictions history */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <CalendarDays className="size-3" /> Derniers pronostics
          </p>

          {predictions.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-zinc-400">
                Aucun pronostic encore.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {predictions.slice(0, 10).map((pred) => {
              const m = pred.matches
              const isExact = pred.points_earned === 10
              const isWon = (pred.points_earned ?? 0) > 0
              const isFinished = m.status === 'finished'

              const home = findTeam(m.home_team)
              const away = findTeam(m.away_team)

              return (
                <div
                  key={pred.id}
                  className={`flex items-center justify-between rounded-xl p-4 border shadow-sm ${
                    isExact ? 'border-pink-900/50 bg-pink-950/20' : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {home.logoUrl ? <img src={home.logoUrl} className="size-5 rounded-full bg-zinc-800 border border-zinc-900" /> : <div className="size-5 rounded-full bg-zinc-800 border border-zinc-900" />}
                        {away.logoUrl ? <img src={away.logoUrl} className="size-5 rounded-full bg-zinc-800 border border-zinc-900" /> : <div className="size-5 rounded-full bg-zinc-800 border border-zinc-900" />}
                      </div>
                      <p className="text-xs font-bold text-white">
                        {home.shortName} <span className="text-zinc-500 font-normal">vs</span> {away.shortName}
                      </p>
                    </div>
                    
                    <div className="mt-2 flex gap-4">
                      <p className="text-[10px] font-medium text-zinc-400">
                        Prono <span className="font-bold text-white">{pred.predicted_home_score}–{pred.predicted_away_score}</span>
                      </p>
                      {isFinished && (
                        <p className="text-[10px] font-medium text-zinc-400">
                          Réel <span className="font-bold text-white">{m.home_score}–{m.away_score}</span>
                        </p>
                      )}
                    </div>
                    {isExact && (
                      <p className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-pink-500">Score exact</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    {isFinished ? (
                      <span className={`text-xl font-bold tabular-nums leading-none ${isWon ? 'text-green-500' : 'text-zinc-600'}`}>
                        {isWon ? `+${pred.points_earned}` : '0'}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* Quick Links */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-3"
        >
          <Link
            href="/ligue"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:bg-zinc-800 shadow-sm"
          >
            Ligue
            <ArrowRight className="size-3 text-zinc-500" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-950/20 border border-red-900/50 py-4 text-[10px] font-bold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-900/30 shadow-sm"
          >
            <LogOut className="size-3" />
            Déconnexion
          </button>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  )
}
