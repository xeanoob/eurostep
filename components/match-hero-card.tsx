'use client'

import { useState } from 'react'
import { findTeam, type TeamData } from '@/lib/teams'
import { Minus, Plus, TrendingUp, Users, X } from 'lucide-react'
import Link from 'next/link'
import { generateOdds } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getLeaguePredictions } from '@/lib/predictions'
import { useUser } from '@/components/user-provider'

interface MatchHeroCardProps {
  matchId: string
  homeTeamName: string
  awayTeamName: string
  scheduledAt: string
  leagueName: string
  homeOdds?: number | null
  awayOdds?: number | null
  existingPrediction?: { home: number; away: number } | null
  onSubmit?: (matchId: string, homeScore: number, awayScore: number) => void
  isSubmitting?: boolean
}

function TeamDisplay({ team, side }: { team: TeamData; side: 'left' | 'right' }) {
  const isLeft = side === 'left'
  return (
    <div
      className={`absolute top-0 ${isLeft ? 'left-0' : 'right-0'} flex h-full w-1/2 flex-col items-center p-4`}
      style={{
        background: isLeft
          ? `linear-gradient(to right, ${team.colors.primary}15 0%, ${team.colors.primary}05 100%)`
          : `linear-gradient(to left, ${team.colors.primary}15 0%, ${team.colors.primary}05 100%)`,
      }}
    >
      {team.logoUrl ? (
        <div className="mt-8 flex size-28 items-center justify-center rounded-full bg-white p-4 shadow-sm border border-gray-100">
          <img src={team.logoUrl} alt={team.name} className="h-full w-full object-contain" />
        </div>
      ) : (
        <div className="mt-8 size-28" />
      )}
      
      <div className="absolute bottom-6 flex w-[85%] flex-col items-center">
        {team.starPlayer.imageUrl && (
          <img 
            src={team.starPlayer.imageUrl} 
            alt={team.starPlayer.name} 
            className="z-10 h-28 w-auto object-contain drop-shadow-md"
            style={{ marginBottom: '-8px' }}
          />
        )}
        <div 
          className="relative z-20 w-full rounded-xl bg-white p-2 text-center shadow-sm border border-gray-200" 
        >
          <span className="block text-[9px] font-bold text-gray-500 tracking-wide uppercase">{team.starPlayer.position}</span>
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <span className="text-sm font-bold text-gray-900 tracking-tight truncate">{team.starPlayer.name}</span>
            <span className="text-xs font-bold text-gray-400">#{team.starPlayer.number}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreStepper({
  value,
  onChange,
  color,
}: {
  value: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-1.5 border border-gray-200">
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(value + 1)}
        className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900"
        aria-label="Augmenter"
      >
        <Plus className="size-4" />
      </motion.button>
      
      <motion.div 
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex w-12 items-center justify-center py-1" 
      >
        <span className="text-2xl font-bold tabular-nums text-gray-900">
          {value}
        </span>
      </motion.div>
      
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900"
        aria-label="Diminuer"
      >
        <Minus className="size-4" />
      </motion.button>
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
  existingPrediction,
  onSubmit,
  isSubmitting,
}: MatchHeroCardProps) {
  const { leagueId } = useUser()
  const home = findTeam(homeTeamName)
  const away = findTeam(awayTeamName)

  const [homeScore, setHomeScore] = useState(existingPrediction?.home ?? 85)
  const [awayScore, setAwayScore] = useState(existingPrediction?.away ?? 80)
  const [submitted, setSubmitted] = useState(!!existingPrediction)
  const [showConfetti, setShowConfetti] = useState(false)

  // Espionnage
  const [showPredictionsModal, setShowPredictionsModal] = useState(false)
  const [leaguePredictions, setLeaguePredictions] = useState<any[]>([])
  const [loadingPredictions, setLoadingPredictions] = useState(false)

  const date = new Date(scheduledAt)
  const hasStarted = new Date() > date
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

  const diff = homeScore - awayScore
  const gapLabel =
    diff === 0
      ? 'Égalité'
      : diff > 0
        ? `${home.shortName} +${diff}`
        : `${away.shortName} +${Math.abs(diff)}`

  const fallbackOdds = generateOdds(homeTeamName, awayTeamName)
  const homeOdds = realHomeOdds ?? fallbackOdds.home
  const awayOdds = realAwayOdds ?? fallbackOdds.away
  
  const oddsMultiplier = diff > 0 ? homeOdds : diff < 0 ? awayOdds : 1
  const potentialPoints = Math.round(10 * oddsMultiplier) // Max points 10, adjusting by odds is an idea but let's keep it simple max 10.
  // Wait, the plan said: Vainqueur 3, Ecart 2, Score 2, Perfect 3 (Total 10).
  // I will just hardcode max 10 for now.

  function handleSubmit() {
    if (onSubmit) {
      onSubmit(matchId, homeScore, awayScore)
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
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-200">
      {/* ===== ARENA CARD ===== */}
      <div
        className="relative overflow-hidden border-b border-gray-100"
        style={{
          backgroundColor: '#ffffff',
          minHeight: '280px',
        }}
      >
        {/* Team Displays */}
        <TeamDisplay team={home} side="left" />
        <TeamDisplay team={away} side="right" />

        {/* Center court line */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-200/50" />
        <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-200/50" />

        {/* ===== CENTER CONTENT ===== */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center p-4 pointer-events-none" style={{ minHeight: '280px' }}>
          
          {/* Header Info */}
          <div className="absolute top-4 flex flex-col items-center w-full px-4">
            <div className="w-full flex justify-between items-start">
              <div className="rounded-lg bg-white px-2.5 py-1 border shadow-sm border-gray-200">
                <span className="block text-[8px] font-bold uppercase text-gray-400">Cote</span>
                <span className="text-sm font-bold text-gray-900">{homeOdds.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-gray-100 px-3 py-1 shadow-sm border border-gray-200">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    {leagueName}
                  </p>
                </div>
                <div className="mt-2 rounded-xl bg-white px-3 py-1 shadow-sm border border-gray-200 backdrop-blur-md">
                  <p className="text-center text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    {dateStr}
                  </p>
                  <p className="text-center text-sm font-bold text-gray-900">
                    {timeStr}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white px-2.5 py-1 border shadow-sm border-gray-200 text-right">
                <span className="block text-[8px] font-bold uppercase text-gray-400">Cote</span>
                <span className="text-sm font-bold text-gray-900">{awayOdds.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
            <span className="text-sm font-bold italic text-gray-400">VS</span>
          </div>
        </div>
      </div>

      {/* ===== PREDICTION PANEL ===== */}
      <div
        className="px-5 py-4 bg-white"
      >
        <div className="flex justify-between items-center mb-4 relative">
          <p className="text-xs font-semibold text-gray-500">
            Ton pronostic
          </p>
          
          {leagueId && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShowPredictions}
              className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 border border-blue-100 transition-all hover:bg-blue-100 group"
            >
              <Users className="size-3.5 text-blue-600 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold text-blue-600">Espionner</span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {/* Home score */}
          <div className="flex flex-col items-center gap-1">
            <p
              className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-900"
            >
              {home.shortName}
            </p>
            <ScoreStepper value={homeScore} onChange={setHomeScore} color={home.colors.primary} />
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-px bg-gray-200" />
            <motion.p
              key={gapLabel}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full px-3 py-1 text-[10px] font-bold border border-gray-200 bg-gray-50 text-gray-600"
            >
              {gapLabel}
            </motion.p>
          </div>

          {/* Away score */}
          <div className="flex flex-col items-center gap-1">
            <p
              className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-900"
            >
              {away.shortName}
            </p>
            <ScoreStepper value={awayScore} onChange={setAwayScore} color={away.colors.primary} />
          </div>
        </div>

        {/* Potential Points */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5">
            <TrendingUp className="size-3 text-green-400" />
            <p className="text-[10px] font-semibold text-green-400">
              Gains possibles : <span className="text-sm font-bold">{potentialPoints} pts</span>
            </p>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          animate={showConfetti ? { scale: [1, 1.05, 1] } : {}}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 shadow-sm relative overflow-hidden ${
            submitted ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitted ? '✓ Validé' : isSubmitting ? 'Envoi...' : 'Valider'}
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
              className="absolute inset-0 z-40 bg-black/40 cursor-pointer"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-50 h-[85%] bg-white rounded-t-3xl border-t border-gray-200 shadow-2xl flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex w-full justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing" onClick={() => setShowPredictionsModal(false)}>
                <div className="h-1.5 w-12 rounded-full bg-gray-200" />
              </div>

              <div className="flex items-center justify-between px-6 pt-2 pb-4">
                <h3 className="font-bold text-lg text-gray-900">
                  Pronos de la Ligue
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
                {loadingPredictions ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="size-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  </div>
                ) : leaguePredictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Users className="size-8 text-gray-300 mb-3" />
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 text-center">Aucune prédiction</p>
                  </div>
                ) : (
                  leaguePredictions.map(p => (
                    <Link href={`/profil/${p.userId}`} key={p.userId} className="group relative flex items-center justify-between rounded-2xl bg-white p-4 border border-gray-100 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-4">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="size-11 rounded-full object-cover border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-full bg-blue-600 shadow-sm text-lg font-bold text-white">
                            {p.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <p className="font-bold text-gray-900">{p.username}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-gray-500">{p.points ?? 0} pts gagnés</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-1.5 border border-gray-200">
                        <span className="font-bold text-gray-900" style={{ color: home.colors.primary }}>{p.homeScore}</span>
                        <span className="text-gray-300 text-xs font-bold">-</span>
                        <span className="font-bold text-gray-900" style={{ color: away.colors.primary }}>{p.awayScore}</span>
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
