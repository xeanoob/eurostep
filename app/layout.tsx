import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Anton, Barlow } from 'next/font/google'
import { UserProvider } from '@/components/user-provider'
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

export const metadata: Metadata = {
  title: 'EuroStep — Pronostics Basket entre Potes',
  description:
    'Pronostique le score exact des matchs de basket et défie tes potes dans la Ligue.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0c',
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
    <html lang="fr" className={`dark bg-[#0a0a0c] text-[#f2f2f7] antialiased ${anton.variable} ${barlow.variable}`}>
      <body className="font-sans font-medium selection:bg-white/20">
        <UserProvider>
          {children}
        </UserProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
