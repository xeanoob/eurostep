'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/components/user-provider'
import { getUnseenCompletedDuels, markDuelAsSeen } from '@/lib/duels'
import type { H2HChallenge } from '@/lib/reactions'
import { Swords, Trophy, Skull } from 'lucide-react'

export function DuelResolutionModal() {
  const { user } = useUser()
  const [duels, setDuels] = useState<H2HChallenge[]>([])
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0)

  useEffect(() => {
    if (!user) return

    async function load() {
      const unseen = await getUnseenCompletedDuels(user!.id)
      setDuels(unseen)
    }

    load()
  }, [user])

  if (duels.length === 0 || currentDuelIndex >= duels.length) return null

  const duel = duels[currentDuelIndex]
  
  const isChallenger = duel.challenger_id === user!.id
  const opponent = isChallenger ? duel.challenged : duel.challenger
  const isWinner = duel.winner_id === user!.id
  const isTie = duel.winner_id === null

  async function handleDismiss() {
    await markDuelAsSeen(duel.id, user!.id, isChallenger)
    setCurrentDuelIndex(prev => prev + 1)
  }

  return (
    <AnimatePresence>
      <motion.div
        key={duel.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 p-6 backdrop-blur-xl"
      >
        {isWinner && <div className="pointer-events-none absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-color-dodge animate-pulse" />}
        {!isWinner && !isTie && <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black" />}

        <motion.div
          initial={{ y: 50, scale: 0.8 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/10 bg-[#161B26]/80 p-8 text-center shadow-2xl backdrop-blur-md"
        >
          {isWinner ? (
            <Trophy className="mb-4 size-20 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          ) : isTie ? (
            <Swords className="mb-4 size-20 text-slate-500" />
          ) : (
            <Skull className="mb-4 size-20 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          )}

          <h2 className={`font-display text-4xl font-black uppercase tracking-tight ${isWinner ? 'text-yellow-500' : isTie ? 'text-slate-300' : 'text-red-500'}`}>
            {isWinner ? 'Victoire !' : isTie ? 'Égalité' : 'Défaite'}
          </h2>

          <p className="mt-4 text-sm font-medium text-slate-300">
            {isWinner ? (
              <>Tu as écrasé <strong className="text-white">{opponent?.username}</strong> sur le match :</>
            ) : isTie ? (
              <>Pas de vainqueur contre <strong className="text-white">{opponent?.username}</strong> sur le match :</>
            ) : (
              <><strong className="text-white">{opponent?.username}</strong> t'a donné une leçon sur le match :</>
            )}
          </p>

          <div className="my-6 flex flex-col items-center justify-center rounded-xl bg-black/40 p-4 border border-white/5 w-full">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              {duel.match?.home_team} vs {duel.match?.away_team}
            </p>
            <div className="flex items-center gap-3 font-display text-3xl font-black text-white">
              <span>{duel.match?.home_score ?? '-'}</span>
              <span className="text-slate-600">-</span>
              <span>{duel.match?.away_score ?? '-'}</span>
            </div>
          </div>

          {isWinner && duel.points_wagered > 0 && (
            <div className="mb-6 rounded-full bg-emerald-500/20 px-4 py-1.5 border border-emerald-500/30">
              <span className="text-sm font-bold uppercase tracking-widest text-emerald-400">
                +{duel.points_wagered} points bonus
              </span>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className={`w-full rounded-xl py-4 font-display text-lg font-bold uppercase tracking-widest text-white shadow-sm transition-all active:scale-95 ${
              isWinner
                ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 border border-yellow-400/50'
                : 'bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 border border-zinc-600'
            }`}
          >
            {isWinner ? 'Encaisser' : 'Prendre ma revanche'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
