'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Désactiver le scroll pendant l'écran de démarrage
    document.body.style.overflow = 'hidden'

    // Joue l'animation pendant 1.5 seconde
    const timer = setTimeout(() => {
      setShow(false)
      document.body.style.overflow = ''
    }, 1800)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#F5F6F8]"
        >
          {/* Logo Container (statique, plus gros) */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative flex w-64 h-auto items-center justify-center">
              <img 
                src="/logo.png" 
                alt="EuroStep Logo" 
                className="w-full h-auto object-contain" 
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
