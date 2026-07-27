'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {short}
      </span>
      <output
        aria-label={`Score de ${name}`}
        className="font-display text-6xl tabular-nums leading-none"
      >
        {score}
      </output>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, score - 1))}
          aria-label={`Diminuer le score de ${name}`}
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground transition-colors hover:border-primary/50 active:scale-95"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onChange(score + 1)}
          aria-label={`Augmenter le score de ${name}`}
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground transition-colors hover:border-primary/50 active:scale-95"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export function PredictionCard() {
  const [homeScore, setHomeScore] = useState(85)
  const [awayScore, setAwayScore] = useState(80)

  const diff = homeScore - awayScore
  const gapLabel =
    diff === 0
      ? 'Égalité parfaite'
      : diff > 0
        ? `${teams.home.name} +${diff}`
        : `${teams.away.name} +${Math.abs(diff)}`

  return (
    <section aria-label="Pronostic du match" className="px-5">
      {/* Match header strip */}
      <div className="flex items-center justify-between rounded-t-xl bg-primary px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground">
          Betclic Élite
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
          Ce soir · 20h00
        </span>
      </div>

      <div className="rounded-b-xl border border-t-0 border-border bg-card p-5">
        {/* Teams */}
        <div className="flex items-center justify-between">
          <span className="font-display text-xl uppercase tracking-wide">
            {teams.home.name}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            vs
          </span>
          <span className="font-display text-xl uppercase tracking-wide">
            {teams.away.name}
          </span>
        </div>

        {/* Score steppers */}
        <div className="mt-6 flex items-start justify-center">
          <ScoreStepper team="home" score={homeScore} onChange={setHomeScore} />
          <div
            className="mt-9 h-10 w-px shrink-0 bg-border"
            aria-hidden="true"
          />
          <ScoreStepper team="away" score={awayScore} onChange={setAwayScore} />
        </div>

        {/* Dynamic gap badge */}
        <div className="mt-6 flex items-center justify-center gap-2" aria-live="polite">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Écart
          </span>
          <span className="rounded-md bg-primary/12 px-3 py-1 font-display text-sm uppercase tracking-wide text-primary">
            {gapLabel}
          </span>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="mt-6 h-13 w-full rounded-lg font-display text-lg uppercase tracking-wide"
        >
          Valider mon EuroStep
        </Button>
      </div>
    </section>
  )
}
