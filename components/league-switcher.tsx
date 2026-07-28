'use client'

import { useUser } from '@/components/user-provider'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function LeagueSwitcher() {
  const { leagues, leagueId, setLeagueId } = useUser()
  const [open, setOpen] = useState(false)

  if (leagues.length <= 1) {
    return (
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
        {leagueId ? 'Journée en cours' : 'Bienvenue'}
      </p>
    )
  }

  const currentLeague = leagues.find(l => l.id === leagueId)

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:opacity-80 transition-opacity"
      >
        {currentLeague?.name || 'Sélectionner une ligue'}
        <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-white/10 border border-white/10 shadow-xl overflow-hidden"
          >
            {leagues.map((l) => (
               <button
                 key={l.id}
                 onClick={() => {
                   setLeagueId(l.id)
                   setOpen(false)
                 }}
                 className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-white/5 transition-colors ${
                   l.id === leagueId ? 'text-blaze' : 'text-white'
                 }`}
               >
                 {l.name}
               </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
