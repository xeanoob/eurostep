'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useUser } from '@/components/user-provider'
import { createClient } from '@/lib/supabase/client'

function AnimatedHome({ active, className }: { active: boolean, className?: string }) {
  return (
    <motion.svg animate={{ scale: active ? [1, 0.85, 1.15, 1] : 1 }} transition={{ duration: 0.3 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </motion.svg>
  )
}

function AnimatedTarget({ active, className }: { active: boolean, className?: string }) {
  return (
    <motion.svg animate={{ scale: active ? [1, 0.85, 1.15, 1] : 1 }} transition={{ duration: 0.3 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </motion.svg>
  )
}

function AnimatedBarChart({ active, className }: { active: boolean, className?: string }) {
  return (
    <motion.svg animate={{ scale: active ? [1, 0.85, 1.15, 1] : 1 }} transition={{ duration: 0.3 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v18h18" />
      <path d="M8 17V14" />
      <path d="M13 17V5" />
      <path d="M18 17V9" />
    </motion.svg>
  )
}

function AnimatedMessage({ active, className }: { active: boolean, className?: string }) {
  return (
    <motion.svg animate={{ scale: active ? [1, 0.85, 1.15, 1] : 1 }} transition={{ duration: 0.3 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </motion.svg>
  )
}

const tabs = [
  { 
    label: 'Accueil', 
    icon: AnimatedHome, 
    id: 'home',
    href: '/?tab=home',
    color: 'text-white',
    bgColor: 'bg-white/10',
    borderColor: 'border-transparent'
  },
  { 
    label: 'Pronos', 
    icon: AnimatedTarget, 
    id: 'pronos',
    href: '/?tab=pronos',
    color: 'text-white',
    bgColor: 'bg-white/10',
    borderColor: 'border-transparent'
  },
  { 
    label: 'Classement', 
    icon: AnimatedBarChart, 
    id: 'classement',
    href: '/?tab=classement',
    color: 'text-white',
    bgColor: 'bg-white/10',
    borderColor: 'border-transparent'
  },
  { 
    label: 'Vestiaire', 
    icon: AnimatedMessage, 
    id: 'vestiaire',
    href: '/?tab=vestiaire',
    color: 'text-white',
    bgColor: 'bg-white/10',
    borderColor: 'border-transparent',
    badge: 3
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTabId = searchParams.get('tab') || 'home'
  
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (activeTabId === 'vestiaire') {
      localStorage.setItem('last_visited_vestiaire', new Date().toISOString())
      setUnreadCount(0)
    }
  }, [activeTabId])

  useEffect(() => {
    if (!user || activeTabId === 'vestiaire') return

    const fetchUnread = async () => {
      const supabase = createClient()
      const lastVisited = localStorage.getItem('last_visited_vestiaire') || new Date(0).toISOString()
      
      const { count } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .gt('created_at', lastVisited)

      setUnreadCount(count || 0)
    }

    fetchUnread()

    const supabase = createClient()
    const channel = supabase.channel('bottom_nav_unread')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, activeTabId])

  function isActive(id: string) {
    if (pathname !== '/') return false // If on another page like /profil, nothing is active in bottom nav
    return activeTabId === id
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-6 z-50 px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none"
    >
      <div className="mx-auto max-w-[340px] pointer-events-auto rounded-[32px] bg-[#111317] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] ring-1 ring-white/5 p-1.5">
        <ul className="relative flex items-center justify-around px-1 py-1">
          {tabs.map(({ label, icon: Icon, id, href, color, bgColor, borderColor }) => {
            const active = isActive(id)
            
            // On calcule le badge dynamiquement pour Vestiaire
            const displayBadge = label === 'Vestiaire' && unreadCount > 0 ? unreadCount : null

            return (
              <li key={label} className="relative flex-1 flex justify-center">
                {active && (
                  <motion.div
                    layoutId="active-tab-bubble"
                    className={`absolute inset-0 ${bgColor} ${borderColor} border rounded-full`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 flex w-full flex-col items-center gap-1 py-2.5 transition-colors active:scale-95 ${
                    active ? color : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <div className="relative">
                    <Icon active={active} className={active ? color : ""} />
                    {displayBadge && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blaze text-[9px] font-bold text-white shadow-sm ring-2 ring-[#161B26]">
                        {displayBadge > 99 ? '99+' : displayBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
