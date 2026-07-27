'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, BarChart3, MessageCircle } from 'lucide-react'

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

  const activeIndex = tabs.findIndex(t => isActive(t.href))

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-6 z-50 px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none"
    >
      <div className="mx-auto max-w-[340px] pointer-events-auto rounded-xl bg-[#161B26]/70 backdrop-blur-md shadow-2xl border border-white/10">
        <ul className="relative flex items-center justify-around px-1 py-1">
          {/* Sliding pill indicator */}
          {activeIndex >= 0 && (
            <li
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-lg bg-white/10 border border-white/10 shadow-sm transition-all duration-300 ease-out"
              style={{
                width: `calc(${100 / tabs.length}% - 4px)`,
                left: `calc(${(activeIndex * 100) / tabs.length}% + 2px)`,
              }}
            />
          )}

          {tabs.map(({ label, icon: Icon, href }) => {
            const active = isActive(href)
            return (
              <li key={label} className="relative flex-1 flex justify-center">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 flex w-full flex-col items-center gap-1 py-2 transition-colors active:scale-90 ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <Icon
                    className={`size-[22px] transition-colors ${active ? 'text-white' : ''}`}
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

