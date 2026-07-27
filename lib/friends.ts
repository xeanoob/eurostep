import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface Friend {
  user_id: string
  username: string
  avatar_url: string | null
  status: 'pending' | 'accepted'
  is_requester: boolean
}

function getOrderedIds(id1: string, id2: string) {
  return id1 < id2 ? [id1, id2] : [id2, id1]
}

export async function sendFriendRequest(senderId: string, receiverUsername: string) {
  // Find receiver by username
  const { data: receiver } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', receiverUsername)
    .single()

  if (!receiver) return { error: "Utilisateur introuvable" }
  if (receiver.id === senderId) return { error: "Tu ne peux pas t'ajouter toi-même" }

  const [u1, u2] = getOrderedIds(senderId, receiver.id)

  const { error } = await supabase
    .from('friends')
    .insert({
      user_id_1: u1,
      user_id_2: u2,
      status: 'pending',
      requester_id: senderId
    })

  if (error?.code === '23505') return { error: "Demande déjà envoyée ou vous êtes déjà amis" }
  return { error: error?.message ?? null }
}

export async function getFriendsList(userId: string): Promise<Friend[]> {
  const { data: friendsData, error } = await supabase
    .from('friends')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)

  if (error || !friendsData || friendsData.length === 0) return []

  const friendIds = friendsData.map(f => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', friendIds)

  if (!profiles) return []

  return friendsData.map(f => {
    const isU1 = f.user_id_1 === userId
    const friendId = isU1 ? f.user_id_2 : f.user_id_1
    const profile = profiles.find(p => p.id === friendId)
    
    return {
      user_id: friendId,
      username: profile?.username ?? 'Joueur',
      avatar_url: profile?.avatar_url ?? null,
      status: f.status,
      is_requester: f.requester_id === userId
    }
  })
}

export async function acceptFriendRequest(userId: string, friendId: string) {
  const [u1, u2] = getOrderedIds(userId, friendId)

  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('user_id_1', u1)
    .eq('user_id_2', u2)

  return { error }
}

export async function removeFriend(userId: string, friendId: string) {
  const [u1, u2] = getOrderedIds(userId, friendId)

  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('user_id_1', u1)
    .eq('user_id_2', u2)

  return { error }
}
