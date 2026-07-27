'use client'

import { useState } from 'react'
import { findTeam, type TeamData } from '@/lib/teams'
import { Clock, Minus, Plus, Users, X } from 'lucide-react'
import Link from 'next/link'
import { generateOdds } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getLeaguePredictions } from '@/lib/predictions'
import { useUser } from '@/components/user-provider'
import { playTick, playSuccess } from '@/lib/sound'
import { AnimatedCounter } from '@/components/animated-counter'

interface MatchHeroCardProps {
  matchId: string
  homeTeamName: string
  awayTeamName: string
  scheduledAt: string
  leagueName: string
  homeOdds?: number | null
  awayOdds?: number | null
  matchStatus?: string
  actualHomeScore?: number | null
  actualAwayScore?: number | null
  existingPrediction?: { home: number; away: number; isBoosted?: boolean } | null
  onSubmit?: (matchId: string, homeScore: number, awayScore: number, isBoosted: boolean) => void
  isSubmitting?: boolean
  hasActiveBoost?: boolean
}

function ScoreStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <output className="font-display text-5xl font-bold tabular-nums leading-none tracking-tight text-white drop-shadow-md">
        {value}
      </output>
      <div className="flex items-center gap-3 mt-1">
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
            playTick()
            onChange(Math.max(0, value - 1))
          }}
          className="flex size-9 items-center justify-center rounded-md bg-zinc-800 text-white transition-colors hover:bg-zinc-700 shadow-sm border border-white/5 active:scale-95"
          aria-label="Diminuer"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
            playTick()
            onChange(value + 1)
          }}
          className="flex size-9 items-center justify-center rounded-md bg-zinc-800 text-white transition-colors hover:bg-zinc-700 shadow-sm border border-white/5 active:scale-95"
          aria-label="Augmenter"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function MatchHeroCard({
  matchId,
  homeTeamName,
  awayTeamName,
  scheduledAt,
  leagueName,
  homeOdds: realHomeOdds,
  awayOdds: realAwayOdds,
  matchStatus,
  actualHomeScore,
  actualAwayScore,
  existingPrediction,
  onSubmit,
  isSubmitting,
  hasActiveBoost = false,
}: MatchHeroCardProps) {
  const { leagueId } = useUser()
  const home = findTeam(homeTeamName)
  const away = findTeam(awayTeamName)

  const [homeScore, setHomeScore] = useState(existingPrediction?.home ?? 85)
  const [awayScore, setAwayScore] = useState(existingPrediction?.away ?? 80)
  const [isBoosted, setIsBoosted] = useState(existingPrediction?.isBoosted ?? false)
  const [submitted, setSubmitted] = useState(!!existingPrediction)
  const [showConfetti, setShowConfetti] = useState(false)

  // Espionnage
  const [showPredictionsModal, setShowPredictionsModal] = useState(false)
  const [leaguePredictions, setLeaguePredictions] = useState<any[]>([])
  const [loadingPredictions, setLoadingPredictions] = useState(false)

  const date = new Date(scheduledAt)
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const dayStr = date.toLocaleDateString('fr-FR', { weekday: 'long' })

  const diff = homeScore - awayScore
  const fallbackOdds = generateOdds(homeTeamName, awayTeamName)
  const homeOdds = realHomeOdds ?? fallbackOdds.home
  const awayOdds = realAwayOdds ?? fallbackOdds.away
  const oddsMultiplier = diff > 0 ? homeOdds : diff < 0 ? awayOdds : 1
  let potentialPoints = Math.round(10 * oddsMultiplier)
  if (isBoosted) potentialPoints *= 2

  function handleSubmit() {
    if (onSubmit) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 50, 20])
      playSuccess()
      onSubmit(matchId, homeScore, awayScore, isBoosted)
      setSubmitted(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }

  async function handleShowPredictions() {
    if (!leagueId) return
    setShowPredictionsModal(true)
    setLoadingPredictions(true)
    const preds = await getLeaguePredictions(leagueId, matchId)
    setLeaguePredictions(preds)
    setLoadingPredictions(false)
  }

  return (
    <div className={`relative mx-auto w-full max-w-md rounded-xl bg-[#161B26] border shadow-xl overflow-hidden transition-all duration-500 ${isBoosted ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'border-slate-800/50'}`}>
      {/* SECTION 1: The Visual Hero */}
      <div className="relative w-full h-48 overflow-hidden rounded-t-xl border-b border-zinc-800" style={{ background: `linear-gradient(135deg, ${home.colors.primary}18 0%, #0B0E14 50%, ${away.colors.primary}18 100%)` }}>
        {/* Dynamic team glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 15% 80%, ${home.colors.primary}30 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, ${away.colors.primary}30 0%, transparent 55%)`
        }} />
        
        {/* Fire overlay if boosted */}
        {isBoosted && (
          <div className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-40 bg-[url('https://www.transparenttextures.com/patterns/fire-pattern.png')]" />
        )}
        {/* Background Logos (The Fade Effect) */}
        {home.logoUrl && (
          <img 
            src={home.logoUrl} 
            alt="" 
            className="absolute -left-10 top-0 h-full opacity-10 mix-blend-screen object-cover select-none"
          />
        )}
        {away.logoUrl && (
          <img 
            src={away.logoUrl} 
            alt="" 
            className="absolute -right-10 top-0 h-full opacity-10 mix-blend-screen object-cover select-none"
          />
        )}

        {/* Players Foreground */}
        {home.starPlayer.imageUrl ? (
          <img 
            src={home.starPlayer.imageUrl} 
            alt={home.starPlayer.name} 
            className="absolute bottom-0 left-2 h-40 object-contain z-10"
          />
        ) : (
          <div className="absolute bottom-0 left-2 h-40 w-32 bg-slate-800/20 rounded-t-full z-10" />
        )}
        {away.starPlayer.imageUrl ? (
          <img 
            src={away.starPlayer.imageUrl} 
            alt={away.starPlayer.name} 
            className="absolute bottom-0 right-2 h-40 object-contain z-10 scale-x-[-1]"
          />
        ) : (
          <div className="absolute bottom-0 right-2 h-40 w-32 bg-slate-800/20 rounded-t-full z-10" />
        )}

        {/* Center Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          {matchStatus === 'live' ? (
            <div className="flex flex-col items-center mt-6">
              <span className="flex items-center gap-1.5 text-xs font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                <span className="size-2 rounded-full bg-red-500" /> LIVE
              </span>
              <div className="flex items-center gap-3 mt-2 font-display text-4xl font-black text-white">
                <motion.span 
                  key={actualHomeScore}
                  initial={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }}
                  animate={{ backgroundColor: 'transparent' }}
                  transition={{ duration: 1 }}
                  className="px-2 rounded"
                >
                  {actualHomeScore ?? 0}
                </motion.span>
                <span className="text-zinc-600 text-2xl">-</span>
                <motion.span 
                  key={actualAwayScore}
                  initial={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }}
                  animate={{ backgroundColor: 'transparent' }}
                  transition={{ duration: 1 }}
                  className="px-2 rounded"
                >
                  {actualAwayScore ?? 0}
                </motion.span>
              </div>
            </div>
          ) : matchStatus === 'finished' ? (
            <div className="flex flex-col items-center mt-6">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Terminé</span>
              <div className="flex items-center gap-3 mt-1 font-display text-3xl font-black text-white">
                <span>{actualHomeScore ?? 0}</span>
                <span className="text-zinc-600">-</span>
                <span>{actualAwayScore ?? 0}</span>
              </div>
            </div>
          ) : (
            <>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{dayStr}</span>
              <span className="text-sm text-white font-bold my-0.5">{dateStr}</span>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{timeStr}</span>
              <span className="mt-2 text-3xl text-white font-black italic drop-shadow-md">Vs</span>
            </>
          )}
        </div>

        {/* Team Names (Bottom Overlapping) */}
        <div className="absolute bottom-2 left-4 z-20">
          <h3 className="text-2xl text-white font-black italic uppercase tracking-tighter w-24">
            {home.shortName}
          </h3>
        </div>
        <div className="absolute bottom-2 right-4 z-20 text-right">
          <h3 className="text-2xl text-white font-black italic uppercase tracking-tighter w-24 text-right">
            {away.shortName}
          </h3>
        </div>
        
        {/* Espionner CTA at top right if needed */}
        {leagueId && (
          <button 
            onClick={handleShowPredictions}
            className="absolute top-3 right-3 z-40 rounded-full bg-black/30 backdrop-blur-md p-2 text-white/70 hover:text-white transition-colors border border-white/10"
          >
            <Users className="size-4" />
          </button>
        )}
      </div>

      {/* SECTION 2: The Prediction Controls */}
      <div className="bg-[#161B26] p-6 rounded-b-xl flex flex-col items-center border border-t-0 border-white/5 shadow-2xl">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Fais ton pronostic
        </p>

        {/* Score Inputs Row */}
        <div className="flex w-full items-start justify-center relative mb-6">
          <div className="flex flex-col items-center w-[120px]">
            <span className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{home.shortName}</span>
            <ScoreStepper value={homeScore} onChange={setHomeScore} />
          </div>
          
          <div className="absolute top-8 bottom-12 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent" />
          
          <div className="flex flex-col items-center w-[120px]">
            <span className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{away.shortName}</span>
            <ScoreStepper value={awayScore} onChange={setAwayScore} />
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-col items-center gap-1.5 mb-6">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock className="size-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Pronostic avant le {dateStr}
            </p>
          </div>

          <div className="flex items-center justify-between w-full mt-4 px-2">
            <div className="flex flex-col items-start">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Gain potentiel
              </p>
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-emerald-400 shadow-sm flex items-center gap-1 mt-1">
                <AnimatedCounter value={potentialPoints} /> PTS {isBoosted && <span className="text-orange-500 ml-1">🔥 x2</span>}
              </span>
            </div>
            
            {/* Boost Toggle */}
            {(!hasActiveBoost || isBoosted) && (
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20)
                  setIsBoosted(!isBoosted)
                }}
                disabled={submitted}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  isBoosted 
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                } ${submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🔥 Boost x2
              </button>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full h-13 rounded-xl py-4 font-display text-lg font-bold uppercase tracking-widest text-white transition-all shadow-[inset_0px_1px_0px_rgba(255,255,255,0.2)] border ${
            submitted 
              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-700 hover:from-emerald-400 hover:to-emerald-500' 
              : 'bg-gradient-to-b from-orange-500 to-orange-600 border-orange-700 hover:from-orange-400 hover:to-orange-500'
          } disabled:opacity-50`}
        >
          {submitted ? '✓ Pronostic Validé' : isSubmitting ? 'Envoi...' : 'Valider mon EuroStep'}
        </motion.button>
      </div>

      {/* Sleek Premium Modal for League Predictions */}
      <AnimatePresence>
        {showPredictionsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPredictionsModal(false)}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] max-h-[85vh] bg-[#161B26] rounded-t-3xl border-t border-slate-800 shadow-2xl flex flex-col mx-auto max-w-md"
            >
              {/* Drag Handle */}
              <div className="flex w-full justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing" onClick={() => setShowPredictionsModal(false)}>
                <div className="h-1.5 w-12 rounded-full bg-slate-700" />
              </div>

              <div className="flex items-center justify-between px-6 pt-2 pb-4">
                <h3 className="font-bold text-lg text-white">
                  Pronos de la Ligue
                </h3>
                <button onClick={() => setShowPredictionsModal(false)} className="rounded-full bg-white/5 p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
                {loadingPredictions ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="size-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  </div>
                ) : leaguePredictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Users className="size-8 text-slate-700 mb-3" />
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 text-center">Aucune prédiction</p>
                  </div>
                ) : (
                  leaguePredictions.map(p => (
                    <Link href={`/profil/${p.userId}`} key={p.userId} className="group relative flex items-center justify-between rounded-xl bg-[#0F131A] p-4 border border-white/5 shadow-sm transition-colors hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center gap-4">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="size-11 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">
                            {p.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <p className="font-bold text-white">{p.username}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-slate-400">{p.points ?? 0} pts gagnés</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-xl bg-black/40 px-3 py-1.5 border border-white/5">
                        <span className="font-bold text-white">{p.homeScore}</span>
                        <span className="text-slate-500 text-xs font-bold">-</span>
                        <span className="font-bold text-white">{p.awayScore}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
