'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarX, Trash2, Info } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addBarbershopException, removeBarbershopException } from '@/actions/barbershop'

export type ExceptionItem = {
  id: string
  date: string // ISO string from server
  reason: string | null
}

type Props = {
  barbershop_id: string
  exceptions: ExceptionItem[]
}

function parseExcDate(iso: string): Date {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function ExceptionsTab({ barbershop_id, exceptions }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Date | undefined>()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const exceptionDates = exceptions.map((e) => parseExcDate(e.date))

  async function handleAdd() {
    if (!selected) return
    setLoading(true)
    setError('')
    const dateStr = format(selected, 'yyyy-MM-dd')
    const result = await addBarbershopException(barbershop_id, dateStr, reason || undefined)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Erro ao adicionar')
      return
    }
    setSelected(undefined)
    setReason('')
    router.refresh()
  }

  async function handleRemove(id: string) {
    const result = await removeBarbershopException(id)
    if (result.success) router.refresh()
  }

  const upcoming = [...exceptions]
    .filter((e) => parseExcDate(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => a.date.localeCompare(b.date))

  const past = [...exceptions]
    .filter((e) => parseExcDate(e.date) < new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className='space-y-6'>
      <div className='flex items-start gap-2 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 text-sm text-zinc-400'>
        <Info className='h-4 w-4 mt-0.5 shrink-0 text-amber-500' />
        <span>
          Datas bloqueadas impedem novos agendamentos e aparecem como fechado na agenda,
          independente do horário de funcionamento configurado.
        </span>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Calendar picker */}
        <div className='space-y-2'>
          <p className='text-sm font-medium text-zinc-300'>Selecione a data:</p>
          <div className='rounded-lg border border-zinc-700 bg-zinc-900/50 p-1 inline-block'>
            <Calendar
              mode='single'
              selected={selected}
              onSelect={setSelected}
              disabled={[
                { before: new Date() },
                ...exceptionDates,
              ]}
              locale={ptBR}
              modifiers={{ exception: exceptionDates }}
              modifiersClassNames={{
                exception: '!bg-red-500/20 !text-red-400 line-through',
              }}
            />
          </div>
          <p className='text-xs text-zinc-500'>
            Datas <span className='text-red-400 line-through'>riscadas</span> já estão bloqueadas.
          </p>
        </div>

        {/* Add form */}
        <div className='space-y-4'>
          {selected ? (
            <div className='rounded-lg border border-amber-600/30 bg-amber-600/10 px-3 py-2 text-sm text-amber-400'>
              Data selecionada:{' '}
              <span className='font-semibold'>
                {format(selected, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          ) : (
            <div className='rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 py-2 text-sm text-zinc-500'>
              Nenhuma data selecionada
            </div>
          )}

          <div className='space-y-1'>
            <label className='text-sm text-zinc-400'>
              Motivo <span className='text-zinc-600'>(opcional)</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Ex: Feriado nacional, Manutenção...'
              disabled={!selected}
            />
          </div>

          {error && <p className='text-sm text-red-400'>{error}</p>}

          <Button
            disabled={!selected || loading}
            onClick={handleAdd}
            className='w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold'
          >
            <CalendarX className='mr-2 h-4 w-4' />
            {loading ? 'Salvando...' : 'Bloquear data'}
          </Button>

          {/* Upcoming list */}
          <div className='space-y-2'>
            <p className='text-sm font-medium text-zinc-300'>
              Próximas datas bloqueadas
              {upcoming.length > 0 && (
                <span className='ml-2 text-xs font-normal text-zinc-500'>
                  ({upcoming.length})
                </span>
              )}
            </p>

            {upcoming.length === 0 ? (
              <p className='text-sm text-zinc-600'>Nenhuma exceção futura.</p>
            ) : (
              <div className='space-y-1.5 max-h-56 overflow-y-auto pr-1'>
                {upcoming.map((exc) => (
                  <div
                    key={exc.id}
                    className='flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2'
                  >
                    <div>
                      <p className='text-sm text-zinc-200'>
                        {format(parseExcDate(exc.date), "dd/MM/yyyy · EEEE", { locale: ptBR })}
                      </p>
                      {exc.reason && (
                        <p className='text-xs text-zinc-500'>{exc.reason}</p>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemove(exc.id)}
                      className='text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past exceptions */}
          {past.length > 0 && (
            <div className='space-y-2'>
              <p className='text-sm text-zinc-500'>
                Datas passadas ({past.length})
              </p>
              <div className='space-y-1.5 max-h-32 overflow-y-auto pr-1'>
                {past.map((exc) => (
                  <div
                    key={exc.id}
                    className='flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 opacity-60'
                  >
                    <div>
                      <p className='text-sm text-zinc-400 line-through'>
                        {format(parseExcDate(exc.date), "dd/MM/yyyy · EEEE", { locale: ptBR })}
                      </p>
                      {exc.reason && (
                        <p className='text-xs text-zinc-600'>{exc.reason}</p>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemove(exc.id)}
                      className='text-zinc-600 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
