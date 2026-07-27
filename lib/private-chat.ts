import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient()

export interface PrivateMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

function getOrderedIds(id1: string, id2: string) {
  return id1 < id2 ? [id1, id2] : [id2, id1]
}

export async function getPrivateMessages(userId: string, friendId: string, limit = 50): Promise<PrivateMessage[]> {
  const { data } = await supabase
    .from('private_messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(limit)

  return (data as PrivateMessage[]) ?? []
}

export async function sendPrivateMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from('private_messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select('*')
    .single()

  return { data: data as PrivateMessage | null, error }
}

export function subscribeToPrivateMessages(
  userId: string,
  friendId: string,
  onNewMessage: (message: PrivateMessage) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`pm:${userId}:${friendId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        // Realtime filters can only be simple equality. So we can't filter BOTH ways in one filter.
        // We will just subscribe to the table and filter on the client side.
      },
      (payload) => {
        const msg = payload.new as PrivateMessage
        if (
          (msg.sender_id === userId && msg.receiver_id === friendId) ||
          (msg.sender_id === friendId && msg.receiver_id === userId)
        ) {
          onNewMessage(msg)
        }
      },
    )
    .subscribe()

  return channel
}

export function unsubscribeFromPrivateMessages(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}

export async function getRecentConversations(userId: string) {
  // This is a complex query to get the last message per friend.
  // Supabase doesn't support GROUP BY easily in postgREST without RPC or Views.
  // Let's just fetch all messages for the user ordered by date descending (limit 200) 
  // and extract unique friends.
  const { data } = await supabase
    .from('private_messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (!data) return []

  const conversations = new Map<string, PrivateMessage>()

  for (const msg of data as PrivateMessage[]) {
    const friendId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
    if (!conversations.has(friendId)) {
      conversations.set(friendId, msg)
    }
  }

  // Get profiles for these friends
  const friendIds = Array.from(conversations.keys())
  if (friendIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', friendIds)

  return Array.from(conversations.entries()).map(([friendId, lastMessage]) => {
    const profile = profiles?.find(p => p.id === friendId)
    return {
      friendId,
      username: profile?.username ?? 'Joueur',
      avatar_url: profile?.avatar_url ?? null,
      lastMessage
    }
  })
}
