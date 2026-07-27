'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useUser } from '@/components/user-provider'
import { createClient } from '@/lib/supabase/client'

function AnimatedHome({ active, className }: { active: boolean, className?: string }) {
  return (
    <motion.svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}
      initial={false}
      animate={active ? { y: [0, -4, 0], scale: [0.9, 1.1, 1] } : { y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </motion.svg>
  )
}

function AnimatedTarget({ active, className }: { active: boolean, className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <motion.circle cx="12" cy="12" r="6" initial={false} animate={active ? { scale: [0, 1.2, 1], opacity: [0, 1] } : { scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ transformOrigin: '12px 12px' }} />
      <motion.circle cx="12" cy="12" r="2" initial={false} animate={active ? { scale: [0, 1.5, 1], opacity: [0, 1] } : { scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ transformOrigin: '12px 12px' }} />
    </svg>
  )
}

function AnimatedBarChart({ active, className }: { active: boolean, className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v18h18" />
      <motion.path d="M8 17V14" initial={false} animate={active ? { pathLength: [0, 1] } : { pathLength: 1 }} transition={{ duration: 0.4, delay: 0.0 }} />
      <motion.path d="M13 17V5" initial={false} animate={active ? { pathLength: [0, 1] } : { pathLength: 1 }} transition={{ duration: 0.4, delay: 0.1 }} />
      <motion.path d="M18 17V9" initial={false} animate={active ? { pathLength: [0, 1] } : { pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} />
    </svg>
  )
}

function AnimatedMessage({ active, className }: { active: boolean, className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <motion.path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" 
        initial={false} 
        animate={active ? { scale: [0.8, 1.1, 1], rotate: [0, -15, 15, -10, 10, 0] } : { scale: 1, rotate: 0 }} 
        transition={{ duration: 0.5 }} 
        style={{ transformOrigin: '12px 12px' }} 
      />
    </svg>
  )
}

const tabs = [
  { 
    label: 'Accueil', 
    icon: AnimatedHome, 
    href: '/',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30'
  },
  { 
    label: 'Pronos', 
    icon: AnimatedTarget, 
    href: '/pronos',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30'
  },
  { 
    label: 'Classement', 
    icon: AnimatedBarChart, 
    href: '/classement',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30'
  },
  { 
    label: 'Vestiaire', 
    icon: AnimatedMessage, 
    href: '/vestiaire',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    badge: 3
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (pathname.startsWith('/vestiaire')) {
      localStorage.setItem('last_visited_vestiaire', new Date().toISOString())
      setUnreadCount(0)
    }
  }, [pathname])

  useEffect(() => {
    if (!user || pathname.startsWith('/vestiaire')) return

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
  }, [user, pathname])

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-6 z-50 px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none"
    >
      <div className="mx-auto max-w-[340px] pointer-events-auto rounded-xl bg-[#161B26]/70 backdrop-blur-md shadow-2xl border border-white/10">
        <ul className="relative flex items-center justify-around px-1 py-1">
          {tabs.map(({ label, icon: Icon, href, color, bgColor, borderColor }) => {
            const active = isActive(href)
            
            // On calcule le badge dynamiquement pour Vestiaire
            const displayBadge = label === 'Vestiaire' && unreadCount > 0 ? unreadCount : null

            return (
              <li key={label} className="relative flex-1 flex justify-center">
                {active && (
                  <motion.div
                    layoutId="active-tab-bubble"
                    className={`absolute inset-0 ${bgColor} ${borderColor} border rounded-lg`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 flex w-full flex-col items-center gap-1 py-2 transition-colors active:scale-90 ${
                    active ? color : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <div className="relative">
                    <Icon active={active} className={active ? color : ""} />
                    {displayBadge && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#161B26]">
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
