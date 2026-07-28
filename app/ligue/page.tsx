// On renomme l'import en "dynamicImport" pour éviter le conflit
import dynamicImport from 'next/dynamic'

// On utilise notre alias ici
const LigueClient = dynamicImport(() => import('./LigueClient'), { ssr: false })

// Maintenant, Next.js peut utiliser son mot-clé réservé sans problème
export const dynamic = 'force-dynamic'

export default function LiguePage() {
  return <LigueClient />
}
