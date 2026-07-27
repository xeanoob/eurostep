import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Anton, Barlow, Outfit } from 'next/font/google'
import { UserProvider } from '@/components/user-provider'
import { DuelResolutionModal } from '@/components/duel-resolution-modal'
import { SplashScreen } from '@/components/splash-screen'
import './globals.css'

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'EuroStep — Pronostics Basket entre Potes',
  description:
    'Pronostique le score exact des matchs de basket et défie tes potes dans la Ligue.',
  appleWebApp: {
    title: 'EuroStep',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  applicationName: 'EuroStep',
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0B0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`dark bg-[#0B0E14] text-[#f2f2f7] antialiased ${anton.variable} ${barlow.variable} ${outfit.variable}`}>
      <body className="font-sans font-medium selection:bg-white/20">
        <UserProvider>
          <SplashScreen />
          {children}
          <DuelResolutionModal />
        </UserProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
