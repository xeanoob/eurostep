'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const players = [
  {
    rank: 2,
    name: 'Sarah',
    points: 118,
    avatar: '/avatars/sarah.png',
    size: 'size-14',
    barHeight: 'h-16',
  },
  {
    rank: 1,
    name: 'Léo',
    points: 125,
    avatar: '/avatars/leo.png',
    size: 'size-20',
    barHeight: 'h-24',
  },
  {
    rank: 3,
    name: 'Max',
    points: 112,
    avatar: '/avatars/max.png',
    size: 'size-14',
    barHeight: 'h-10',
  },
]

// Animation order: 2nd place (0.1s), 3rd place (0.3s), 1st place (0.55s)
const animDelay: Record<number, number> = { 2: 0.1, 3: 0.3, 1: 0.55 }

export function LeaguePodium() {
  return (
    <section aria-label="Classement de la Ligue des Potes" className="px-5">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-lg uppercase tracking-wide">
          La Ligue des Potes
        </h2>
        <a
          href="#"
          className="text-xs font-semibold uppercase tracking-widest text-primary"
        >
          Voir tout
        </a>
      </div>

      <ol className="flex items-end justify-center gap-4">
        {players.map((player) => (
          <motion.li
            key={player.rank}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: animDelay[player.rank],
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            className="flex flex-col items-center gap-2"
            style={{ order: player.rank === 1 ? 1 : player.rank === 2 ? 0 : 2 }}
          >
            {/* Avatar */}
            <div className="relative">
              <div
                className={`${player.size} relative overflow-hidden rounded-full ${
                  player.rank === 1
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'ring-1 ring-border'
                }`}
              >
                <Image
                  src={player.avatar || '/placeholder.svg'}
                  alt={`Avatar de ${player.name}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span
                className={`absolute -bottom-1.5 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full font-display text-xs ${
                  player.rank === 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground ring-1 ring-border'
                }`}
              >
                {player.rank}
              </span>
            </div>

            {/* Name & Points */}
            <div className="flex flex-col items-center pt-2">
              <span className="text-sm font-semibold">{player.name}</span>
              <span
                className={`font-display text-base tabular-nums ${
                  player.rank === 1 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {player.points}
                <span className="ml-1 text-[10px] uppercase tracking-widest">pts</span>
              </span>
            </div>

            {/* Podium Bar */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                delay: animDelay[player.rank] + 0.15,
                type: 'spring',
                stiffness: 300,
                damping: 22,
              }}
              className={`w-20 ${player.barHeight} origin-bottom rounded-t-lg ${
                player.rank === 1
                  ? 'bg-gradient-to-t from-orange-600/60 to-orange-400/20 border border-orange-500/20'
                  : 'bg-gradient-to-t from-zinc-800/60 to-zinc-700/10 border border-white/5'
              }`}
            />
          </motion.li>
        ))}
      </ol>
    </section>
  )
}

