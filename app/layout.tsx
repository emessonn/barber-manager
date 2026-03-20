import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import { Providers } from './providers'
import '@/styles/globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BarberManager - Gerenciamento de Barbearias',
  description:
    'SaaS Multi-tenant para gerenciamento de barbearias com agendamentos, finanças e CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='pt-BR' className={cn('font-sans', geist.variable)}>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className='min-h-screen bg-zinc-950 text-zinc-50'>
            {children}
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
