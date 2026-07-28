'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/user-provider'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth'
import { 
  ArrowLeft, LogOut, Camera, Loader2, Bell, Moon, ShieldAlert, 
  ChevronRight, Trash2, User, FileText, Settings
} from 'lucide-react'
import Link from 'next/link'

export function ParametresView() {
  const router = useRouter()
  const { user, profile } = useUser()
  
  const [isEditingPseudo, setIsEditingPseudo] = useState(false)
  const [newPseudo, setNewPseudo] = useState(profile?.username || '')
  const [isSavingPseudo, setIsSavingPseudo] = useState(false)
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handlers
  const handleUpdatePseudo = async () => {
    if (!user || !newPseudo.trim() || newPseudo === profile?.username) {
      setIsEditingPseudo(false)
      return
    }
    
    setIsSavingPseudo(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ username: newPseudo.trim() }).eq('id', user.id)
    setIsSavingPseudo(false)
    
    if (error) {
      alert("Erreur lors de la modification du pseudo")
    } else {
      setIsEditingPseudo(false)
      window.location.reload()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingAvatar(true)
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      alert("Erreur lors du téléchargement de l'image.")
      setIsUploadingAvatar(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
    window.location.reload()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col pb-28 text-zinc-100">
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 mt-10 pb-6">
        <Link href="/?tab=profil" className="flex size-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors backdrop-blur-md">
          <ArrowLeft className="size-5 text-white" />
        </Link>
        <h1 className="text-xl font-bold font-helvetica italic">Paramètres</h1>
        <div className="size-10" /> {/* Spacer */}
      </header>

      <main className="relative z-10 flex-1 px-5 flex flex-col gap-6">

        {/* ─── PROFIL SECTION ─── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 px-1">Mon Compte</h2>
          
          <div className="rounded-[24px] bg-[#161B26]/80 backdrop-blur-md border border-white/5 overflow-hidden">
            
            {/* Avatar Edit */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Camera className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Photo de profil</p>
                  <p className="text-[10px] text-zinc-500">Changer ton avatar</p>
                </div>
              </div>
              
              <label className="relative flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/5 border border-white/10 overflow-hidden active:scale-95 transition-transform">
                <input type="file" hidden accept="image/*" onChange={handleFileSelect} disabled={isUploadingAvatar} />
                {isUploadingAvatar ? (
                  <Loader2 className="size-5 animate-spin text-orange-500" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  <User className="size-5 text-zinc-400" />
                )}
              </label>
            </div>

            {/* Pseudo Edit */}
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Settings className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Nom d'utilisateur</p>
                  <p className="text-[10px] text-zinc-500">Visible par les autres joueurs</p>
                </div>
              </div>
              
              {isEditingPseudo ? (
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    value={newPseudo} 
                    onChange={e => setNewPseudo(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                    placeholder="Nouveau pseudo"
                  />
                  <button 
                    onClick={handleUpdatePseudo} 
                    disabled={isSavingPseudo || !newPseudo.trim()}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform flex items-center justify-center"
                  >
                    {isSavingPseudo ? <Loader2 className="size-4 animate-spin" /> : 'OK'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1 p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-sm font-semibold text-zinc-300">{profile?.username || 'Joueur'}</span>
                  <button 
                    onClick={() => { setIsEditingPseudo(true); setNewPseudo(profile?.username || '') }}
                    className="text-xs font-bold text-blue-500 px-3 py-1.5 rounded-lg bg-blue-500/10 active:bg-blue-500/20"
                  >
                    Modifier
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </section>

        {/* ─── PREFERENCES SECTION ─── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 px-1">Préférences</h2>
          
          <div className="rounded-[24px] bg-[#161B26]/80 backdrop-blur-md border border-white/5 overflow-hidden">
            
            {/* Notifications */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                  <Bell className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Notifications</p>
                  <p className="text-[10px] text-zinc-500">Rappels de matchs (bientôt)</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-white/5 rounded-full relative opacity-50 cursor-not-allowed">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-zinc-500" />
              </div>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <Moon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Thème</p>
                  <p className="text-[10px] text-zinc-500">Sombre par défaut</p>
                </div>
              </div>
              <div className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg">
                Activé
              </div>
            </div>

          </div>
        </section>

        {/* ─── LEGAL SECTION ─── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 px-1">Informations</h2>
          
          <div className="rounded-[24px] bg-[#161B26]/80 backdrop-blur-md border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between p-5 border-b border-white/5 active:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-zinc-400" />
                <span className="text-sm font-semibold text-white">Règlement du jeu</span>
              </div>
              <ChevronRight className="size-4 text-zinc-600" />
            </button>
            <button className="w-full flex items-center justify-between p-5 active:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-5 text-zinc-400" />
                <span className="text-sm font-semibold text-white">Politique de confidentialité</span>
              </div>
              <ChevronRight className="size-4 text-zinc-600" />
            </button>
          </div>
        </section>

        {/* ─── DANGER ZONE ─── */}
        <section className="mt-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#161B26] border border-white/5 p-4 text-sm font-bold text-zinc-300 active:bg-white/5 transition-colors mb-3"
          >
            <LogOut className="size-4" />
            Se déconnecter
          </button>
          
          <button
            onClick={() => alert("Pour supprimer ton compte, contacte-nous sur Instagram @eurostep.")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-bold text-red-500 active:bg-red-500/20 transition-colors"
          >
            <Trash2 className="size-4" />
            Supprimer mon compte
          </button>
        </section>

      </main>
    </div>
  )
}
