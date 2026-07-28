'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useUser } from '@/components/user-provider'
import { getUserStats, getLeaderboard } from '@/lib/leaderboard'
import { AnimatedCounter } from '@/components/animated-counter'

export function TopRightProfile() {
  const { user, profile, leagueId } = useUser()

  const { data: stats = { totalPoints: 0, exactScores: 0, totalPredictions: 0, successRate: 0 } } = useSWR(
    user ? `user-stats-${user.id}` : null,
    () => user ? getUserStats(user.id) : null
  )

  const { data: leaderboard = [] } = useSWR(
    leagueId ? `leaderboard-${leagueId}` : null,
    async () => {
      if (!leagueId) return []
      return getLeaderboard(leagueId)
    }
  )

  const userRank = leaderboard.find((e) => e.userId === user?.id)?.rank ?? '—'

  return (
    <div className="flex items-center gap-3">
      {/* Stats pill */}
      <div className="flex items-center gap-1.5 rounded-full bg-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/10 px-3 py-2">
        <span className="text-sm font-black tabular-nums text-blaze">
          #{typeof userRank === 'number' ? userRank : '—'}
        </span>
        <div className="h-3.5 w-px bg-black/10" />
        <span className="text-sm font-bold tabular-nums text-white">
          <AnimatedCounter value={stats?.totalPoints ?? 0} className="text-sm font-bold tabular-nums" />
        </span>
        <span className="text-[9px] text-zinc-400 font-semibold">pts</span>
      </div>

      {/* Avatar */}
      <Link href="/?tab=profil" className="shrink-0 transition-transform active:scale-95">
        {profile?.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt="Profil" 
            className="size-10 rounded-full object-cover ring-2 ring-white shadow-md" 
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blaze to-ruby text-sm font-bold text-white ring-2 ring-white shadow-lg shadow-ruby/20">
            {(profile?.username || 'J')[0]?.toUpperCase()}
          </div>
        )}
      </Link>
    </div>
  )
}
