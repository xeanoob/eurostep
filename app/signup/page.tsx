'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/auth'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return // Prevent double submit
    setError('')
    setLoading(true)

    if (username.trim().length < 2) {
      setError('Le prénom doit faire au moins 2 caractères')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password, username.trim())

    if (error) {
      // Handle rate limiting
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

    // If we got a session, redirect immediately
    if (data?.session) {
      window.location.href = '/'
      return
    }

    // If no session, email confirmation is required
    setNeedsConfirmation(true)
    setLoading(false)
  }

  if (needsConfirmation) {
    return (
      <div className="relative mx-auto flex min-h-svh max-w-md flex-col items-center justify-center overflow-hidden bg-background px-6">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 size-[500px] -translate-x-1/2 rounded-full opacity-[0.07] blur-[100px]"
          style={{ background: 'oklch(0.72 0.19 55)' }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/20">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="font-display text-2xl uppercase tracking-tight">Check tes emails</h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Un lien de confirmation a été envoyé à <strong className="text-foreground">{email}</strong>. Clique dessus pour activer ton compte.
          </p>
          <Link
            href="/login"
            className="mt-8 text-sm font-semibold text-primary"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
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
      <header className="relative flex flex-col items-center px-6 pt-20">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary">
          <span className="font-display text-2xl text-primary-foreground">E</span>
        </div>

        <h1 className="font-display text-[2.75rem] uppercase leading-[0.85] tracking-tight text-center">
          Euro<span className="text-primary">Step</span>
        </h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Crée ton compte et rejoins une ligue
        </p>
      </header>

      {/* Middle: Form */}
      <div className="relative flex-1 px-6 pt-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="given-name"
              placeholder=" "
              className="peer w-full rounded-lg border border-border bg-card px-4 pt-5 pb-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
            />
            <label
              htmlFor="username"
              className="pointer-events-none absolute left-4 top-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:uppercase peer-placeholder-shown:tracking-[0.08em] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.12em] peer-focus:text-primary"
            >
              Prénom
            </label>
          </div>

          <div className="relative">
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

          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
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
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/login"
          className="mt-6 flex w-full items-center justify-center rounded-lg border border-border py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Se connecter
        </Link>
      </div>

      {/* Bottom: Footer */}
      <footer className="px-6 pb-10 pt-6 text-center">
        <p className="text-[11px] text-muted-foreground/50">
          En continuant, tu acceptes les conditions d'utilisation.
        </p>
      </footer>
    </div>
  )
}
