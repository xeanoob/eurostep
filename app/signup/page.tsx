'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)

    if (username.trim().length < 2) {
      setError('Le prénom doit faire au moins 2 caractères')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password, username.trim())

    if (error) {
      if (error.message?.includes('rate') || error.status === 429) {
        setError('Trop de tentatives. Réessaie dans quelques minutes.')
      } else if (error.message?.includes('already registered')) {
        setError('Cet email est déjà utilisé. Connecte-toi plutôt.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (data?.session) {
      router.replace('/')
      return
    }

    setNeedsConfirmation(true)
    setLoading(false)
  }

  if (needsConfirmation) {
    return (
      <div className="relative mx-auto flex min-h-svh max-w-md flex-col items-center justify-center bg-[#0B0E14] px-6 text-center text-zinc-100 font-sans">
        <div className="mb-6 flex size-14 items-center justify-center rounded-sm bg-orange-500/10 border border-orange-500/20">
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="font-display text-3xl font-black italic tracking-tighter uppercase text-white">Vérifie tes emails</h1>
        <p className="mt-3 max-w-xs text-xs font-bold uppercase tracking-widest text-zinc-500 leading-relaxed">
          Lien envoyé à <span className="text-orange-500">{email}</span>
        </p>
        <Link
          href="/login"
          className="mt-10 rounded-sm bg-orange-600 px-8 py-4 font-display text-base font-black italic uppercase tracking-widest text-white transition-all hover:bg-orange-500"
        >
          Se Connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex min-h-svh max-w-md flex-col justify-between bg-[#0B0E14] text-zinc-100 overflow-hidden font-sans">
      {/* ─── IMMERSIVE FULL-SCREEN BACKGROUND IMAGE + TEXTURED OVERLAY ─── */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-basketball.png"
          alt="Basketball Background"
          className="h-full w-full object-cover object-center opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14]/10 via-[#0B0E14]/80 to-[#0B0E14]" />
      </div>

      {/* ─── HEADER & BRANDING ─── */}
      <header className="relative z-10 flex flex-col items-center px-6 pt-16 text-center">
        <h1 className="font-display text-4xl font-black italic tracking-tighter text-white">
          Rejoins la <span className="text-orange-500">Ligue</span>
        </h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          EuroStep · Création de compte
        </p>
      </header>

      {/* ─── BRUTALIST FORM NO BOXES ─── */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Username input */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="username"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              Prénom / Pseudo
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="given-name"
              placeholder="Ex: Jordan"
              className="w-full rounded-none border-2 border-zinc-800 bg-zinc-950/50 px-4 py-4 text-sm text-white placeholder-zinc-600 transition-all focus:border-orange-500 focus:bg-zinc-950 focus:outline-none"
            />
          </div>

          {/* Email input */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="alex@eurostep.app"
              className="w-full rounded-none border-2 border-zinc-800 bg-zinc-950/50 px-4 py-4 text-sm text-white placeholder-zinc-600 transition-all focus:border-orange-500 focus:bg-zinc-950 focus:outline-none"
            />
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              Mot de passe (6 car. min)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••••••"
              className="w-full rounded-none border-2 border-zinc-800 bg-zinc-950/50 px-4 py-4 text-sm text-white placeholder-zinc-600 transition-all focus:border-orange-500 focus:bg-zinc-950 focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-500 text-center">
              {error}
            </div>
          )}

          {/* ─── LETHAL CTA BUTTON ─── */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-sm bg-orange-600 py-4 font-display text-lg font-black italic uppercase tracking-widest text-white transition-all hover:bg-orange-500 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer Mon Compte'}
          </button>
        </form>

        {/* ─── SECONDARY ACTION (LOGIN) ─── */}
        <div className="mt-8 flex flex-col items-center">
          <Link
            href="/login"
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
          >
            Déjà inscrit ? <span className="text-orange-500 underline underline-offset-4">Se Connecter</span>
          </Link>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 px-6 pb-6 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700">
          EUROSTEP · 2026
        </p>
      </footer>
    </div>
  )
}
