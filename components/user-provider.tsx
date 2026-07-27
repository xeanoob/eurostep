'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  username: string
  avatar_url: string | null
}

interface UserContextValue {
  user: User | null
  profile: UserProfile | null
  leagueId: string | null
  leagues: { id: string; name: string }[]
  setLeagueId: (id: string | null) => void
  loading: boolean
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  leagueId: null,
  leagues: [],
  setLeagueId: () => {},
  loading: true,
})

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [leagueIdState, setLeagueIdState] = useState<string | null>(null)
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Wrapper pour synchroniser avec le localStorage
  function setLeagueId(id: string | null) {
    setLeagueIdState(id)
    if (id) {
      if (typeof window !== 'undefined') localStorage.setItem('eurostep_league_id', id)
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('eurostep_league_id')
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('eurostep_league_id')
      if (stored) setLeagueIdState(stored)
    }

    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        if (profileData) setProfile(profileData)

        // Get all leagues
        const { data: members } = await supabase
          .from('league_members')
          .select('league_id, leagues(id, name)')
          .eq('user_id', user.id)

        if (members && members.length > 0) {
          const userLeagues = members.map((m: any) => m.leagues).filter(Boolean)
          setLeagues(userLeagues)

          // If no league is selected in state (from localStorage) or the selected one is invalid, 
          // default to the first one
          setLeagueIdState((prev) => {
            if (prev && userLeagues.some((l: any) => l.id === prev)) return prev
            const newId = userLeagues[0].id
            if (typeof window !== 'undefined') localStorage.setItem('eurostep_league_id', newId)
            return newId
          })
        } else {
          setLeagues([])
          setLeagueId(null)
        }
      }

      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          if (profileData) setProfile(profileData)

          // Get all leagues on auth change
          const { data: members } = await supabase
            .from('league_members')
            .select('league_id, leagues(id, name)')
            .eq('user_id', session.user.id)
            
          if (members && members.length > 0) {
            const userLeagues = members.map((m: any) => m.leagues).filter(Boolean)
            setLeagues(userLeagues)
            setLeagueIdState((prev) => {
              if (prev && userLeagues.some((l: any) => l.id === prev)) return prev
              const newId = userLeagues[0].id
              if (typeof window !== 'undefined') localStorage.setItem('eurostep_league_id', newId)
              return newId
            })
          } else {
            setLeagues([])
            setLeagueId(null)
          }
        } else {
          setProfile(null)
          setLeagueId(null)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user, profile, leagueId: leagueIdState, leagues, setLeagueId, loading }}>
      {children}
    </UserContext.Provider>
  )
}
