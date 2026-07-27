'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Check if we've already shown the splash screen in this session
    const hasSeenSplash = sessionStorage.getItem('eurostep_splash_seen')
    
    if (hasSeenSplash) {
      setShow(false)
      return
    }

    // Play splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('eurostep_splash_seen', 'true')
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0B0E14]"
        >
          {/* Background subtle effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent opacity-50" />

          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 }}
            className="relative flex flex-col items-center justify-center"
          >
            {/* The ball / Icon */}
            <motion.div
              initial={{ y: -50, opacity: 0, rotate: -180 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.4 }}
              className="relative mb-6 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_40px_rgba(249,115,22,0.4)]"
            >
              <div className="absolute inset-0 rounded-full border-[3px] border-black/20 mix-blend-overlay" />
              {/* Simple basketball lines approximation */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                 <div className="absolute top-1/2 left-0 right-0 h-px bg-black/30" />
                 <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/30" />
                 <div className="absolute -left-4 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border-r-[2px] border-black/30" />
                 <div className="absolute -right-4 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border-l-[2px] border-black/30" />
              </div>
            </motion.div>

            {/* Text Logo */}
            <motion.h1 
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="font-display text-5xl font-black tracking-tighter text-white"
            >
              Euro<span className="text-orange-500">Step</span>
            </motion.h1>

            {/* Slogan */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-zinc-500"
            >
              Pronostics entre potes
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
