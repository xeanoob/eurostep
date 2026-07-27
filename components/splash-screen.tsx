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
            {/* The Logo */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.2 }}
              className="relative mb-6 flex size-32 items-center justify-center rounded-[2rem] shadow-[0_0_60px_rgba(249,115,22,0.25)] overflow-hidden border border-white/5"
            >
              <img src="/logo.png" alt="EuroStep Logo" className="size-full object-cover" />
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
