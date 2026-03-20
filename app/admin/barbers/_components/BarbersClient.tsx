'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  Percent,
  Power,
  Scissors,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  createBarber,
  updateBarber,
  deleteBarber,
  toggleBarberActive,
} from '@/actions/barbers'
import { formatPhone } from '@/lib/utils'

type Service = {
  id: string
  name: string
  price: number
  duration_minutes: number
}

type Barber = {
  id: string
  name: string
  phone: string
  commission_percentage: number
  avatar_url: string | null
  is_active: boolean
  services: Service[]
}

type Props = {
  barbers: Barber[]
  services: Service[]
  barbershop_id: string
}

const emptyForm = {
  name: '',
  phone: '',
  commission_percentage: '20',
  avatar_url: '',
}

export function BarbersClient({ barbers, services, barbershop_id }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Barber | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setSelectedServices([])
    setError('')
    setOpen(true)
  }

  function openEdit(barber: Barber) {
    setEditing(barber)
    setForm({
      name: barber.name,
      phone: barber.phone,
      commission_percentage: String(barber.commission_percentage),
      avatar_url: barber.avatar_url ?? '',
    })
    setSelectedServices(barber.services.map((s) => s.id))
    setError('')
    setOpen(true)
  }

  function toggleService(serviceId: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = {
      name: form.name,
      phone: form.phone,
      commission_percentage: parseFloat(form.commission_percentage),
      avatar_url: form.avatar_url || undefined,
    }

    const result = editing
      ? await updateBarber(editing.id, data, selectedServices)
      : await createBarber(barbershop_id, data, selectedServices)

    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erro ao salvar')
      return
    }

    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setLoading(true)
    const result = await deleteBarber(id)
    setLoading(false)
    setDeleteId(null)

    if (!result.success) {
      setError(result.error ?? 'Erro ao excluir')
    }

    router.refresh()
  }

  async function handleToggle(barber: Barber) {
    await toggleBarberActive(barber.id, !barber.is_active)
    router.refresh()
  }

  function handlePhoneChange(value: string) {
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, '')

    // Limita a 11 dígitos
    if (cleaned.length <= 11) {
      // Formata enquanto digita
      let formatted = cleaned

      if (cleaned.length > 2) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
      }

      if (cleaned.length > 7) {
        // Coloca hífen
        const part1 = cleaned.slice(0, 2)
        const part2 = cleaned.slice(2, 7)
        const part3 = cleaned.slice(7)
        formatted = `(${part1}) ${part2}-${part3}`
      }

      setForm({ ...form, phone: formatted })
    }
  }

  return (
    <>
      <div className='space-y-8 p-8 md:p-12'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Barbeiros</h1>
            <p className='text-zinc-400'>Gerencie a equipe da barbearia</p>
          </div>
          <Button
            onClick={openCreate}
            className='bg-amber-600 hover:bg-amber-500'
          >
            <Plus className='mr-2 h-4 w-4' />
            Novo Barbeiro
          </Button>
        </div>

        {barbers.length === 0 ? (
          <Card className='border-zinc-700 bg-zinc-900/50'>
            <CardContent className='p-8 text-center'>
              <p className='text-zinc-400'>
                Nenhum barbeiro cadastrado. Clique em &quot;Novo Barbeiro&quot;
                para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {barbers.map((barber) => (
              <Card
                key={barber.id}
                className='border-zinc-700 bg-zinc-900/50 backdrop-blur'
              >
                <CardHeader className='pb-2'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-600/20 text-sm font-bold text-amber-600'>
                        {barber.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={barber.avatar_url}
                            alt={barber.name}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          barber.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <CardTitle className='text-base'>{barber.name}</CardTitle>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${barber.is_active ? 'bg-green-600/20 text-green-500' : 'bg-zinc-700 text-zinc-400'}`}
                    >
                      {barber.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center gap-4 text-sm'>
                    <span className='flex items-center gap-1 text-zinc-400'>
                      <Phone className='h-3.5 w-3.5' />
                      {formatPhone(barber.phone)}
                    </span>
                    <span className='flex items-center gap-1 text-amber-600'>
                      Comissão: {barber.commission_percentage}%
                    </span>
                  </div>

                  {/* Services badges */}
                  {barber.services.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {barber.services.map((s) => (
                        <span
                          key={s.id}
                          className='flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300'
                        >
                          <Scissors className='h-2.5 w-2.5' />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {barber.services.length === 0 && (
                    <p className='text-xs text-zinc-500 italic'>
                      Nenhum serviço vinculado
                    </p>
                  )}

                  <div className='flex gap-2 pt-1'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='flex-1 border-zinc-700 hover:border-amber-600 hover:text-amber-600'
                      onClick={() => openEdit(barber)}
                    >
                      <Pencil className='mr-1 h-3.5 w-3.5' />
                      Editar
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className={`border-zinc-700 ${barber.is_active ? 'hover:border-orange-500 hover:text-orange-500' : 'hover:border-green-500 hover:text-green-500'}`}
                      onClick={() => handleToggle(barber)}
                      title={barber.is_active ? 'Desativar' : 'Ativar'}
                    >
                      <Power className='h-3.5 w-3.5' />
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='border-zinc-700 hover:border-red-500 hover:text-red-500'
                      onClick={() => setDeleteId(barber.id)}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='w-[90%] border-zinc-700 bg-zinc-900 text-white max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Barbeiro' : 'Novo Barbeiro'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <ImageUpload
              label='Foto do barbeiro'
              value={form.avatar_url}
              onChange={(url) => setForm({ ...form, avatar_url: url })}
            />
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Nome</label>
              <Input
                placeholder='Nome completo'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Telefone</label>
              <Input
                placeholder='(11) 99999-9999'
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
              />
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Comissão (%)</label>
              <Input
                type='number'
                min='0'
                max='100'
                step='0.5'
                placeholder='20'
                value={form.commission_percentage}
                onChange={(e) =>
                  setForm({ ...form, commission_percentage: e.target.value })
                }
                required
              />
            </div>

            {/* Services selection */}
            <div className='space-y-2'>
              <label className='text-sm text-zinc-400'>
                Serviços atendidos
              </label>
              {services.length === 0 ? (
                <p className='text-xs text-zinc-500 italic'>
                  Nenhum serviço cadastrado ainda.
                </p>
              ) : (
                <div className='grid grid-cols-1 gap-2 rounded-lg border border-zinc-700 p-3'>
                  {services.map((service) => {
                    const checked = selectedServices.includes(service.id)
                    return (
                      <label
                        key={service.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                          checked
                            ? 'bg-amber-600/10 text-amber-600'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                            checked
                              ? 'border-amber-600 bg-amber-600'
                              : 'border-zinc-600'
                          }`}
                        >
                          {checked && (
                            <svg
                              className='h-2.5 w-2.5 text-white'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M5 13l4 4L19 7'
                              />
                            </svg>
                          )}
                        </div>
                        <input
                          type='checkbox'
                          className='sr-only'
                          checked={checked}
                          onChange={() => toggleService(service.id)}
                        />
                        <div className='flex-1 text-sm'>
                          <span className='font-medium'>{service.name}</span>
                          <span className='ml-2 text-xs text-zinc-500'>
                            {service.duration_minutes} min
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
              {selectedServices.length > 0 && (
                <p className='text-xs text-zinc-500'>
                  {selectedServices.length} serviço(s) selecionado(s)
                </p>
              )}
            </div>

            {error && <p className='text-sm text-red-500'>{error}</p>}
            <DialogFooter className='flex-col-reverse gap-2 sm:flex-row sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                className='border-zinc-700'
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={loading}
                className='bg-amber-600 hover:bg-amber-500'
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className='border-zinc-700 bg-zinc-900 text-white'>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-zinc-400'>
            Tem certeza que deseja excluir este barbeiro? Agendamentos
            vinculados não serão excluídos.
          </p>
          <DialogFooter className='flex-col-reverse gap-2 sm:flex-row sm:gap-0'>
            <Button
              variant='outline'
              className='border-zinc-700'
              onClick={() => setDeleteId(null)}
            >
              Cancelar
            </Button>
            <Button
              className='bg-red-600 hover:bg-red-500'
              disabled={loading}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
