'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Search, ChevronDown, CreditCard, Banknote, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { updateBookingStatus } from '@/actions/bookings'
import { formatCurrency, formatDateBR, formatPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Booking = {
  id: string
  date_time: Date
  status: string
  payment_status: string
  total_price: number | null
  notes: string | null
  client: { name: string; phone: string }
  barber: { name: string }
  service: { name: string; price: number }
}

type Props = {
  bookings: Booking[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-yellow-600/20 text-yellow-500',
  CONFIRMADO: 'bg-blue-600/20 text-blue-400',
  FINALIZADO: 'bg-green-600/20 text-green-500',
  CANCELADO: 'bg-red-600/20 text-red-400',
}

const PAYMENT_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago Online',
  PRESENCIAL: 'Pagar na Barbearia',
  REEMBOLSADO: 'Reembolsado',
}

const PAYMENT_COLORS: Record<string, string> = {
  PENDENTE: 'bg-zinc-700/50 text-zinc-400',
  PAGO: 'bg-green-600/20 text-green-400',
  PRESENCIAL: 'bg-blue-600/20 text-blue-400',
  REEMBOLSADO: 'bg-red-600/20 text-red-400',
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  PENDENTE: <Clock className='h-3 w-3' />,
  PAGO: <CreditCard className='h-3 w-3' />,
  PRESENCIAL: <Banknote className='h-3 w-3' />,
  REEMBOLSADO: <RefreshCw className='h-3 w-3' />,
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['FINALIZADO', 'CANCELADO'],
  FINALIZADO: [],
  CANCELADO: [],
}

export function BookingsClient({ bookings }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.client.name.toLowerCase().includes(search.toLowerCase()) ||
      b.barber.name.toLowerCase().includes(search.toLowerCase()) ||
      b.service.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !filterStatus || b.status === filterStatus
    const matchesPayment = !filterPayment || b.payment_status === filterPayment
    return matchesSearch && matchesStatus && matchesPayment
  })

  async function handleStatusChange() {
    if (!selected || !newStatus) return
    setLoading(true)
    await updateBookingStatus(
      selected.id,
      newStatus as 'PENDENTE' | 'CONFIRMADO' | 'FINALIZADO' | 'CANCELADO',
    )
    setLoading(false)
    setSelected(null)
    router.refresh()
  }

  return (
    <>
      <div className='space-y-8 p-8 md:p-12'>
        <div>
          <h1 className='text-3xl font-bold'>Agendamentos</h1>
          <p className='text-zinc-400'>Gerencie todos os agendamentos</p>
        </div>

        {/* Filters */}
        <div className='flex flex-col gap-3 sm:flex-row'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
            <Input
              placeholder='Buscar por cliente, barbeiro ou serviço...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
          <div className='relative'>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
            >
              <option value=''>Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
          </div>
          <div className='relative'>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className='h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
            >
              <option value=''>Todos os pagamentos</option>
              {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
          </div>
        </div>

        {/* Table */}
        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Calendar className='h-4 w-4 text-amber-600' />
              {filtered.length} agendamento(s)
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {filtered.length === 0 ? (
              <p className='p-8 text-center text-sm text-zinc-400'>
                Nenhum agendamento encontrado.
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-zinc-800 text-left text-zinc-400'>
                      <th className='px-4 py-3 font-medium'>Cliente</th>
                      <th className='px-4 py-3 font-medium'>Serviço</th>
                      <th className='px-4 py-3 font-medium'>Barbeiro</th>
                      <th className='px-4 py-3 font-medium'>Data/Hora</th>
                      <th className='px-4 py-3 font-medium'>Valor</th>
                      <th className='px-4 py-3 font-medium'>Status</th>
                      <th className='px-4 py-3 font-medium'>Pagamento</th>
                      <th className='px-4 py-3 font-medium'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((booking) => (
                      <tr
                        key={booking.id}
                        className='border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30'
                      >
                        <td className='px-4 py-3'>
                          <p className='font-medium'>{booking.client.name}</p>
                          <p className='text-xs text-zinc-500'>
                            {formatPhone(booking.client.phone)}
                          </p>
                        </td>
                        <td className='px-4 py-3'>{booking.service.name}</td>
                        <td className='px-4 py-3'>{booking.barber.name}</td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          {formatDateBR(booking.date_time)}
                        </td>
                        <td className='px-4 py-3 text-amber-600'>
                          {formatCurrency(
                            booking.total_price ?? booking.service.price,
                          )}
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              STATUS_COLORS[booking.status],
                            )}
                          >
                            {STATUS_LABELS[booking.status]}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                              PAYMENT_COLORS[booking.payment_status],
                            )}
                          >
                            {PAYMENT_ICONS[booking.payment_status]}
                            {PAYMENT_LABELS[booking.payment_status]}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          {STATUS_TRANSITIONS[booking.status].length > 0 && (
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-zinc-700 text-xs hover:border-amber-600 hover:text-amber-600'
                              onClick={() => {
                                setSelected(booking)
                                setNewStatus(
                                  STATUS_TRANSITIONS[booking.status][0],
                                )
                              }}
                            >
                              Alterar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className='border-zinc-700 bg-zinc-900 text-white'>
          <DialogHeader>
            <DialogTitle>Alterar status do agendamento</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className='space-y-4'>
              <div className='rounded-lg border border-zinc-800 p-3 text-sm space-y-1'>
                <p>
                  <span className='text-zinc-400'>Cliente:</span>{' '}
                  {selected.client.name}
                </p>
                <p>
                  <span className='text-zinc-400'>Serviço:</span>{' '}
                  {selected.service.name}
                </p>
                <p>
                  <span className='text-zinc-400'>Data:</span>{' '}
                  {formatDateBR(selected.date_time)}
                </p>
                <div className='flex items-center gap-2 pt-1'>
                  <span className='text-zinc-400'>Pagamento:</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                      PAYMENT_COLORS[selected.payment_status],
                    )}
                  >
                    {PAYMENT_ICONS[selected.payment_status]}
                    {PAYMENT_LABELS[selected.payment_status]}
                  </span>
                </div>
              </div>
              <div className='space-y-1'>
                <label className='text-sm text-zinc-400'>Novo status</label>
                <div className='relative'>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className='w-full h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
                  >
                    {STATUS_TRANSITIONS[selected.status].map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className='flex-col-reverse gap-2 sm:flex-row sm:gap-0'>
            <Button
              variant='outline'
              className='border-zinc-700'
              onClick={() => setSelected(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={loading}
              className='bg-amber-600 hover:bg-amber-500'
              onClick={handleStatusChange}
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
