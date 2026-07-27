'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)

    const { data, error } = await signIn(email, password)

    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        setError('Email pas encore confirmé. Vérifie ta boîte mail.')
      } else if (error.message?.includes('Invalid login')) {
        setError('Email ou mot de passe incorrect')
      } else {
        setError(error.message || 'Email ou mot de passe incorrect')
      }
      setLoading(false)
      return
    }

    if (!data?.session) {
      setError('Impossible de se connecter. Réessaie.')
      setLoading(false)
      return
    }

    router.replace('/')
  }

  return (
    <div className="relative mx-auto flex min-h-svh max-w-md flex-col justify-between text-zinc-100 overflow-hidden font-sans">
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
      <header className="relative z-10 flex flex-col items-center px-6 pt-24 text-center">
        <h1 className="font-display text-5xl font-black italic tracking-tighter text-white">
          Euro<span className="text-orange-500">Step</span>
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          Défie tes potes. Domine la ligue.
        </p>
      </header>

      {/* ─── BRUTALIST FORM NO BOXES ─── */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
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
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full rounded-none border-2 border-zinc-800 bg-zinc-950/50 px-4 py-4 text-sm text-white placeholder-zinc-600 transition-all focus:border-orange-500 focus:bg-zinc-950 focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-xs font-bold uppercase tracking-widest text-red-500 text-center">
              {error}
            </div>
          )}

          {/* ─── LETHAL CTA BUTTON ─── */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-sm bg-orange-600 py-4 font-display text-lg font-black italic uppercase tracking-widest text-white transition-all hover:bg-orange-500 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* ─── SECONDARY ACTION (SIGNUP) ─── */}
        <div className="mt-10 flex flex-col items-center">
          <Link
            href="/signup"
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
          >
            Pas encore de compte ? <span className="text-orange-500 underline underline-offset-4">S'inscrire</span>
          </Link>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 px-6 pb-8 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700">
          EUROSTEP · 2026
        </p>
      </footer>
    </div>
  )
}
