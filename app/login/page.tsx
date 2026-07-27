'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return // Prevent double submit
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

    window.location.href = '/'
  }

  return (
    <div className="relative mx-auto flex min-h-svh max-w-md flex-col justify-between overflow-hidden bg-background">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[500px] -translate-x-1/2 rounded-full opacity-[0.07] blur-[100px]"
        style={{ background: 'oklch(0.72 0.19 55)' }}
        aria-hidden="true"
      />

      {/* Top: Branding */}
      <header className="relative flex flex-col items-center px-6 pt-24">
        {/* Logo mark */}
        <div className="mb-8 flex size-16 items-center justify-center rounded-2xl bg-primary">
          <span className="font-display text-2xl text-primary-foreground">E</span>
        </div>

        <h1 className="font-display text-[2.75rem] uppercase leading-[0.85] tracking-tight text-center">
          Euro<span className="text-primary">Step</span>
        </h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Pronostics basket entre potes
        </p>
      </header>

      {/* Middle: Form */}
      <div className="relative flex-1 px-6 pt-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="group relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder=" "
              className="peer w-full rounded-lg border border-border bg-card px-4 pt-5 pb-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-4 top-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:uppercase peer-placeholder-shown:tracking-[0.08em] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.12em] peer-focus:text-primary"
            >
              Email
            </label>
          </div>

          <div className="group relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder=" "
              className="peer w-full rounded-lg border border-border bg-card px-4 pt-5 pb-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
            />
            <label
              htmlFor="password"
              className="pointer-events-none absolute left-4 top-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:uppercase peer-placeholder-shown:tracking-[0.08em] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.12em] peer-focus:text-primary"
            >
              Mot de passe
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-[13px] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-primary py-3.5 font-display text-base uppercase tracking-wide text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/signup"
          className="mt-6 flex w-full items-center justify-center rounded-lg border border-border py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Créer un compte
        </Link>
      </div>

      {/* Bottom: Footer */}
      <footer className="px-6 pb-10 pt-8 text-center">
        <p className="text-[11px] text-muted-foreground/50">
          En continuant, tu acceptes les conditions d'utilisation.
        </p>
      </footer>
    </div>
  )
}
