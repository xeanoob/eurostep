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
      <div className="mx-auto max-w-[340px] pointer-events-auto rounded-full bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.05)] border border-gray-200">
        <ul className="flex items-center justify-around px-1 py-1">
          {tabs.map(({ label, icon: Icon, href }) => {
            const active = isActive(href)
            return (
              <li key={label} className="relative flex-1 flex justify-center">
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-blue-50"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 flex w-full flex-col items-center gap-1 py-2 transition-transform active:scale-90 ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <Icon
                    className={`size-[22px] transition-colors ${active ? 'text-blue-600' : ''}`}
                    strokeWidth={active ? 2.5 : 2}
                    aria-hidden="true"
                  />
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
