'use client'

import { useState } from 'react'
import { findTeam, type TeamData } from '@/lib/teams'
import { Clock, Minus, Plus, Users, X, ChevronLeft, ChevronRight } from 'lucide-react'
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

import { useRef } from 'react'

function ScoreStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const startValue = useRef(value)

  return (
    <div className="flex items-center justify-center gap-1 w-full px-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="p-1 text-zinc-300 transition-colors hover:text-white active:scale-90"
        aria-label="Diminuer"
      >
        <ChevronLeft className="size-8" strokeWidth={2.5} />
      </button>

      <motion.div
        className="font-display text-5xl font-black tabular-nums leading-none tracking-tighter text-white h-12 w-16 flex items-center justify-center cursor-ew-resize select-none touch-none"
        onPanStart={() => {
          startValue.current = value
        }}
        onPan={(e, info) => {
          // Adjust sensitivity: 1 point every 4 pixels dragged horizontally
          const diff = Math.round(info.offset.x / 4)
          onChange(Math.max(0, startValue.current + diff))
        }}
      >
        {value}
      </motion.div>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="p-1 text-zinc-300 transition-colors hover:text-white active:scale-90"
        aria-label="Augmenter"
      >
        <ChevronRight className="size-8" strokeWidth={2.5} />
      </button>
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
    <div className={`relative mx-auto w-full max-w-md rounded-[32px] bg-[#111317]/60 backdrop-blur-2xl border shadow-sm overflow-hidden transition-all duration-500 ${isBoosted ? 'border-orange-500 shadow-orange-500/20 shadow-lg' : 'border-white/50'}`}>
      {/* SECTION 1: The Visual Hero */}
      <div className="relative w-full h-[180px] overflow-hidden rounded-t-[32px] border-b border-white/10 bg-transparent">
        {/* Background Logos */}
        {home.logoUrl && (
          <img 
            src={home.logoUrl} 
            alt="" 
            className="absolute -left-12 top-4 h-[280px] w-[280px] opacity-[0.07] object-contain object-left select-none pointer-events-none drop-shadow-sm"
            style={{ WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 100%)', maskImage: 'linear-gradient(to right, black 40%, transparent 100%)' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
        {away.logoUrl && (
          <img 
            src={away.logoUrl} 
            alt="" 
            className="absolute -right-12 top-4 h-[280px] w-[280px] opacity-[0.07] object-contain object-right select-none pointer-events-none drop-shadow-sm"
            style={{ WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 100%)', maskImage: 'linear-gradient(to left, black 40%, transparent 100%)' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}

        {/* Players Foreground */}
        {home.starPlayer.imageUrl ? (
          <img 
            src={home.starPlayer.imageUrl} 
            alt={home.starPlayer.name} 
            className="absolute bottom-0 -left-6 h-full w-auto max-w-[65%] object-contain object-left-bottom z-10 drop-shadow-2xl"
            style={{ WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)', maskImage: 'linear-gradient(to right, black 80%, transparent 100%)' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="absolute bottom-0 left-2 h-64 w-48 bg-black/5 rounded-t-full z-10" />
        )}
        {away.starPlayer.imageUrl ? (
          <img 
            src={away.starPlayer.imageUrl} 
            alt={away.starPlayer.name} 
            className="absolute bottom-0 -right-6 h-full w-auto max-w-[65%] object-contain object-right-bottom z-10 scale-x-[-1] drop-shadow-2xl"
            style={{ WebkitMaskImage: 'linear-gradient(to left, black 80%, transparent 100%)', maskImage: 'linear-gradient(to left, black 80%, transparent 100%)' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="absolute bottom-0 right-2 h-64 w-48 bg-black/5 rounded-t-full z-10" />
        )}

        {/* Center Info */}

        <div className="absolute inset-0 flex flex-col items-center justify-start z-20 pointer-events-none pt-4">
          {matchStatus === 'live' ? (
            <div className="flex flex-col items-center mt-2">
              <span className="flex items-center gap-2 text-sm font-black text-red-500 uppercase tracking-[0.2em] bg-red-50 px-3 py-1 rounded-full border border-red-500/20 animate-pulse shadow-sm">
                <span className="size-2.5 rounded-full bg-red-500" /> LIVE
              </span>
              <div className="flex items-center gap-4 mt-3 font-display text-5xl font-black text-white">
                <motion.span 
                  key={actualHomeScore}
                  initial={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                  animate={{ backgroundColor: 'transparent' }}
                  transition={{ duration: 1 }}
                  className="px-2 rounded"
                >
                  {actualHomeScore ?? 0}
                </motion.span>
                <span className="text-zinc-300 text-3xl">-</span>
                <motion.span 
                  key={actualAwayScore}
                  initial={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                  animate={{ backgroundColor: 'transparent' }}
                  transition={{ duration: 1 }}
                  className="px-2 rounded"
                >
                  {actualAwayScore ?? 0}
                </motion.span>
              </div>
            </div>
          ) : matchStatus === 'finished' ? (
            <div className="flex flex-col items-center mt-2">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/10">Terminé</span>
              <div className="flex items-center gap-4 mt-3 font-display text-4xl font-black text-white">
                <span>{actualHomeScore ?? 0}</span>
                <span className="text-zinc-300">-</span>
                <span>{actualAwayScore ?? 0}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center mt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">{dayStr}</span>
                <span className="text-[10px] text-zinc-300 font-bold">•</span>
                <span className="text-[10px] text-white font-black uppercase tracking-[0.1em]">{dateStr}</span>
              </div>
              <span className="font-display text-3xl font-black tracking-tight text-white drop-shadow-sm">{timeStr}</span>
            </div>
          )}
        </div>

        {/* Team Names (Bottom Overlapping) */}
        <div className="absolute bottom-4 left-4 z-20">
          <h3 className="text-3xl text-white font-black uppercase tracking-tighter w-24 leading-[0.85] font-helvetica italic">
            {home.shortName}
          </h3>
        </div>
        <div className="absolute bottom-4 right-4 z-20 text-right flex justify-end">
          <h3 className="text-3xl text-white font-black uppercase tracking-tighter w-24 leading-[0.85] text-right font-helvetica italic">
            {away.shortName}
          </h3>
        </div>
        
        {/* Espionner CTA at top right if needed */}
        {leagueId && (
          <button 
            onClick={handleShowPredictions}
            className="absolute top-3 right-3 z-40 rounded-full bg-white/10 shadow-sm p-2 text-zinc-400 hover:text-white transition-colors border border-white/10"
          >
            <Users className="size-4" />
          </button>
        )}
      </div>

      {/* SECTION 2: The Prediction Controls */}
      <div className="bg-transparent p-5 rounded-b-[32px] flex flex-col items-center">
        {/* Score Inputs Row */}
        <div className="flex w-full items-center justify-between relative mb-4 gap-2">
          <div className="flex flex-col items-center w-full max-w-[150px]">
            <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{home.shortName}</span>
            <ScoreStepper value={homeScore} onChange={setHomeScore} />
          </div>
          
          <div className="absolute top-6 bottom-4 left-1/2 w-px -translate-x-1/2 bg-black/5" />
          
          <div className="flex flex-col items-center w-full max-w-[150px]">
            <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{away.shortName}</span>
            <ScoreStepper value={awayScore} onChange={setAwayScore} />
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-col items-center w-full mb-4">
          <div className="flex items-center gap-2 text-zinc-400 mb-4">
            <Clock className="size-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Avant le {dateStr}
            </p>
          </div>

          <div className="flex items-center justify-between w-full border-t border-white/10 pt-4">
            <div className="flex flex-col items-start">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
                Gain potentiel
              </p>
              <span className="font-display text-2xl font-black uppercase tracking-wide text-white flex items-center gap-1.5">
                <AnimatedCounter value={potentialPoints} /> PTS 
                {isBoosted && <span className="text-blaze text-xs tracking-normal flex items-center gap-0.5 bg-blaze/10 px-1.5 py-0.5 rounded uppercase font-bold"><span className="text-sm">🔥</span> x2</span>}
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
                className={`flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                  isBoosted 
                    ? 'text-blaze' 
                    : 'text-zinc-400 hover:text-white'
                } ${submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`text-lg transition-transform ${isBoosted ? 'scale-110' : 'grayscale opacity-50'}`}>🔥</span>
                Boost
              </button>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.button
              key="submit-btn"
              type="button"
              initial={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-[52px] mt-2 rounded-xl font-bold text-xs uppercase tracking-[0.2em] text-[#111317] transition-all shadow-sm bg-white hover:bg-zinc-200 disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? 'Envoi...' : 'Valider mon prono'}
            </motion.button>
          ) : (
            <motion.button
              key="success-btn"
              type="button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              disabled
              className="w-full h-[52px] mt-2 rounded-xl font-bold text-xs uppercase tracking-[0.2em] text-white transition-all shadow-sm bg-emerald-500"
            >
              ✅ Pronostic Validé
            </motion.button>
          )}
        </AnimatePresence>
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
              className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] max-h-[85vh] bg-white/10 rounded-t-[32px] border-t border-white/10 shadow-2xl flex flex-col mx-auto max-w-md"
            >
              {/* Drag Handle */}
              <div className="flex w-full justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing" onClick={() => setShowPredictionsModal(false)}>
                <div className="h-1.5 w-12 rounded-full bg-zinc-200" />
              </div>

              <div className="flex items-center justify-between px-6 pt-2 pb-4">
                <h3 className="font-bold text-lg text-white">
                  Pronos de la Ligue
                </h3>
                <button onClick={() => setShowPredictionsModal(false)} className="rounded-full bg-zinc-100 p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
                {loadingPredictions ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="size-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                  </div>
                ) : leaguePredictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Users className="size-8 text-zinc-200 mb-3" />
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 text-center">Aucune prédiction</p>
                  </div>
                ) : (
                  leaguePredictions.map(p => (
                    <Link href={`/profil/${p.userId}`} key={p.userId} className="group relative flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10 shadow-sm transition-colors hover:bg-zinc-100 cursor-pointer">
                      <div className="flex items-center gap-4">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="size-11 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-600">
                            {p.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <p className="font-bold text-white">{p.username}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{p.points ?? 0} pts gagnés</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 border border-white/10 shadow-sm">
                        <span className="font-black text-white tabular-nums font-display">{p.homeScore}</span>
                        <span className="text-zinc-300 text-xs font-bold">-</span>
                        <span className="font-black text-white tabular-nums font-display">{p.awayScore}</span>
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
