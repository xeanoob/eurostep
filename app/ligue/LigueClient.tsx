'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { createLeague, joinLeague, getUserLeagues, leaveLeague } from '@/lib/leagues'
import { getUser } from '@/lib/auth'
import { Copy, Check, LogOut } from 'lucide-react'

import { useUser } from '@/components/user-provider'

interface League {
  id: string
  name: string
  code: string
  created_by: string
}

export default function LigueClient() {
  const router = useRouter()
  const { leagueId, setLeagueId } = useUser()
  const [userId, setUserId] = useState<string | null>(null)
  const [leagues, setLeagues] = useState<League[]>([])
  const [tab, setTab] = useState<'list' | 'create' | 'join'>('list')
  const [leagueName, setLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const user = await getUser()
      if (!user) return
      setUserId(user.id)
      const userLeagues = await getUserLeagues(user.id)
      setLeagues(userLeagues as unknown as League[])
    }
    init()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !leagueName.trim()) return
    setLoading(true)
    setError('')

    const { league, error } = await createLeague(leagueName.trim(), userId)
    if (error || !league) {
      setError(typeof error === 'string' ? error : 'Erreur lors de la création')
      setLoading(false)
      return
    }

    setLeagues((prev) => [...prev, league as League])
    setSuccess(`Ligue créée ! Code : ${league.code}`)
    setLeagueName('')
    setLeagueId(league.id)
    setTab('list')
    setLoading(false)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !joinCode.trim()) return
    setLoading(true)
    setError('')

    const { league, error } = await joinLeague(joinCode.trim(), userId)
    if (error) {
      setError(typeof error === 'string' ? error : 'Erreur')
      setLoading(false)
      return
    }

    if (league) {
      setLeagues((prev) => [...prev, league as unknown as League])
      setLeagueId(league.id)
    }
    setSuccess('Tu as rejoint la ligue !')
    setJoinCode('')
    setTab('list')
    setLoading(false)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function handleLeave(idToLeave: string) {
    if (!userId || !confirm('Es-tu sûr de vouloir quitter cette ligue ?')) return
    setLoading(true)
    
    const { error } = await leaveLeague(idToLeave, userId)
    if (error) {
      setError('Erreur lors du départ de la ligue')
      setLoading(false)
      return
    }

    const updatedLeagues = leagues.filter((l) => l.id !== idToLeave)
    setLeagues(updatedLeagues)

    if (leagueId === idToLeave) {
      setLeagueId(updatedLeagues.length > 0 ? updatedLeagues[0].id : null)
    }

    setSuccess('Tu as quitté la ligue.')
    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-background">
      <header className="px-6 pt-14 pb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Tes ligues
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.9] tracking-tight">
          Li<span className="text-primary">gue</span>
        </h1>
      </header>

      <main className="flex flex-1 flex-col pb-28">
        <div className="flex border-t border-b border-border">
          {(['list', 'create', 'join'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); setSuccess('') }}
              className={`flex-1 py-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                tab === t ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {t === 'list' ? 'Mes ligues' : t === 'create' ? 'Créer' : 'Rejoindre'}
            </button>
          ))}
        </div>

        {error && (
          <p className="px-6 pt-4 text-sm text-red-400">{error}</p>
        )}
        {success && (
          <p className="px-6 pt-4 text-sm text-emerald-400">{success}</p>
        )}

        {tab === 'list' && (
          <div>
            {leagues.length === 0 ? (
              <p className="px-6 pt-8 text-sm text-muted-foreground">
                Tu n'es dans aucune ligue. Crée-en une ou rejoins avec un code.
              </p>
            ) : (
              leagues.map((league) => {
                const isActive = league.id === leagueId
                return (
                  <div
                    key={league.id}
                    className={`flex items-center justify-between border-b px-6 py-4 transition-colors ${
                      isActive ? 'border-primary/50 bg-primary/5' : 'border-border/50'
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setLeagueId(league.id)}
                    >
                      <p className={`text-sm font-semibold ${isActive ? 'text-primary' : ''}`}>
                        {league.name} {isActive && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">(Active)</span>}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        Code : {league.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => copyCode(league.code)}
                        className="text-muted-foreground transition-colors hover:text-foreground p-2"
                        aria-label="Copier le code"
                      >
                        {copiedCode === league.code ? (
                          <Check className="size-4 text-emerald-400" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLeave(league.id)}
                        className="text-muted-foreground transition-colors hover:text-red-500 p-2"
                        aria-label="Quitter la ligue"
                        disabled={loading}
                      >
                        <LogOut className="size-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 'create' && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4 px-6 pt-6">
            <div>
              <label
                htmlFor="league-name"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
              >
                Nom de la ligue
              </label>
              <input
                id="league-name"
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                required
                className="w-full border-b border-border bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                placeholder="La Ligue des Potes"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary py-3 font-display text-base uppercase tracking-wide text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la ligue'}
            </button>
          </form>
        )}

        {tab === 'join' && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4 px-6 pt-6">
            <div>
              <label
                htmlFor="join-code"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
              >
                Code d'invitation
              </label>
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                className="w-full border-b border-border bg-transparent py-2.5 text-center font-display text-2xl uppercase tracking-[0.3em] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                placeholder="ABC123"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary py-3 font-display text-base uppercase tracking-wide text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Rejoindre'}
            </button>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
