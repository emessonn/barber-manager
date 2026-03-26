'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Scissors,
  Users,
  Calendar,
  CalendarDays,
  BarChart3,
  Package,
  Percent,
  LogOut,
  Menu,
  Settings,
  UserCheck,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type MenuItem = {
  label: string
  href: string
  icon: React.ElementType
}

const adminMenuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Serviços', href: '/admin/services', icon: Scissors },
  { label: 'Barbeiros', href: '/admin/barbers', icon: Users },
  { label: 'Clientes', href: '/admin/clients', icon: UserCheck },
  { label: 'Agendamentos', href: '/admin/bookings', icon: Calendar },
  { label: 'Agenda do Dia', href: '/admin/agenda', icon: CalendarDays },
  { label: 'Finanças', href: '/admin/finances', icon: BarChart3 },
  { label: 'Estoque', href: '/admin/inventory', icon: Package },
  { label: 'Comissões', href: '/admin/commissions', icon: Percent },
  { label: 'Configurações', href: '/admin/settings', icon: Settings },
  { label: 'Usuários', href: '/admin/usuarios', icon: ShieldCheck },
]

const recepcaoMenuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Serviços', href: '/admin/services', icon: Scissors },
  { label: 'Barbeiros', href: '/admin/barbers', icon: Users },
  { label: 'Clientes', href: '/admin/clients', icon: UserCheck },
  { label: 'Agendamentos', href: '/admin/bookings', icon: Calendar },
  { label: 'Agenda do Dia', href: '/admin/agenda', icon: CalendarDays },
  { label: 'Estoque', href: '/admin/inventory', icon: Package },
  { label: 'Configurações', href: '/admin/settings', icon: Settings },
]

const barberMenuItems: MenuItem[] = [
  { label: 'Minha Agenda', href: '/admin/minha-agenda', icon: CalendarDays },
  { label: 'Minhas Comissões', href: '/admin/minhas-comissoes', icon: Percent },
]

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  RECEPCAO: 'Recepção',
  BARBER: 'Barbeiro',
}

interface SidebarProps {
  barbershopName?: string | null
  barbershopLogo?: string | null
  userRole?: string
  userName?: string
}

export function Sidebar({ barbershopName, barbershopLogo, userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems =
    userRole === 'BARBER'
      ? barberMenuItems
      : userRole === 'RECEPCAO'
        ? recepcaoMenuItems
        : adminMenuItems

  return (
    <>
      {/* Mobile Header */}
      <header className='fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 backdrop-blur md:hidden'>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='rounded-lg border border-zinc-700 bg-zinc-800/60 p-2'
          aria-label='Abrir menu'
        >
          <Menu className='h-5 w-5' />
        </button>
        <div className='flex items-center gap-2'>
          {barbershopLogo ? (
            <img
              src={barbershopLogo}
              alt={barbershopName || 'NaValha'}
              className='h-6 w-6 rounded object-cover'
            />
          ) : (
            <Scissors className='h-5 w-5 text-amber-600' />
          )}
          <span className='text-base font-bold text-amber-600'>
            {barbershopName || 'NaValha'}
          </span>
        </div>
        {/* spacer to center the title */}
        <div className='w-9' />
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur transition-transform md:static md:translate-x-0 md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className='flex flex-col h-full p-6 space-y-6'>
          {/* Logo */}
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              {barbershopLogo ? (
                <img
                  src={barbershopLogo}
                  alt={barbershopName || 'NaValha'}
                  className='h-10 w-10 rounded-lg object-cover'
                />
              ) : (
                <Scissors className='h-8 w-8 text-amber-600' />
              )}
              <div>
                <h1 className='text-lg font-bold text-amber-600'>
                  {barbershopName || 'NaValha'}
                </h1>
                {barbershopName && (
                  <p className='text-xs text-zinc-500'>
                    {userRole ? roleLabels[userRole] ?? 'Painel' : 'Painel'}
                  </p>
                )}
              </div>
            </div>

            {/* User info for staff */}
            {userName && userRole !== 'ADMIN' && (
              <div className='flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2'>
                {userRole === 'BARBER' ? (
                  <Scissors className='h-3.5 w-3.5 text-blue-400 shrink-0' />
                ) : (
                  <ClipboardList className='h-3.5 w-3.5 text-purple-400 shrink-0' />
                )}
                <span className='text-xs text-zinc-300 truncate'>{userName}</span>
              </div>
            )}
          </div>

          {/* Menu */}
          <nav className='flex-1 space-y-1'>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-amber-600/20 text-amber-600 border border-amber-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50',
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className='h-4 w-4' />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            className='flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-red-500 hover:bg-red-500/10'
          >
            <LogOut className='h-4 w-4' />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 md:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
