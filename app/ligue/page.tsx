import LigueClient from './LigueClient';

// Indique à Next.js de rendre cette page dynamiquement à chaque requête
export const dynamic = 'force-dynamic';

export default function LiguePage() {
  return <LigueClient />;
}
