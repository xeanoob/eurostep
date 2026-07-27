'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/user-provider'
import { getPrivateMessages, sendPrivateMessage, subscribeToPrivateMessages, unsubscribeFromPrivateMessages, type PrivateMessage } from '@/lib/private-chat'
import { ArrowUp, ChevronLeft, Loader2 } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export default function PrivateMessagePage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter()
  const { userId: friendId } = use(params)
  const { user, loading: authLoading } = useUser()
  
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [friendName, setFriendName] = useState('Ami')
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) router.push('/login')
      return
    }

    async function load() {
      // Get friend profile for header
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', friendId).single()
      if (profile) setFriendName(profile.username)

      const msgs = await getPrivateMessages(user!.id, friendId)
      setMessages(msgs)
      setLoading(false)
    }

    load()

    channelRef.current = subscribeToPrivateMessages(user.id, friendId, (newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    })

    return () => {
      if (channelRef.current) unsubscribeFromPrivateMessages(channelRef.current)
    }
  }, [user, friendId, authLoading, router, supabase])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || !user) return
    setInput('')

    const optimistic: PrivateMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: friendId,
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const { data } = await sendPrivateMessage(user.id, friendId, text)
    if (data) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)))
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="mx-auto flex h-svh max-w-md flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 pt-14 pb-4 border-b border-zinc-800 bg-zinc-950">
        <button onClick={() => router.back()} className="rounded-full bg-zinc-900 p-2 border border-zinc-800 transition-colors hover:bg-zinc-800 text-zinc-500 hover:text-white shadow-sm">
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Message Privé</p>
          <h1 className="text-xl font-bold text-white">{friendName}</h1>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pt-5 pb-24">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            Aucun message. Dis-lui salut !
          </p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === user?.id
            const showSender = !isOwn && (i === 0 || messages[i - 1].sender_id !== msg.sender_id)

            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${showSender ? 'mt-3' : ''}`}>
                <div className={`max-w-[78%] px-3.5 py-2.5 text-[15px] leading-snug shadow-sm border ${
                    isOwn ? 'rounded-2xl rounded-br-sm bg-orange-500 text-white border-orange-600' : 'rounded-2xl rounded-bl-sm bg-zinc-900 text-zinc-100 border-zinc-800'
                  }`}>
                  {msg.content}
                </div>
                <p className={`mt-1 text-[10px] tabular-nums text-zinc-500 ${isOwn ? 'pr-0.5' : 'pl-0.5'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            )
          })
        )}
      </main>

      {/* Input */}
      <div className="bg-zinc-950 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-zinc-800 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex items-center gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message privé..."
            className="flex-1 rounded-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 shadow-sm"
          />
          <button type="submit" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-transform active:scale-90">
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  )
}
