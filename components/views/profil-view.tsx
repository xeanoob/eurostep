'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/user-provider'
import { getUserStats } from '@/lib/leaderboard'
import { getUserPredictions } from '@/lib/predictions'
import { findTeam } from '@/lib/teams'
import { signOut } from '@/lib/auth'
import { ArrowRight, LogOut, Camera, ChevronRight, Loader2, Share2, Flame, Snowflake, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import html2canvas from 'html2canvas'
import { triggerExactScoreConfetti } from '@/lib/confetti'

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

export function ProfilView() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useUser()
  const [stats, setStats] = useState({ totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 })
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isEditingPseudo, setIsEditingPseudo] = useState(false)
  const [newPseudo, setNewPseudo] = useState('')
  const [isSavingPseudo, setIsSavingPseudo] = useState(false)
  
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

  useEffect(() => {
    if (predictions.some((p) => (p.points_earned ?? 0) >= 10)) {
      triggerExactScoreConfetti()
    }
  }, [predictions])

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

  async function handleShare() {
    const card = document.getElementById('vip-card')
    if (!card) return
    
    setIsSharing(true)
    try {
      // Temporarily hide the back/share buttons for a clean screenshot
      const buttons = card.querySelectorAll('.hide-on-share')
      buttons.forEach(b => (b as HTMLElement).style.opacity = '0')

      const canvas = await html2canvas(card, { 
        backgroundColor: '#0B0E14',
        scale: 2 // High res
      })
      
      buttons.forEach(b => (b as HTMLElement).style.opacity = '1')

      const dataUrl = canvas.toDataURL('image/png')
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'eurostep-card.png', { type: 'image/png' })
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mon VIP Pass EuroStep',
          files: [file]
        })
      } else {
        const link = document.createElement('a')
        link.download = 'eurostep-vip-pass.png'
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors du partage.")
    } finally {
      setIsSharing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center">
        <Loader2 className="size-6 text-zinc-500 animate-spin" />
      </div>
    )
  }

  const handleUpdatePseudo = async () => {
    if (!user || !newPseudo.trim()) return
    setIsSavingPseudo(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ username: newPseudo.trim() }).eq('id', user.id)
    setIsSavingPseudo(false)
    if (error) {
      alert("Erreur lors de la modification du pseudo")
    } else {
      setIsEditingPseudo(false)
      window.location.reload()
    }
  }

  const username = profile?.username ?? 'Joueur'
  const avatarUrl = profile?.avatar_url

  // ─── RANKS & PROGRESS ───
  const pts = stats.totalPoints
  let playerTitle = 'Rookie'
  let nextRankPts = 10
  let currentRankMin = 0
  
  if (pts >= 200) { playerTitle = 'All-Star'; currentRankMin = 200; nextRankPts = 200 } // Max rank
  else if (pts >= 100) { playerTitle = 'Starter'; currentRankMin = 100; nextRankPts = 200 }
  else if (pts >= 30) { playerTitle = '6th Man'; currentRankMin = 30; nextRankPts = 100 }
  else if (pts >= 10) { playerTitle = 'Bench Player'; currentRankMin = 10; nextRankPts = 30 }

  const progressPct = pts >= 200 ? 100 : ((pts - currentRankMin) / (nextRankPts - currentRankMin)) * 100
  const ptsToNext = pts >= 200 ? 0 : nextRankPts - pts

  // ─── HOT/COLD STREAK ───
  const finishedPreds = predictions.filter(p => p.matches.status === 'finished')
  const recent3 = finishedPreds.slice(0, 3)
  
  let isHot = false
  let isCold = false
  if (recent3.length === 3) {
    isHot = recent3.every(p => p.points_earned && p.points_earned > 0)
    isCold = recent3.every(p => !p.points_earned || p.points_earned === 0)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col pb-28 text-zinc-100">

      {/* ─── VIP PLAYER CARD ─── */}
      <section id="vip-card" className="relative mx-5 mt-14 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl pb-6">
        {/* Colorful Abstract Background */}
        <div className="absolute inset-0 z-0 bg-[#161B26]" />
        <div className="absolute inset-0 z-0 opacity-80" style={{
          backgroundImage: `
            radial-gradient(circle at 15% 10%, #FFB563 0%, transparent 40%),
            radial-gradient(circle at 85% 20%, #8b5cf6 0%, transparent 45%),
            radial-gradient(circle at 50% 60%, #ec4899 0%, transparent 50%),
            linear-gradient(to bottom, transparent 30%, #161B26 90%)
          `
        }} />
        
        {/* Top actions */}
        <div className="relative z-10 flex items-center justify-end gap-2 px-6 pt-6">
          <button onClick={handleShare} disabled={isSharing} className="hide-on-share flex size-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white active:bg-white/20 transition-colors border border-white/10">
            {isSharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
          </button>
          <Link href="/?tab=parametres" className="flex size-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white active:bg-white/20 transition-colors border border-white/10">
            <Settings className="size-4" />
          </Link>
        </div>

        <div className="relative z-10 px-6 pt-2 flex flex-col items-center text-center">
          {/* Avatar */}
          <label className="relative inline-block cursor-pointer mb-4">
            <input 
              type="file" hidden accept="image/*" 
              onChange={handleFileSelect} disabled={isUploadingAvatar}
            />
            <div className="relative p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className={`size-20 rounded-full object-cover ${isUploadingAvatar ? 'opacity-50' : ''}`} />
              ) : (
                <div className={`flex size-20 items-center justify-center rounded-full bg-zinc-800 text-3xl font-black text-white ${isUploadingAvatar ? 'opacity-50' : ''}`}>
                  {username[0]?.toUpperCase()}
                </div>
              )}
              
              {/* Status Indicator (Hot/Cold) */}
              {(isHot || isCold) && (
                <div className={`absolute bottom-1 right-1 flex size-6 items-center justify-center rounded-full border-2 border-[#161B26] shadow-sm ${isHot ? 'bg-green-500' : 'bg-blue-500'}`}>
                  {isHot ? <Flame className="size-3 text-white" /> : <Snowflake className="size-3 text-white" />}
                </div>
              )}
            </div>
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <Loader2 className="size-5 text-white animate-spin" />
              </div>
            )}
          </label>

          {/* Name & Title */}
          <div className="flex flex-col items-center justify-center mb-1">
            <h1 className="text-3xl font-black text-white font-helvetica italic tracking-tight">
              {username}
            </h1>
          </div>
          <p className="text-sm font-semibold text-white/60 mb-5">
            {playerTitle}
          </p>

          {/* Progress Bar */}
          <div className="w-full mb-8 mt-2 px-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-white/60 mb-1.5 uppercase tracking-widest">
              <span>Progression</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="w-full flex items-center justify-between mb-8 px-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame className="size-4 text-white" />
                <span className="text-xl font-black text-white tabular-nums">{stats.totalPoints}</span>
              </div>
              <span className="text-[10px] font-semibold text-white/60">Points</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span className="text-xl font-black text-white tabular-nums">{stats.exactScores}</span>
              </div>
              <span className="text-[10px] font-semibold text-white/60">Scores Exacts</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xl font-black text-white tabular-nums">{stats.successRate}%</span>
              </div>
              <span className="text-[10px] font-semibold text-white/60">Réussite</span>
            </div>
          </div>
        </div>
      </section>

      <main className="flex flex-1 flex-col gap-5 px-5 mt-5">

        {/* ─── NAVIGATION ─── */}
        <section className="rounded-2xl bg-[#161B26]/80 backdrop-blur-md border border-white/5 overflow-hidden">
          <Link href="/ligue" className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 active:bg-zinc-800/30 transition-colors">
            <span className="text-sm font-semibold text-white">Ma ligue</span>
            <ChevronRight className="size-4 text-zinc-600" />
          </Link>
          <Link href="/?tab=classement" className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 active:bg-zinc-800/30 transition-colors">
            <span className="text-sm font-semibold text-white">Classement</span>
            <ChevronRight className="size-4 text-zinc-600" />
          </Link>
          <Link href="/?tab=pronos" className="flex items-center justify-between px-5 py-4 active:bg-zinc-800/30 transition-colors">
            <span className="text-sm font-semibold text-white">Mes pronostics</span>
            <ChevronRight className="size-4 text-zinc-600" />
          </Link>
        </section>

        {/* (Paramètres ont été déplacés sur /parametres) */}

        {/* ─── LAST PREDICTIONS ─── */}
        {predictions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Historique récent</p>
              <Link href="/?tab=pronos" className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1">
                Tout voir <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="rounded-2xl bg-[#161B26] overflow-hidden">
              {predictions.slice(0, 6).map((pred, i) => {
                const m = pred.matches
                const isExact = pred.points_earned === 10
                const isWon = (pred.points_earned ?? 0) > 0
                const isFinished = m.status === 'finished'
                const home = findTeam(m.home_team)
                const away = findTeam(m.away_team)

                return (
                  <div
                    key={pred.id}
                    className={`flex items-center justify-between px-5 py-3.5 ${i < Math.min(predictions.length, 6) - 1 ? 'border-b border-zinc-800/60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {home.logoUrl ? (
                          <img src={home.logoUrl} className="size-7 rounded-full bg-zinc-900 p-0.5 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-7 rounded-full" style={{ backgroundColor: home.colors.primary }} />
                        )}
                        {away.logoUrl ? (
                          <img src={away.logoUrl} className="size-7 rounded-full bg-zinc-900 p-0.5 object-contain" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="size-7 rounded-full" style={{ backgroundColor: away.colors.primary }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {home.shortName} <span className="text-zinc-600 text-xs">-</span> {away.shortName}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {pred.predicted_home_score}–{pred.predicted_away_score}
                          {isFinished && <span className="text-zinc-600"> → {m.home_score}–{m.away_score}</span>}
                          {isExact && <span className="text-orange-500 font-bold ml-1">· exact</span>}
                        </p>
                      </div>
                    </div>

                    {isFinished ? (
                      <span className={`text-sm font-black tabular-nums ${isWon ? 'text-green-500' : 'text-zinc-600'}`}>
                        {isWon ? `+${pred.points_earned}` : '0'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-zinc-500 italic">en attente</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {predictions.length === 0 && (
          <section className="rounded-2xl bg-[#161B26]/80 backdrop-blur-md border border-white/5 p-8 text-center">
            <p className="text-sm text-zinc-500">Aucun pronostic pour le moment.</p>
            <Link href="/?tab=pronos" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-orange-500">
              Pronostiquer <ArrowRight className="size-3.5" />
            </Link>
          </section>
        )}

      </main>
    </div>
  )
}
