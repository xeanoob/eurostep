'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/components/user-provider'
import { getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, type Message as LeagueMessage } from '@/lib/chat'
import { getFriendsList, sendFriendRequest, acceptFriendRequest, removeFriend, type Friend } from '@/lib/friends'
import { getRecentConversations, type PrivateMessage } from '@/lib/private-chat'
import { getMyChallenges, respondToChallenge, createChallenge, REACTION_EMOJIS, type H2HChallenge } from '@/lib/reactions'
import { getUpcomingMatches } from '@/lib/api/matches'
import { ArrowUp, UserPlus, Users, MessageSquare, Check, X, ShieldAlert, Swords, Flame, Loader2, ChevronRight } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { TopRightProfile } from '@/components/top-right-profile'

type Tab = 'ligue' | 'amis' | 'mp' | 'duels'

export function VestiaireView() {
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

  if (!user && !authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 bg-transparent">
        <p className="text-center text-sm font-semibold text-zinc-400">
          Connecte-toi pour accéder au vestiaire.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full pb-28 text-white selection:bg-blaze/20">
      {/* Header */}
      <header className="px-5 pt-14 pb-2 sticky top-0 z-50 bg-black/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="font-black text-3xl tracking-tighter text-white">
            Vest<span className="text-blaze">iaire</span>
          </h1>
          <TopRightProfile />
        </div>

        <div className="mt-5 flex rounded-[20px] bg-white/5 p-1 backdrop-blur-md border border-white/10 shadow-sm relative">
          <motion.div
            className="absolute top-1 bottom-1 rounded-2xl bg-[#161B26] shadow-md border border-white/10"
            layoutId="vestiaireTabIndicator"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              width: `calc(25% - 0.25rem)`,
              left: `calc(${['ligue', 'duels', 'mp', 'amis'].indexOf(tab) * 25}% + 0.125rem)`,
            }}
          />
          {(['ligue', 'duels', 'mp', 'amis'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative z-10 flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                tab === t ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {t === 'ligue' && 'Ligue'}
              {t === 'duels' && (
                <span className="flex items-center justify-center gap-1">
                  Duels
                  {pendingChallenges.filter(c => c.challenged_id === user?.id).length > 0 && (
                    <span className="size-1.5 rounded-full bg-blaze animate-pulse" />
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
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-2 pb-36 flex flex-col gap-3">
                {authLoading || loadingLeague ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
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
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={msg.id} 
                        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${showSender ? 'mt-4' : 'mt-1'}`}
                      >
                        {showSender && (
                          <p className="mb-1 text-[11px] font-bold tracking-[0.05em] text-zinc-400 ml-1">{senderName}</p>
                        )}
                        <div className={`relative max-w-[80%] px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                            isOwn 
                              ? 'rounded-3xl rounded-br-sm bg-gradient-to-br from-blaze to-ruby text-white shadow-[0_4px_10px_rgba(248,94,0,0.2)]' 
                              : 'rounded-3xl rounded-bl-sm bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-lg'
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
                        <p className={`mt-1 text-[10px] tabular-nums font-semibold text-zinc-400 ${isOwn ? 'pr-0.5' : 'pl-0.5'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </motion.div>
                    )
                  })
                )}
              </div>
              
              {/* League Input */}
              {leagueId && (
                <div className="absolute inset-x-0 bottom-0 z-40 px-4 py-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-10">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendLeague() }} className="flex items-center gap-2 max-w-md mx-auto">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Message à la ligue..."
                      className="flex-1 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/10 px-5 py-3.5 text-sm font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:border-blaze/50 focus:bg-white/15 transition-all shadow-lg"
                    />
                    <button type="submit" disabled={!input.trim()} className="flex size-[50px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-blaze to-ruby text-white shadow-lg shadow-ruby/20 transition-transform active:scale-90 disabled:opacity-50 disabled:grayscale">
                      <ArrowUp className="size-5" strokeWidth={3} />
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
              className="flex flex-1 flex-col absolute inset-0 overflow-y-auto pb-32 px-5 pt-2"
            >
              {/* New Duel Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowNewDuel(!showNewDuel)}
                className="mb-4 w-full rounded-full bg-[#111317] py-3.5 font-bold text-sm uppercase tracking-widest text-white shadow-md flex items-center justify-center gap-2 hover:bg-black transition-colors"
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
                    <div className="rounded-2xl bg-white/10 border border-white/10 p-5 flex flex-col gap-4 shadow-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Choisis ton adversaire</p>
                        <select
                          value={duelFriend}
                          onChange={(e) => setDuelFriend(e.target.value)}
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-black font-semibold"
                        >
                          <option value="">Sélectionner un ami</option>
                          {duelFriendsList.map(f => (
                            <option key={f.user_id} value={f.user_id}>{f.username}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Match</p>
                        <select
                          value={duelMatch}
                          onChange={(e) => setDuelMatch(e.target.value)}
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-black font-semibold"
                        >
                          <option value="">Sélectionner un match</option>
                          {availableMatches.map((m: any) => (
                            <option key={m.id} value={m.id}>
                              {m.home_team} vs {m.away_team}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Mise (points)</p>
                        <div className="flex items-center gap-2">
                          {[3, 5, 10].map(pts => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => setDuelPoints(pts)}
                              className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition-colors ${
                                duelPoints === pts
                                  ? 'bg-[#111317] text-white border-black'
                                  : 'bg-white/10 text-zinc-400 border-white/10 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {pts} pts
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!duelFriend || !duelMatch}
                        className="mt-2 w-full rounded-full bg-blaze py-3.5 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-40 transition-opacity hover:bg-ruby"
                      >
                        Envoyer le défi
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {loadingDuels ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Pending Duels (received) */}
                  {pendingChallenges.filter(c => c.challenged_id === user?.id).length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blaze flex items-center gap-1.5">
                        <Flame className="size-3" /> Défis reçus
                      </p>
                      <div className="flex flex-col gap-3">
                        {pendingChallenges.filter(c => c.challenged_id === user?.id).map(c => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-[24px] bg-gradient-to-br from-[#161B26] to-[#0B0E14] border border-blaze/20 p-5 shadow-2xl relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Swords className="size-24 text-blaze" />
                            </div>
                            <div className="relative z-10 flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-gradient-to-br from-blaze to-ruby p-[2px]">
                                  <div className="size-full rounded-full bg-[#111317] flex items-center justify-center text-lg font-black text-white">
                                    {(((c.challenger as any)?.username) || 'J')[0].toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-widest text-blaze">Défi reçu</p>
                                  <p className="text-lg font-black text-white tracking-tight">{(c.challenger as any)?.username ?? 'Joueur'}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Mise</span>
                                <span className="rounded-lg bg-blaze/10 px-3 py-1 text-sm font-black text-blaze border border-blaze/20 shadow-[0_0_15px_rgba(248,94,0,0.15)]">
                                  {c.points_wagered} pts
                                </span>
                              </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-black/40 border border-white/5 p-3 mb-5 flex items-center justify-center gap-3">
                              <span className="font-bold text-white">{(c.match as any)?.home_team}</span>
                              <span className="text-xs font-black italic text-zinc-500">VS</span>
                              <span className="font-bold text-white">{(c.match as any)?.away_team}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespondDuel(c.id, true)}
                                className="flex-1 rounded-xl bg-[#111317] py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
                              >
                                <Check className="size-4" /> Accepter
                              </button>
                              <button
                                onClick={() => handleRespondDuel(c.id, false)}
                                className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-zinc-400 border border-white/10 flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors"
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
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Défis envoyés</p>
                      <div className="flex flex-col gap-3">
                        {pendingChallenges.filter(c => c.challenger_id === user?.id).map(c => (
                          <div key={c.id} className="rounded-2xl bg-[#161B26] border border-white/5 p-4 shadow-sm relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-sm font-bold text-white">
                                  {(((c.challenged as any)?.username) || 'J')[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">En attente de</p>
                                  <p className="text-sm font-black text-white">{(c.challenged as any)?.username ?? 'Joueur'}</p>
                                </div>
                              </div>
                              <span className="rounded-lg bg-white/5 px-3 py-1 text-xs font-bold text-white border border-white/10">
                                {c.points_wagered} pts
                              </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/5 relative z-10 text-center">
                              <p className="text-[11px] font-medium text-zinc-400">
                                <span className="text-white">{(c.match as any)?.home_team}</span> vs <span className="text-white">{(c.match as any)?.away_team}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Active Duels */}
                  {activeChallenges.length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Duels en cours</p>
                      <div className="flex flex-col gap-3">
                        {activeChallenges.map(c => {
                          const opponent = c.challenger_id === user?.id
                            ? (c.challenged as any)?.username
                            : (c.challenger as any)?.username
                          return (
                            <div key={c.id} className="rounded-[24px] bg-gradient-to-r from-[#161B26] to-[#0B0E14] border border-white/10 p-5 shadow-lg relative overflow-hidden">
                              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                              <div className="relative z-10 flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-12 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center font-black text-white text-lg">
                                    {(opponent || 'J')[0].toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-blaze flex items-center gap-1"><Flame className="size-3" /> Duel actif</p>
                                    <p className="text-lg font-black text-white tracking-tight">{opponent ?? 'Joueur'}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Mise</span>
                                  <span className="rounded-lg bg-blaze/20 px-3 py-1 text-sm font-black text-blaze border border-blaze/30 shadow-sm">
                                    {c.points_wagered} pts
                                  </span>
                                </div>
                              </div>
                              <div className="relative z-10 rounded-xl bg-black/40 border border-white/5 p-3 flex items-center justify-center gap-3">
                                <span className="font-bold text-white">{(c.match as any)?.home_team}</span>
                                <span className="text-xs font-black italic text-zinc-500">VS</span>
                                <span className="font-bold text-white">{(c.match as any)?.away_team}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {challenges.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center">
                      <div className="size-16 rounded-full bg-white/10 shadow-sm border border-white/10 flex items-center justify-center mb-4">
                        <Swords className="size-6 text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-400">Aucun duel en cours.</p>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-2">Lance un défi à un de tes potes !</p>
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
              className="flex flex-1 flex-col absolute inset-0 overflow-y-auto pb-32 px-5 pt-2"
            >
              <form onSubmit={handleAddFriend} className="mb-8 flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ajouter un ami</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    placeholder="Nom d'utilisateur exact" 
                    className="flex-1 rounded-full bg-white/10 border border-white/10 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:border-black shadow-sm placeholder:text-zinc-400 placeholder:font-normal"
                  />
                  <button type="submit" className="rounded-full bg-[#111317] px-5 py-3 text-white shadow-sm transition-transform active:scale-95 hover:bg-black">
                    <UserPlus className="size-4" />
                  </button>
                </div>
                {friendMessage && <p className="text-xs font-bold text-blaze mt-1">{friendMessage}</p>}
              </form>

              {loadingFriends ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {pendingFriends.length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blaze">En attente ({pendingFriends.length})</p>
                      <div className="flex flex-col gap-3">
                        {pendingFriends.map(f => (
                          <div key={f.user_id} className="flex items-center justify-between rounded-2xl bg-white/10 p-3 border border-white/10 shadow-sm">
                            <div className="flex items-center gap-3">
                              {f.avatar_url ? (
                                <img src={f.avatar_url} className="size-11 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="size-11 rounded-full bg-zinc-100 flex items-center justify-center border border-white/10">
                                  <Users className="size-5 text-zinc-400" />
                                </div>
                              )}
                              <p className="text-sm font-bold text-white">{f.username}</p>
                            </div>
                            <div className="flex gap-2">
                              {!f.is_requester && (
                                <button onClick={() => handleAcceptFriend(f.user_id)} className="rounded-full bg-green-50 p-2 text-green-600 border border-green-200 hover:bg-green-100 transition-colors">
                                  <Check className="size-4.5" strokeWidth={2.5} />
                                </button>
                              )}
                              <button onClick={() => handleRemoveFriend(f.user_id)} className="rounded-full bg-white/5 p-2 text-zinc-400 border border-white/10 hover:bg-zinc-100 hover:text-white transition-colors">
                                <X className="size-4.5" strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mes amis ({acceptedFriends.length})</p>
                    {acceptedFriends.length === 0 ? (
                      <p className="text-xs font-medium text-zinc-400">Tu n'as pas encore d'amis ajoutés.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {acceptedFriends.map(f => (
                          <div key={f.user_id} className="group relative flex items-center justify-between rounded-[24px] bg-[#161B26] p-4 border border-white/5 shadow-sm hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                {f.avatar_url ? (
                                  <img src={f.avatar_url} className="size-12 rounded-full object-cover border-2 border-[#111317]" />
                                ) : (
                                  <div className="size-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border-2 border-[#111317] text-lg font-black text-white shadow-inner">
                                    {(f.username || 'J')[0].toUpperCase()}
                                  </div>
                                )}
                                {/* Online indicator dummy */}
                                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-[#161B26]" />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-base font-bold text-white">{f.username}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ami(e)</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/vestiaire/pm/${f.user_id}`} className="flex size-10 items-center justify-center rounded-full bg-blaze text-white shadow-lg hover:bg-ruby transition-colors active:scale-90">
                                <MessageSquare className="size-4" />
                              </Link>
                              <button onClick={() => handleRemoveFriend(f.user_id)} className="flex size-10 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors active:scale-90">
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
              className="flex flex-1 flex-col absolute inset-0 overflow-y-auto pb-32 px-5 pt-2"
            >
              {loadingMP ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <div className="size-16 rounded-full bg-white/10 shadow-sm border border-white/10 flex items-center justify-center mb-4">
                    <MessageSquare className="size-6 text-zinc-300" />
                  </div>
                  <p className="text-sm font-medium text-zinc-400">Aucun message privé.</p>
                  <button onClick={() => setTab('amis')} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white bg-white/10 border border-white/10 shadow-sm px-4 py-2 rounded-full hover:bg-white/5 transition-colors">Aller voir mes amis</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {conversations.map(c => (
                    <Link key={c.friendId} href={`/vestiaire/pm/${c.friendId}`} className="group relative flex items-center gap-4 rounded-[24px] bg-[#161B26] p-4 border border-white/5 shadow-sm hover:border-white/10 transition-colors">
                      <div className="relative">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} className="size-14 rounded-full object-cover border-2 border-[#111317]" />
                        ) : (
                          <div className="size-14 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border-2 border-[#111317] flex items-center justify-center text-xl font-black text-white">
                            {(c.username || 'J')[0].toUpperCase()}
                          </div>
                        )}
                        {/* Status indicator dummy */}
                        <div className="absolute bottom-0 right-0 size-3.5 rounded-full bg-blaze border-2 border-[#161B26]" />
                      </div>
                      
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-base text-white">{c.username}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{formatTime(c.lastMessage.created_at)}</p>
                        </div>
                        <p className="text-xs font-medium text-zinc-400 truncate pr-4">{c.lastMessage.content}</p>
                      </div>
                      
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="size-5 text-zinc-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
