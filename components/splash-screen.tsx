'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Joue l'animation pendant 1.5 seconde (plus rapide et pro)
    const timer = setTimeout(() => {
      setShow(false)
    }, 1800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0B0E14]"
        >
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex flex-col items-center justify-center"
          >
            <div className="relative flex size-48 items-center justify-center">
              <img 
                src="/logo.png" 
                alt="EuroStep Logo" 
                className="size-full object-contain mix-blend-screen" 
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
