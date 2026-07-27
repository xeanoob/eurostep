'use client'

import { useEffect, useRef, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { useUser } from '@/components/user-provider'
import { getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, type Message as LeagueMessage } from '@/lib/chat'
import { getFriendsList, sendFriendRequest, acceptFriendRequest, removeFriend, type Friend } from '@/lib/friends'
import { getRecentConversations, type PrivateMessage } from '@/lib/private-chat'
import { ArrowUp, UserPlus, Users, MessageSquare, Check, X, ShieldAlert } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type Tab = 'ligue' | 'amis' | 'mp'

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
      // Refresh list
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

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const pendingFriends = friends.filter(f => f.status === 'pending')

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="px-6 pt-14 pb-4">
        <h1 className="font-bold text-3xl tracking-tight text-gray-900">
          Vest<span className="text-blue-600">iaire</span>
        </h1>

        <div className="mt-6 flex border-b border-gray-200">
          {(['ligue', 'mp', 'amis'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t === 'ligue' && 'Ligue'}
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
                  <p className="py-12 text-center text-sm text-gray-400 animate-pulse">Chargement...</p>
                ) : !leagueId ? (
                  <p className="py-12 text-center text-sm text-gray-500">Rejoins une ligue pour accéder au vestiaire.</p>
                ) : messages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-500">Aucun message. Lance la conversation !</p>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.user_id === user?.id
                    const senderName = msg.profiles?.username ?? 'Joueur'
                    const showSender = !isOwn && (i === 0 || messages[i - 1].user_id !== msg.user_id || messages[i - 1].user_id === user?.id)

                    return (
                      <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${showSender ? 'mt-3' : ''}`}>
                        {showSender && (
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-gray-500">{senderName}</p>
                        )}
                        <div className={`max-w-[78%] px-3.5 py-2.5 text-[15px] leading-snug shadow-sm border ${
                            isOwn ? 'rounded-2xl rounded-br-sm bg-blue-600 text-white border-blue-700' : 'rounded-2xl rounded-bl-sm bg-white text-gray-900 border-gray-200'
                          }`}>
                          {msg.content}
                        </div>
                        <p className={`mt-1 text-[10px] tabular-nums text-gray-400 ${isOwn ? 'pr-0.5' : 'pl-0.5'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
              
              {/* League Input */}
              {leagueId && (
                <div className="absolute inset-x-0 bottom-[95px] z-40 bg-gray-50 px-4 py-3 border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendLeague() }} className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Chambre tes potes de ligue..."
                      className="flex-1 rounded-full bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 shadow-sm"
                    />
                    <button type="submit" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-transform active:scale-90">
                      <ArrowUp className="size-4" strokeWidth={2.5} />
                    </button>
                  </form>
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ajouter un ami</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                    placeholder="Nom d'utilisateur exact" 
                    className="flex-1 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                  <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm transition-transform active:scale-95">
                    <UserPlus className="size-4" />
                  </button>
                </div>
                {friendMessage && <p className="text-xs text-blue-600">{friendMessage}</p>}
              </form>

              {loadingFriends ? (
                <p className="py-8 text-center text-sm text-gray-400 animate-pulse">Chargement...</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {pendingFriends.length > 0 && (
                    <section>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-500">En attente ({pendingFriends.length})</p>
                      <div className="flex flex-col gap-2">
                        {pendingFriends.map(f => (
                          <div key={f.user_id} className="flex items-center justify-between rounded-xl bg-white p-3 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              {f.avatar_url ? (
                                <img src={f.avatar_url} className="size-10 rounded-full object-cover border border-gray-100" />
                              ) : (
                                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                  <Users className="size-4 text-gray-400" />
                                </div>
                              )}
                              <p className="text-sm font-bold text-gray-900">{f.username}</p>
                            </div>
                            <div className="flex gap-2">
                              {!f.is_requester && (
                                <button onClick={() => handleAcceptFriend(f.user_id)} className="rounded-full bg-green-50 p-2 text-green-600 border border-green-200 hover:bg-green-100">
                                  <Check className="size-4" />
                                </button>
                              )}
                              <button onClick={() => handleRemoveFriend(f.user_id)} className="rounded-full bg-red-50 p-2 text-red-600 border border-red-200 hover:bg-red-100">
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Mes amis ({acceptedFriends.length})</p>
                    {acceptedFriends.length === 0 ? (
                      <p className="text-xs text-gray-400">Tu n'as pas encore d'amis ajoutés.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {acceptedFriends.map(f => (
                          <div key={f.user_id} className="flex items-center justify-between rounded-xl bg-white p-3 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              {f.avatar_url ? (
                                <img src={f.avatar_url} className="size-10 rounded-full object-cover border border-gray-100" />
                              ) : (
                                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                  <Users className="size-4 text-gray-400" />
                                </div>
                              )}
                              <p className="text-sm font-bold text-gray-900">{f.username}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/vestiaire/pm/${f.user_id}`} className="rounded-full bg-blue-50 p-2 text-blue-600 border border-blue-200 hover:bg-blue-100">
                                <MessageSquare className="size-4" />
                              </Link>
                              <button onClick={() => handleRemoveFriend(f.user_id)} className="rounded-full bg-gray-50 p-2 text-gray-400 border border-gray-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50">
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
                <p className="py-8 text-center text-sm text-gray-400 animate-pulse">Chargement...</p>
              ) : conversations.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <ShieldAlert className="size-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Aucun message privé.</p>
                  <button onClick={() => setTab('amis')} className="mt-4 text-xs font-bold uppercase tracking-widest text-blue-600 hover:underline">Aller voir mes amis</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {conversations.map(c => (
                    <Link key={c.friendId} href={`/vestiaire/pm/${c.friendId}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} className="size-12 rounded-full object-cover border border-gray-100" />
                      ) : (
                        <div className="size-12 rounded-full bg-gray-100 border border-gray-200 flex shrink-0 items-center justify-center">
                          <Users className="size-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-sm text-gray-900">{c.username}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{formatTime(c.lastMessage.created_at)}</p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.lastMessage.content}</p>
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
