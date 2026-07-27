'use client'

import { useEffect, useRef, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, type Message as LeagueMessage } from '@/lib/chat'
import { getFriendsList, sendFriendRequest, acceptFriendRequest, removeFriend, type Friend } from '@/lib/friends'
import { getRecentConversations, type PrivateMessage } from '@/lib/private-chat'
import { getMyChallenges, respondToChallenge, createChallenge, REACTION_EMOJIS, type H2HChallenge } from '@/lib/reactions'
import { getUpcomingMatches } from '@/lib/api/matches'
import { ArrowUp, UserPlus, Users, MessageSquare, Check, X, ShieldAlert, Swords, Flame, Loader2 } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type Tab = 'ligue' | 'amis' | 'mp' | 'duels'

export default function VestiairePage() {
  const { user, profile, leagueId, loading: authLoading } = useUser()
  const [tab, setTab] = useState<Tab>('ligue')
  
  // League Chat State
  const [messages, setMessages] = useState<LeagueMessage[]>([])
  const [input, setInput] = useState('')
  const [loadingLeague, setLoadingLeague] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Friends State
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendInput, setFriendInput] = useState('')
  const [friendMessage, setFriendMessage] = useState('')
  const [loadingFriends, setLoadingFriends] = useState(true)

  // MP State
  const [conversations, setConversations] = useState<any[]>([])
  const [loadingMP, setLoadingMP] = useState(true)

  // Duels State
  const [challenges, setChallenges] = useState<H2HChallenge[]>([])
  const [loadingDuels, setLoadingDuels] = useState(true)
  const [showNewDuel, setShowNewDuel] = useState(false)
  const [duelFriend, setDuelFriend] = useState('')
  const [duelMatch, setDuelMatch] = useState('')
  const [duelPoints, setDuelPoints] = useState(5)
  const [availableMatches, setAvailableMatches] = useState<any[]>([])
  const [duelFriendsList, setDuelFriendsList] = useState<Friend[]>([])

  // 1. League Chat Effect
  useEffect(() => {
    if (tab !== 'ligue') return
    if (authLoading || !leagueId) {
      setLoadingLeague(false)
      return
    }

    async function load() {
      const msgs = await getMessages(leagueId!)
      setMessages(msgs)
      setLoadingLeague(false)
    }
    load()

    channelRef.current = subscribeToMessages(leagueId, (newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    })

    return () => {
      if (channelRef.current) unsubscribeFromMessages(channelRef.current)
    }
  }, [tab, leagueId, authLoading])

  useEffect(() => {
    if (tab === 'ligue') {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, tab])

  // 2. Friends Effect
  useEffect(() => {
    if (tab !== 'amis' || !user) return
    async function load() {
      const list = await getFriendsList(user!.id)
      setFriends(list)
      setLoadingFriends(false)
    }
    load()
  }, [tab, user])

  // 3. MP Effect
  useEffect(() => {
    if (tab !== 'mp' || !user) return
    async function load() {
      const convos = await getRecentConversations(user!.id)
      setConversations(convos)
      setLoadingMP(false)
    }
    load()
  }, [tab, user])

  // 4. Duels Effect
  useEffect(() => {
    if (tab !== 'duels' || !user) return
    async function load() {
      const [c, matches, friendsList] = await Promise.all([
        getMyChallenges(user!.id),
        getUpcomingMatches(),
        getFriendsList(user!.id),
      ])
      setChallenges(c)
      setAvailableMatches(matches)
      setDuelFriendsList(friendsList.filter(f => f.status === 'accepted'))
      setLoadingDuels(false)
    }
    load()
  }, [tab, user])

  // League Chat Actions
  async function handleSendLeague() {
    const text = input.trim()
    if (!text || !user || !leagueId) return
    setInput('')

    const optimistic: LeagueMessage = {
      id: `temp-${Date.now()}`,
      league_id: leagueId,
      user_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      profiles: { username: profile?.username ?? 'Toi' },
    }
    setMessages((prev) => [...prev, optimistic])
    const { data } = await sendMessage(leagueId, user.id, text)
    if (data) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)))
    }
  }

  // Friends Actions
  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !friendInput.trim()) return
    const { error } = await sendFriendRequest(user.id, friendInput.trim())
    if (error) {
      setFriendMessage(error)
    } else {
      setFriendMessage('Demande envoyée !')
      setFriendInput('')
      const list = await getFriendsList(user.id)
      setFriends(list)
    }
    setTimeout(() => setFriendMessage(''), 3000)
  }

  async function handleAcceptFriend(friendId: string) {
    if (!user) return
    await acceptFriendRequest(user.id, friendId)
    const list = await getFriendsList(user.id)
    setFriends(list)
  }

  async function handleRemoveFriend(friendId: string) {
    if (!user) return
    if (!confirm('Sûr de vouloir le supprimer ?')) return
    await removeFriend(user.id, friendId)
    const list = await getFriendsList(user.id)
    setFriends(list)
  }

  // Duel Actions
  async function handleCreateDuel(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !duelFriend || !duelMatch) return
    await createChallenge(duelMatch, user.id, duelFriend, duelPoints)
    setShowNewDuel(false)
    setDuelFriend('')
    setDuelMatch('')
    setDuelPoints(5)
    const c = await getMyChallenges(user.id)
    setChallenges(c)
  }

  async function handleRespondDuel(challengeId: string, accept: boolean) {
    await respondToChallenge(challengeId, accept)
    if (user) {
      const c = await getMyChallenges(user.id)
      setChallenges(c)
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const pendingFriends = friends.filter(f => f.status === 'pending')

  const pendingChallenges = challenges.filter(c => c.status === 'pending')
  const activeChallenges = challenges.filter(c => c.status === 'accepted')

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="px-6 pt-14 pb-4">
        <h1 className="font-bold text-3xl tracking-tight text-white">
          Vest<span className="text-orange-500">iaire</span>
        </h1>

        <div className="mt-6 flex border-b border-zinc-800">
          {(['ligue', 'duels', 'mp', 'amis'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-widest transition-colors relative ${
                tab === t ? 'border-b-2 border-orange-500 text-orange-500' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {t === 'ligue' && 'Ligue'}
              {t === 'duels' && (
                <span className="flex items-center justify-center gap-1">
                  Duels
                  {pendingChallenges.filter(c => c.challenged_id === user?.id).length > 0 && (
                    <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </span>
              )}
              {t === 'mp' && 'Messages'}
              {t === 'amis' && 'Amis'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {tab === 'ligue' && (
            <motion.div
              key="ligue"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-1 flex-col absolute inset-0"
            >
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pt-2 pb-36 flex flex-col gap-3">
                {authLoading || loadingLeague ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : !leagueId ? (
                  <p className="py-12 text-center text-sm text-zinc-400">Rejoins une ligue pour accéder au vestiaire.</p>
                ) : messages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-zinc-400">Aucun message. Lance la conversation !</p>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.user_id === user?.id
                    const senderName = msg.profiles?.username ?? 'Joueur'
                    const showSender = !isOwn && (i === 0 || messages[i - 1].user_id !== msg.user_id || messages[i - 1].user_id === user?.id)

                    return (
                      <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${showSender ? 'mt-3' : ''}`}>
                        {showSender && (
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">{senderName}</p>
                        )}
                        <div className={`max-w-[78%] px-3.5 py-2.5 text-[15px] leading-snug shadow-sm border ${
                            isOwn ? 'rounded-2xl rounded-br-sm bg-orange-500 text-white border-orange-600' : 'rounded-2xl rounded-bl-sm bg-zinc-900 text-zinc-100 border-zinc-800'
                          }`}>
                          {msg.content}
                        </div>
                        {/* Quick Reaction Bar for other users' messages */}
                        {!isOwn && (
                          <div className="flex gap-1 mt-1 ml-1">
                            {REACTION_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                className="text-xs opacity-0 group-hover:opacity-100 hover:opacity-100 hover:scale-125 transition-all px-0.5"
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                        <p className={`mt-1 text-[10px] tabular-nums text-zinc-500 ${isOwn ? 'pr-0.5' : 'pl-0.5'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
              
              {/* League Input */}
              {leagueId && (
                <div className="absolute inset-x-0 bottom-[95px] z-40 bg-zinc-950 px-4 py-3 border-t border-zinc-800 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendLeague() }} className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Chambre tes potes de ligue..."
                      className="flex-1 rounded-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                    <button type="submit" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-transform active:scale-90">
                      <ArrowUp className="size-4" strokeWidth={2.5} />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'duels' && (
            <motion.div
              key="duels"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-1 flex-col absolute inset-0 overflow-y-auto pb-32 px-6 pt-2"
            >
              {/* New Duel Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowNewDuel(!showNewDuel)}
                className="mb-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-bold text-sm uppercase tracking-widest text-white shadow-lg border border-orange-700 flex items-center justify-center gap-2"
              >
                <Swords className="size-4" />
                Lancer un Duel
              </motion.button>

              {/* New Duel Form */}
              <AnimatePresence>
                {showNewDuel && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                    onSubmit={handleCreateDuel}
                  >
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Choisis ton adversaire</p>
                      <select
                        value={duelFriend}
                        onChange={(e) => setDuelFriend(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Sélectionner un ami</option>
                        {duelFriendsList.map(f => (
                          <option key={f.user_id} value={f.user_id}>{f.username}</option>
                        ))}
                      </select>

                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Match</p>
                      <select
                        value={duelMatch}
                        onChange={(e) => setDuelMatch(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Sélectionner un match</option>
                        {availableMatches.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.home_team} vs {m.away_team}
                          </option>
                        ))}
                      </select>

                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mise (points)</p>
                      <div className="flex items-center gap-3">
                        {[3, 5, 10].map(pts => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setDuelPoints(pts)}
                            className={`flex-1 rounded-lg py-2 text-sm font-bold border transition-colors ${
                              duelPoints === pts
                                ? 'bg-orange-500 text-white border-orange-600'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {pts} pts
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={!duelFriend || !duelMatch}
                        className="mt-2 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-40 transition-opacity"
                      >
                        Envoyer le défi
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {loadingDuels ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Pending Duels (received) */}
                  {pendingChallenges.filter(c => c.challenged_id === user?.id).length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1.5">
                        <Flame className="size-3" /> Défis reçus
                      </p>
                      <div className="flex flex-col gap-2">
                        {pendingChallenges.filter(c => c.challenged_id === user?.id).map(c => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl bg-zinc-900 border border-orange-500/20 p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-bold text-white">
                                {(c.challenger as any)?.username ?? 'Joueur'} te défie !
                              </p>
                              <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-400 border border-orange-500/20">
                                {c.points_wagered} pts
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mb-3">
                              {(c.match as any)?.home_team} vs {(c.match as any)?.away_team}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespondDuel(c.id, true)}
                                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-bold text-white flex items-center justify-center gap-1.5"
                              >
                                <Check className="size-4" /> Accepter
                              </button>
                              <button
                                onClick={() => handleRespondDuel(c.id, false)}
                                className="flex-1 rounded-lg bg-zinc-800 py-2 text-sm font-bold text-zinc-400 border border-zinc-700 flex items-center justify-center gap-1.5"
                              >
                                <X className="size-4" /> Refuser
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Pending Duels (sent) */}
                  {pendingChallenges.filter(c => c.challenger_id === user?.id).length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Défis envoyés</p>
                      <div className="flex flex-col gap-2">
                        {pendingChallenges.filter(c => c.challenger_id === user?.id).map(c => (
                          <div key={c.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 shadow-sm opacity-70">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-white">
                                → {(c.challenged as any)?.username ?? 'Joueur'}
                              </p>
                              <span className="text-xs text-zinc-500">En attente...</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                              {(c.match as any)?.home_team} vs {(c.match as any)?.away_team} · {c.points_wagered} pts
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Active Duels */}
                  {activeChallenges.length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Duels en cours</p>
                      <div className="flex flex-col gap-2">
                        {activeChallenges.map(c => {
                          const opponent = c.challenger_id === user?.id
                            ? (c.challenged as any)?.username
                            : (c.challenger as any)?.username
                          return (
                            <div key={c.id} className="rounded-xl bg-zinc-900 border border-green-500/20 p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <Swords className="size-3.5 text-green-400" />
                                  vs {opponent ?? 'Joueur'}
                                </p>
                                <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-400 border border-green-500/20">
                                  {c.points_wagered} pts en jeu
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 mt-1">
                                {(c.match as any)?.home_team} vs {(c.match as any)?.away_team}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {challenges.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center">
                      <Swords className="size-8 text-zinc-700 mb-3" />
                      <p className="text-sm text-zinc-400">Aucun duel en cours.</p>
                      <p className="text-xs text-zinc-500 mt-1">Lance un défi à un de tes potes !</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'amis' && (
            <motion.div
              key="amis"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-1 flex-col absolute inset-0 overflow-y-auto pb-32 px-6 pt-2"
            >
              <form onSubmit={handleAddFriend} className="mb-6 flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ajouter un ami</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    placeholder="Nom d'utilisateur exact" 
                    className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 shadow-sm placeholder:text-zinc-500"
                  />
                  <button type="submit" className="rounded-xl bg-orange-500 px-4 py-2 text-white shadow-sm transition-transform active:scale-95">
                    <UserPlus className="size-4" />
                  </button>
                </div>
                {friendMessage && <p className="text-xs text-orange-500">{friendMessage}</p>}
              </form>

              {loadingFriends ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {pendingFriends.length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-500">En attente ({pendingFriends.length})</p>
                      <div className="flex flex-col gap-2">
                        {pendingFriends.map(f => (
                          <div key={f.user_id} className="flex items-center justify-between rounded-xl bg-zinc-900 p-3 border border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3">
                              {f.avatar_url ? (
                                <img src={f.avatar_url} className="size-10 rounded-full object-cover border border-zinc-800" />
                              ) : (
                                <div className="size-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                  <Users className="size-4 text-zinc-500" />
                                </div>
                              )}
                              <p className="text-sm font-bold text-white">{f.username}</p>
                            </div>
                            <div className="flex gap-2">
                              {!f.is_requester && (
                                <button onClick={() => handleAcceptFriend(f.user_id)} className="rounded-full bg-green-900/30 p-2 text-green-500 border border-green-800/50 hover:bg-green-900/50">
                                  <Check className="size-4" />
                                </button>
                              )}
                              <button onClick={() => handleRemoveFriend(f.user_id)} className="rounded-full bg-red-900/30 p-2 text-red-500 border border-red-800/50 hover:bg-red-900/50">
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mes amis ({acceptedFriends.length})</p>
                    {acceptedFriends.length === 0 ? (
                      <p className="text-xs text-zinc-400">Tu n'as pas encore d'amis ajoutés.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {acceptedFriends.map(f => (
                          <div key={f.user_id} className="flex items-center justify-between rounded-xl bg-zinc-900 p-3 border border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3">
                              {f.avatar_url ? (
                                <img src={f.avatar_url} className="size-10 rounded-full object-cover border border-zinc-800" />
                              ) : (
                                <div className="size-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                  <Users className="size-4 text-zinc-500" />
                                </div>
                              )}
                              <p className="text-sm font-bold text-white">{f.username}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/vestiaire/pm/${f.user_id}`} className="rounded-full bg-orange-500/20 p-2 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30">
                                <MessageSquare className="size-4" />
                              </Link>
                              <button onClick={() => handleRemoveFriend(f.user_id)} className="rounded-full bg-zinc-800 p-2 text-zinc-400 border border-zinc-700 hover:text-red-400 hover:border-red-900 hover:bg-red-900/30">
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'mp' && (
            <motion.div
              key="mp"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-1 flex-col absolute inset-0 overflow-y-auto pb-32 px-6 pt-2"
            >
              {loadingMP ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <ShieldAlert className="size-8 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-400">Aucun message privé.</p>
                  <button onClick={() => setTab('amis')} className="mt-4 text-xs font-bold uppercase tracking-widest text-orange-500 hover:underline">Aller voir mes amis</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {conversations.map(c => (
                    <Link key={c.friendId} href={`/vestiaire/pm/${c.friendId}`} className="flex items-center gap-4 rounded-2xl bg-zinc-900 p-4 border border-zinc-800 hover:bg-zinc-800 transition-colors shadow-sm">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} className="size-12 rounded-full object-cover border border-zinc-700" />
                      ) : (
                        <div className="size-12 rounded-full bg-zinc-800 border border-zinc-700 flex shrink-0 items-center justify-center">
                          <Users className="size-5 text-zinc-500" />
                        </div>
                      )}
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-sm text-white">{c.username}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">{formatTime(c.lastMessage.created_at)}</p>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{c.lastMessage.content}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}

