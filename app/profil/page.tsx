'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getUserStats } from '@/lib/leaderboard'
import { getUserPredictions } from '@/lib/predictions'
import { findTeam } from '@/lib/teams'
import { signOut } from '@/lib/auth'
import { ArrowRight, LogOut, Camera, Trophy, Target, TrendingUp, CalendarDays } from 'lucide-react'
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
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [avatarUrlInput, setAvatarUrlInput] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

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

  async function handleSaveAvatar() {
    if (!user) return
    setLoading(true)
    const supabase = createClient()

    let newAvatarUrl = avatarUrlInput

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile)

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        alert("Erreur lors du téléchargement de l'image. Avez-vous bien créé le bucket public 'avatars' avec les bonnes permissions ?")
        setLoading(false)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      newAvatarUrl = data.publicUrl
    }

    await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id)
    window.location.reload()
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center bg-gray-50">
        <div className="size-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  const username = profile?.username ?? 'Joueur'
  const avatarUrl = profile?.avatar_url

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-gray-50 pb-24 text-gray-900">
      {/* Background Effect */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-blue-50 to-transparent" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center px-6 pt-14 pb-8"
      >
        <div className="relative">
          {avatarFile ? (
            <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="size-24 rounded-full object-cover shadow-md border-4 border-white" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt={username} className="size-24 rounded-full object-cover shadow-md border-4 border-white" />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white shadow-md border-4 border-white">
              {username[0]?.toUpperCase()}
            </div>
          )}
          <button 
            onClick={() => {
              setAvatarUrlInput(avatarUrl || '')
              setIsEditingAvatar(!isEditingAvatar)
            }}
            className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2 text-white shadow-md border-2 border-white transition-transform hover:scale-105"
          >
            <Camera className="size-4" />
          </button>
        </div>

        {isEditingAvatar && (
          <div className="mt-6 flex w-full flex-col gap-3 rounded-2xl bg-white p-4 border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nouvelle photo</p>
            <input 
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setAvatarFile(e.target.files[0])
                }
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => {
                  setIsEditingAvatar(false)
                  setAvatarFile(null)
                }}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:bg-gray-200"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveAvatar}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">{username}</h1>
        <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
          Membre EuroStep
        </p>
      </motion.header>

      <main className="relative z-10 flex flex-1 flex-col gap-8 px-6 pb-28">
        {/* Stats Glassmorphism */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between rounded-2xl bg-white p-5 border border-gray-200 shadow-sm"
        >
          <div className="flex flex-col items-center">
            <Trophy className="mb-2 size-4 text-yellow-500" />
            <p className="text-3xl font-bold tabular-nums leading-none text-gray-900">{stats.totalPoints}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">Points</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="flex flex-col items-center">
            <Target className="mb-2 size-4 text-pink-500" />
            <p className="text-3xl font-bold tabular-nums leading-none text-gray-900">{stats.exactScores}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">Exacts</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="flex flex-col items-center">
            <TrendingUp className="mb-2 size-4 text-blue-500" />
            <p className="text-3xl font-bold tabular-nums leading-none text-gray-900">
              {stats.successRate}<span className="text-lg text-gray-400">%</span>
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">Réussite</p>
          </div>
        </motion.section>

        {/* Predictions history */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
            <CalendarDays className="size-3" /> Derniers pronostics
          </p>

          {predictions.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">
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
                    isExact ? 'border-pink-200 bg-pink-50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {home.logoUrl ? <img src={home.logoUrl} className="size-5 rounded-full bg-gray-50 border border-white" /> : <div className="size-5 rounded-full bg-gray-100 border border-white" />}
                        {away.logoUrl ? <img src={away.logoUrl} className="size-5 rounded-full bg-gray-50 border border-white" /> : <div className="size-5 rounded-full bg-gray-100 border border-white" />}
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {home.shortName} <span className="text-gray-400 font-normal">vs</span> {away.shortName}
                      </p>
                    </div>
                    
                    <div className="mt-2 flex gap-4">
                      <p className="text-[10px] font-medium text-gray-500">
                        Prono <span className="font-bold text-gray-900">{pred.predicted_home_score}–{pred.predicted_away_score}</span>
                      </p>
                      {isFinished && (
                        <p className="text-[10px] font-medium text-gray-500">
                          Réel <span className="font-bold text-gray-900">{m.home_score}–{m.away_score}</span>
                        </p>
                      )}
                    </div>
                    {isExact && (
                      <p className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-pink-600">Score exact</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    {isFinished ? (
                      <span className={`text-xl font-bold tabular-nums leading-none ${isWon ? 'text-green-600' : 'text-gray-300'}`}>
                        {isWon ? `+${pred.points_earned}` : '0'}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">
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
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
          >
            Ligue
            <ArrowRight className="size-3 text-gray-400" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-100 py-4 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-100 shadow-sm"
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
