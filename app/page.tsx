'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { BottomNav } from '@/components/bottom-nav'
import { HomeView } from '@/components/views/home-view'
import { PronosView } from '@/components/views/pronos-view'
import { ClassementView } from '@/components/views/classement-view'
import { VestiaireView } from '@/components/views/vestiaire-view'
import { ProfilView } from '@/components/views/profil-view'
import { ParametresView } from '@/components/views/parametres-view'

type Tab = 'home' | 'pronos' | 'classement' | 'vestiaire' | 'profil' | 'parametres'

function MainAppContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const activeTab: Tab = tabParam && ['home', 'pronos', 'classement', 'vestiaire', 'profil', 'parametres'].includes(tabParam) ? tabParam : 'home'
  
  // Keep track of previous tab to know direction (left or right slide)
  const [prevTab, setPrevTab] = useState<Tab>(activeTab)
  
  useEffect(() => {
    setPrevTab(activeTab)
  }, [activeTab])

  const tabs: Tab[] = ['home', 'pronos', 'classement', 'vestiaire', 'profil', 'parametres']
  const currentIndex = tabs.indexOf(activeTab)
  const prevIndex = tabs.indexOf(prevTab)
  const direction = currentIndex > prevIndex ? 1 : -1

  const isEnteringBubble = activeTab === 'profil' || activeTab === 'parametres'
  const isExitingBubble = prevTab === 'profil' || prevTab === 'parametres'

  const customData = { direction, isEnteringBubble, isExitingBubble }

  const variants: any = {
    enter: (custom: any) => {
      if (custom.isEnteringBubble) {
        return {
          opacity: 0,
          scale: 0.8,
          transformOrigin: 'top right'
        }
      }
      if (custom.isExitingBubble) {
        return {
          opacity: 0,
          scale: 0.95,
          x: 0
        }
      }
      return {
        x: custom.direction > 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.95
      }
    },
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transformOrigin: 'top right',
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 35,
        opacity: { duration: 0.25 }
      }
    },
    exit: (custom: any) => {
      if (custom.isExitingBubble) {
        return {
          opacity: 0,
          scale: 0.8,
          transformOrigin: 'top right',
          transition: {
            type: 'spring',
            stiffness: 350,
            damping: 35,
            opacity: { duration: 0.2 }
          }
        }
      }
      if (custom.isEnteringBubble) {
        return {
          opacity: 0,
          scale: 0.95,
          x: 0,
          transition: {
            type: 'spring',
            stiffness: 350,
            damping: 35,
            opacity: { duration: 0.2 }
          }
        }
      }
      return {
        x: custom.direction > 0 ? '-100%' : '100%',
        opacity: 0,
        scale: 0.95,
        transition: {
          type: 'spring',
          stiffness: 350,
          damping: 35,
          opacity: { duration: 0.2 }
        }
      }
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col relative overflow-hidden bg-zinc-950">
      <div 
        className="relative flex-1 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fond.png')" }}
      >
        <AnimatePresence initial={false} custom={customData}>
          <motion.div
            key={activeTab}
            custom={customData}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'pronos' && <PronosView />}
            {activeTab === 'classement' && <ClassementView />}
            {activeTab === 'vestiaire' && <VestiaireView />}
            {activeTab === 'profil' && <ProfilView />}
            {activeTab === 'parametres' && <ParametresView />}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <BottomNav />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div 
        className="min-h-dvh bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('/fond.png')" }} 
      />
    }>
      <MainAppContent />
    </Suspense>
  )
}
