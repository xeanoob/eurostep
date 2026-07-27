'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getUserStats } from '@/lib/leaderboard'
import { getUserPredictions } from '@/lib/predictions'
import { findTeam } from '@/lib/teams'
import { signOut } from '@/lib/auth'
import { ArrowRight, LogOut, Camera, ChevronRight, Loader2, Share2, Flame, Snowflake } from 'lucide-react'
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

export default function ProfilPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useUser()
  const [stats, setStats] = useState({ totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 })
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  
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
      <section id="vip-card" className="relative mx-5 mt-14 rounded-3xl overflow-hidden bg-[#161B26] border border-white/5 shadow-2xl">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-500/10 to-transparent" />
        
        <div className="relative px-6 pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="hide-on-share text-zinc-500 active:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            
            <button onClick={handleShare} disabled={isSharing} className="hide-on-share flex size-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 active:bg-white/10 transition-colors">
              {isSharing ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
            </button>
          </div>

          {/* Avatar + Name + Streak */}
          <div className="flex flex-col items-center mt-2 mb-5">
            <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" ref={fileInputRef} hidden accept="image/*" 
                onChange={handleFileSelect} disabled={isUploadingAvatar}
              />
              {/* Outer ring */}
              <div className={`p-1 rounded-full bg-gradient-to-b shadow-[0_0_20px_rgba(234,88,12,0.15)] ${isHot ? 'from-orange-500/80 to-orange-500/20 shadow-[0_0_25px_rgba(234,88,12,0.4)]' : isCold ? 'from-blue-500/50 to-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.2)]' : 'from-orange-500/50 to-orange-500/10'}`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className={`size-24 rounded-full object-cover border-4 border-[#161B26] ${isUploadingAvatar ? 'opacity-50' : ''}`} />
                ) : (
                  <div className={`flex size-24 items-center justify-center rounded-full bg-zinc-900 border-4 border-[#161B26] text-3xl font-black text-white ${isUploadingAvatar ? 'opacity-50' : ''}`}>
                    {username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              
              {isUploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <Loader2 className="size-5 text-white animate-spin" />
                </div>
              ) : (
                <div className="hide-on-share absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-zinc-800 border-2 border-[#161B26] shadow-lg hover:bg-zinc-700 transition-colors">
                  <Camera className="size-3.5 text-zinc-400" />
                </div>
              )}

              {/* Streak Badge */}
              {isHot && (
                <div className="absolute -left-2 -top-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 border-2 border-[#161B26] shadow-lg animate-bounce">
                  <Flame className="size-4 text-white" />
                </div>
              )}
              {isCold && (
                <div className="absolute -left-2 -top-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 border-2 border-[#161B26] shadow-lg">
                  <Snowflake className="size-4 text-white" />
                </div>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-black text-white flex items-center gap-2">
              {username}
            </h1>
            
            <div className="mt-1 mb-2 flex items-center justify-center">
              <span className="rounded bg-[#0B0E14] border border-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 shadow-inner">
                {playerTitle}
              </span>
            </div>
            
            {/* Rank Progress Bar */}
            <div className="mt-3 w-full max-w-[200px]">
              <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                <span>{pts} pts</span>
                <span>{ptsToNext > 0 ? `${ptsToNext} pts to ${pts >= 100 ? 'All-Star' : pts >= 30 ? 'Starter' : pts >= 10 ? '6th Man' : 'Bench'}` : 'Max Rank'}</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats grid on the card */}
          <div className="grid grid-cols-4 gap-2 pt-5 border-t border-white/5">
            <div className="flex flex-col items-center">
              <p className="text-xl font-black tabular-nums text-white">{stats.totalPoints}</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Points</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-black tabular-nums text-white">{stats.exactScores}</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Exacts</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-black tabular-nums text-white">{stats.successRate}<span className="text-xs text-zinc-500">%</span></p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Réussite</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-black tabular-nums text-white">{stats.totalPredictions}</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Pronos</p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex flex-1 flex-col gap-5 px-5 mt-5">

        {/* ─── NAVIGATION ─── */}
        <section className="rounded-2xl bg-[#161B26] overflow-hidden">
          <Link href="/ligue" className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 active:bg-zinc-800/30">
            <span className="text-sm font-semibold text-white">Ma ligue</span>
            <ChevronRight className="size-4 text-zinc-600" />
          </Link>
          <Link href="/classement" className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 active:bg-zinc-800/30">
            <span className="text-sm font-semibold text-white">Classement</span>
            <ChevronRight className="size-4 text-zinc-600" />
          </Link>
          <Link href="/pronos" className="flex items-center justify-between px-5 py-4 active:bg-zinc-800/30">
            <span className="text-sm font-semibold text-white">Mes pronostics</span>
            <ChevronRight className="size-4 text-zinc-600" />
          </Link>
        </section>

        {/* ─── LAST PREDICTIONS ─── */}
        {predictions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Historique récent</p>
              <Link href="/pronos" className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1">
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
          <section className="rounded-2xl bg-[#161B26] p-8 text-center">
            <p className="text-sm text-zinc-500">Aucun pronostic pour le moment.</p>
            <Link href="/pronos" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-orange-500">
              Pronostiquer <ArrowRight className="size-3.5" />
            </Link>
          </section>
        )}

        {/* ─── SIGN OUT ─── */}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 py-4 text-sm text-red-400 active:text-red-300"
        >
          <LogOut className="size-4" />
          Se déconnecter
        </button>
      </main>

      <BottomNav />
    </div>
  )
}
