'use client'

import { useState } from 'react'
import { Minus, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type TeamKey = 'home' | 'away'

const teams: Record<TeamKey, { name: string; short: string }> = {
  home: { name: 'ASVEL', short: 'ASV' },
  away: { name: 'AS Monaco', short: 'MON' },
}

function ScoreStepper({
  team,
  score,
  onChange,
}: {
  team: TeamKey
  score: number
  onChange: (value: number) => void
}) {
  const { name, short } = teams[team]
  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        {short}
      </span>
      <output
        aria-label={`Score de ${name}`}
        className="font-display text-5xl font-bold tabular-nums leading-none tracking-tight text-white drop-shadow-md"
      >
        {score}
      </output>
      <div className="flex items-center gap-3 mt-1">
        <motion.button
          type="button"
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(Math.max(0, score - 1))}
          aria-label={`Diminuer le score de ${name}`}
          className="flex size-9 items-center justify-center rounded-md bg-zinc-800 text-white transition-colors shadow-sm border border-white/5"
        >
          <Minus className="size-4" aria-hidden="true" />
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(score + 1)}
          aria-label={`Augmenter le score de ${name}`}
          className="flex size-9 items-center justify-center rounded-md bg-zinc-800 text-white transition-colors shadow-sm border border-white/5"
        >
          <Plus className="size-4" aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  )
}

export function PredictionCard() {
  const [homeScore, setHomeScore] = useState(85)
  const [awayScore, setAwayScore] = useState(80)
  const [submitted, setSubmitted] = useState(false)

  const diff = homeScore - awayScore
  const gapLabel =
    diff === 0
      ? 'Égalité parfaite'
      : diff > 0
        ? `${teams.home.name} +${diff}`
        : `${teams.away.name} +${Math.abs(diff)}`

  function handleSubmit() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 50, 20])
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  return (
    <section aria-label="Pronostic du match" className="px-5">
      {/* Match header strip */}
      <div className="flex items-center justify-between rounded-t-xl bg-[#0B0E14] border border-white/5 px-4 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Betclic Élite
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Ce soir · 20h00
        </span>
      </div>

      <div className="rounded-b-xl border border-t-0 border-white/5 bg-[#161B26] p-6 shadow-2xl">
        <h3 className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-5">
          Fais ton pronostic
        </h3>
        
        {/* Teams */}
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-bold uppercase tracking-wide text-white">
            {teams.home.name}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            vs
          </span>
          <span className="font-display text-xl font-bold uppercase tracking-wide text-white">
            {teams.away.name}
          </span>
        </div>

        {/* Score steppers */}
        <div className="mt-6 flex items-start justify-center relative">
          <ScoreStepper team="home" score={homeScore} onChange={setHomeScore} />
          
          {/* Subtle separator */}
          <div
            className="absolute top-4 bottom-12 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent"
            aria-hidden="true"
          />
          
          <ScoreStepper team="away" score={awayScore} onChange={setAwayScore} />
        </div>

        {/* Dynamic gap badge */}
        <div className="mt-7 flex flex-col items-center justify-center gap-1.5" aria-live="polite">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Gain Potentiel
          </span>
          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-emerald-400 shadow-sm">
            {gapLabel === 'Égalité parfaite' ? 'Égalité' : gapLabel} · 10 PTS
          </span>
        </div>

        {/* CTA */}
        <motion.button
          type="button"
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className={`mt-6 h-13 w-full rounded-xl py-4 font-display text-lg font-bold uppercase tracking-widest text-white transition-all shadow-[inset_0px_1px_0px_rgba(255,255,255,0.2)] border ${
            submitted
              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-700'
              : 'bg-gradient-to-b from-orange-500 to-orange-600 border-orange-700 hover:from-orange-400 hover:to-orange-500'
          }`}
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.span
                key="submitted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Check className="size-5" strokeWidth={3} />
                </motion.span>
                Pronostic Validé
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Valider mon EuroStep
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </section>
  )
}

