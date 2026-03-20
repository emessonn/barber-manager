'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react'
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
import { createService, updateService, deleteService } from '@/actions/services'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

type Service = {
  id: string
  name: string
  price: number
  duration_minutes: number
  description: string | null
  image_url: string | null
  is_active: boolean
}

type Props = {
  services: Service[]
  barbershop_id: string
}

const emptyForm = {
  name: '',
  price: '',
  duration_minutes: '',
  description: '',
  image_url: '',
}

export function ServicesClient({ services, barbershop_id }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    setForm({
      name: service.name,
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
      description: service.description ?? '',
      image_url: service.image_url ?? '',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const data = {
      name: form.name,
      price: parseFloat(form.price),
      duration_minutes: parseInt(form.duration_minutes),
      description: form.description || undefined,
      image_url: form.image_url || null,
    }

    const result = editing
      ? await updateService(editing.id, data)
      : await createService(barbershop_id, data)

    setLoading(false)

    if (!result.success) {
      toast.error(result.error ?? 'Erro ao salvar')
      return
    }

    toast.success('Serviço salvo com sucesso!')
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setLoading(true)
    const result = await deleteService(id)
    setLoading(false)
    setDeleteId(null)

    if (!result.success) {
      toast.error(result.error ?? 'Erro ao excluir')
      return
    }

    router.refresh()
  }

  return (
    <>
      <div className='space-y-8 p-8 md:p-12'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Serviços</h1>
            <p className='text-zinc-400'>Gerencie os serviços oferecidos</p>
          </div>
          <Button
            onClick={openCreate}
            className='bg-amber-600 hover:bg-amber-500'
          >
            <Plus className='mr-2 h-4 w-4' />
            Novo Serviço
          </Button>
        </div>

        {services.length === 0 ? (
          <Card className='border-zinc-700 bg-zinc-900/50'>
            <CardContent className='p-8 text-center'>
              <p className='text-zinc-400'>
                Nenhum serviço cadastrado. Clique em &quot;Novo Serviço&quot;
                para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {services.map((service) => (
              <Card
                key={service.id}
                className='border-zinc-700 bg-zinc-900/50 backdrop-blur'
              >
                {service.image_url && (
                  <div className='h-32 w-full overflow-hidden rounded-t-lg'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
                <CardHeader className='pb-2'>
                  <div className='flex items-start justify-between'>
                    <CardTitle className='text-base'>{service.name}</CardTitle>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${service.is_active ? 'bg-green-600/20 text-green-500' : 'bg-zinc-700 text-zinc-400'}`}
                    >
                      {service.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {service.description && (
                    <p className='text-sm text-zinc-400'>
                      {service.description}
                    </p>
                  )}
                  <div className='flex items-center gap-4 text-sm'>
                    <span className='flex items-center gap-1 text-amber-600'>
                      {formatCurrency(service.price)}
                    </span>
                    <span className='flex items-center gap-1 text-zinc-400'>
                      <Clock className='h-3.5 w-3.5' />
                      {service.duration_minutes} min
                    </span>
                  </div>
                  <div className='flex gap-2 pt-1'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='flex-1 border-zinc-700 hover:border-amber-600 hover:text-amber-600'
                      onClick={() => openEdit(service)}
                    >
                      <Pencil className='mr-1 h-3.5 w-3.5' />
                      Editar
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='border-zinc-700 hover:border-red-500 hover:text-red-500'
                      onClick={() => setDeleteId(service.id)}
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
        <DialogContent className='w-[90%] border-zinc-700 bg-zinc-900 text-white'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Nome</label>
              <Input
                placeholder='Ex: Corte de cabelo'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <label className='text-sm text-zinc-400'>Preço (R$)</label>
                <Input
                  type='number'
                  step='0.01'
                  min='0.01'
                  placeholder='25.00'
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className='space-y-1'>
                <label className='text-sm text-zinc-400'>Duração (min)</label>
                <Input
                  type='number'
                  min='5'
                  max='480'
                  placeholder='30'
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({ ...form, duration_minutes: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>
                Descrição (opcional)
              </label>
              <Input
                placeholder='Descrição do serviço'
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <ImageUpload
              label='Imagem do serviço (opcional)'
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
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
            Tem certeza que deseja excluir este serviço? Esta ação não pode ser
            desfeita.
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
