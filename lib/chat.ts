import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient()

export interface Message {
  id: string
  league_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: { username: string }
}

export async function getMessages(leagueId: string, limit = 50): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*, profiles(username)')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: true })
    .limit(limit)

  return (data as Message[]) ?? []
}

export async function sendMessage(leagueId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ league_id: leagueId, user_id: userId, content })
    .select('*, profiles(username)')
    .single()

  return { data: data as Message | null, error }
}

export function subscribeToMessages(
  leagueId: string,
  onNewMessage: (message: Message) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${leagueId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `league_id=eq.${leagueId}`,
      },
      async (payload) => {
        // Fetch the full message with profile info
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(username)')
          .eq('id', payload.new.id)
          .single()

        if (data) {
          onNewMessage(data as Message)
        }
      },
    )
    .subscribe()

  return channel
}

export function unsubscribeFromMessages(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}
