import dynamic from 'next/dynamic'

// L'option { ssr: false } est la clé : elle empêche Next.js d'exécuter 
// le composant dans Node.js pendant le "pnpm run build"
const LigueClient = dynamic(() => import('./LigueClient'), { ssr: false })

export const dynamic = 'force-dynamic'

export default function LiguePage() {
  return <LigueClient />
}
