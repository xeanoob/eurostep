'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, BarChart3, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { label: 'Accueil', icon: Home, href: '/' },
  { label: 'Pronos', icon: Target, href: '/pronos' },
  { label: 'Classement', icon: BarChart3, href: '/classement' },
  { label: 'Vestiaire', icon: MessageCircle, href: '/vestiaire' },
]

export function BottomNav() {
  const pathname = usePathname()

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
          {tabs.map(({ label, icon: Icon, href }) => {
            const active = isActive(href)
            return (
              <li key={label} className="relative flex-1 flex justify-center">
                {active && (
                  <motion.div
                    layoutId="active-tab-bubble"
                    className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 flex w-full flex-col items-center gap-1 py-2 transition-colors active:scale-90 ${
                    active ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {active ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <Icon className="size-[22px] text-primary" strokeWidth={2.5} aria-hidden="true" />
                    </motion.div>
                  ) : (
                    <Icon className="size-[22px]" strokeWidth={2} aria-hidden="true" />
                  )}
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
