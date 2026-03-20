'use client'

import { useState } from 'react'
import {
  Phone,
  Mail,
  Star,
  Scissors,
  Users,
  TrendingUp,
  Calendar,
  Search,
  Crown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ClientWithStats } from '@/actions/clients'
import { formatPhone } from '@/lib/utils'

type Props = {
  clients: ClientWithStats[]
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ClientsClient({ clients }: Props) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false),
  )

  const totalClients = clients.length
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgSpent = totalClients > 0 ? totalRevenue / totalClients : 0
  const activeClients = clients.filter((c) => c.totalBookings > 0).length

  return (
    <div className='space-y-8 p-8 md:p-12'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Clientes</h1>
        <p className='text-zinc-400'>CRM e histórico dos seus clientes</p>
      </div>

      {/* Summary cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-zinc-700 bg-zinc-900/50'>
          <CardContent className='p-5'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-amber-600/20 p-2'>
                <Users className='h-5 w-5 text-amber-600' />
              </div>
              <div>
                <p className='text-xs text-zinc-400'>Total de Clientes</p>
                <p className='text-2xl font-bold'>{totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-zinc-700 bg-zinc-900/50'>
          <CardContent className='p-5'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-green-600/20 p-2'>
                <TrendingUp className='h-5 w-5 text-green-500' />
              </div>
              <div>
                <p className='text-xs text-zinc-400'>Receita Total</p>
                <p className='text-2xl font-bold'>
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-zinc-700 bg-zinc-900/50'>
          <CardContent className='p-5'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-blue-600/20 p-2'>
                <Crown className='h-5 w-5 text-blue-400' />
              </div>
              <div>
                <p className='text-xs text-zinc-400'>Ticket Médio</p>
                <p className='text-2xl font-bold'>{formatCurrency(avgSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-zinc-700 bg-zinc-900/50'>
          <CardContent className='p-5'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-purple-600/20 p-2'>
                <Star className='h-5 w-5 text-purple-400' />
              </div>
              <div>
                <p className='text-xs text-zinc-400'>Com Atendimentos</p>
                <p className='text-2xl font-bold'>{activeClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
        <Input
          placeholder='Buscar por nome, telefone ou e-mail...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <Card className='border-zinc-700 bg-zinc-900/50'>
          <CardContent className='p-8 text-center'>
            <p className='text-zinc-400'>
              {search
                ? 'Nenhum cliente encontrado para a busca.'
                : 'Nenhum cliente cadastrado ainda.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {filtered.map((client) => (
            <Card
              key={client.id}
              className='border-zinc-700 bg-zinc-900/50 backdrop-blur transition-colors hover:border-zinc-600'
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-600/20 text-sm font-bold text-amber-600'>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className='min-w-0'>
                      <CardTitle className='truncate text-base'>
                        {client.name}
                      </CardTitle>
                      {client.fidelity_points > 0 && (
                        <span className='flex items-center gap-1 text-xs text-amber-500'>
                          <Star className='h-3 w-3' />
                          {client.fidelity_points} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='flex-shrink-0 text-right'>
                    <p className='text-lg font-bold text-green-400'>
                      {formatCurrency(client.totalSpent)}
                    </p>
                    <p className='text-xs text-zinc-500'>
                      {client.totalBookings} atend.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-3'>
                {/* Contact */}
                <div className='space-y-1'>
                  <div className='flex items-center gap-2 text-sm text-zinc-400'>
                    <Phone className='h-3.5 w-3.5 flex-shrink-0' />
                    <span>{formatPhone(client.phone)}</span>
                  </div>
                  {client.email && (
                    <div className='flex items-center gap-2 text-sm text-zinc-400'>
                      <Mail className='h-3.5 w-3.5 flex-shrink-0' />
                      <span className='truncate'>{client.email}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className='border-t border-zinc-800' />

                {/* Stats */}
                <div className='space-y-2'>
                  {client.lastService ? (
                    <div className='flex items-start gap-2'>
                      <Calendar className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500' />
                      <div className='min-w-0 text-xs'>
                        <p className='text-zinc-500'>Último serviço</p>
                        <p className='truncate font-medium text-zinc-300'>
                          {client.lastService.name}
                          <span className='ml-1 text-zinc-500'>
                            com {client.lastService.barberName}
                          </span>
                        </p>
                        <p className='text-zinc-600'>
                          {formatDate(client.lastService.date)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className='text-xs text-zinc-600 italic'>
                      Sem atendimentos finalizados
                    </p>
                  )}

                  {client.favoriteBarber && (
                    <div className='flex items-center gap-2'>
                      <Users className='h-3.5 w-3.5 flex-shrink-0 text-zinc-500' />
                      <div className='min-w-0 text-xs'>
                        <span className='text-zinc-500'>Barbeiro preferido: </span>
                        <span className='font-medium text-zinc-300'>
                          {client.favoriteBarber}
                        </span>
                      </div>
                    </div>
                  )}

                  {client.favoriteService && (
                    <div className='flex items-center gap-2'>
                      <Scissors className='h-3.5 w-3.5 flex-shrink-0 text-zinc-500' />
                      <div className='min-w-0 text-xs'>
                        <span className='text-zinc-500'>Serviço favorito: </span>
                        <span className='font-medium text-zinc-300'>
                          {client.favoriteService}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client since */}
                <p className='text-right text-xs text-zinc-600'>
                  Cliente desde {formatDate(client.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
