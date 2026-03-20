'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, AlertTriangle, ChevronDown } from 'lucide-react'
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
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/actions/inventory'
import { formatCurrency } from '@/lib/utils'

type InventoryItem = {
  id: string
  name: string
  description: string | null
  quantity: number
  min_quantity: number
  unit_price: number
  category: 'CONSUMO' | 'REVENDA'
}

type Props = {
  items: InventoryItem[]
  barbershop_id: string
}

const emptyForm = {
  name: '',
  description: '',
  quantity: '',
  min_quantity: '5',
  unit_price: '',
  category: 'CONSUMO' as 'CONSUMO' | 'REVENDA',
}

export function InventoryClient({ items, barbershop_id }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('')

  const lowStock = items.filter((i) => i.quantity <= i.min_quantity)
  const filtered = items.filter(
    (i) => !filterCategory || i.category === filterCategory,
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setOpen(true)
  }

  function openEdit(item: InventoryItem) {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description ?? '',
      quantity: String(item.quantity),
      min_quantity: String(item.min_quantity),
      unit_price: String(item.unit_price),
      category: item.category,
    })
    setError('')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const data = {
      name: form.name,
      description: form.description || undefined,
      quantity: parseInt(form.quantity),
      min_quantity: parseInt(form.min_quantity),
      unit_price: parseFloat(form.unit_price),
      category: form.category,
    }

    const result = editing
      ? await updateInventoryItem(editing.id, data)
      : await createInventoryItem(barbershop_id, data)

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
    await deleteInventoryItem(id)
    setLoading(false)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <>
      <div className='space-y-8 p-8 md:p-12'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Estoque</h1>
            <p className='text-zinc-400'>Controle seus produtos e materiais</p>
          </div>
          <Button
            onClick={openCreate}
            className='bg-amber-600 hover:bg-amber-500'
          >
            <Plus className='mr-2 h-4 w-4' />
            Novo Item
          </Button>
        </div>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <Card className='border-orange-700/50 bg-orange-600/10'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-sm text-orange-400'>
                <AlertTriangle className='h-4 w-4' />
                {lowStock.length} item(s) com estoque baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {lowStock.map((item) => (
                  <span
                    key={item.id}
                    className='rounded-full bg-orange-600/20 px-2 py-0.5 text-xs text-orange-400'
                  >
                    {item.name} ({item.quantity}/{item.min_quantity})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter + Table */}
        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>
              {filtered.length} item(s)
            </CardTitle>
            <div className='relative'>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className='h-9 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
              >
                <option value=''>Todas as categorias</option>
                <option value='CONSUMO'>Consumo</option>
                <option value='REVENDA'>Revenda</option>
              </select>
              <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {filtered.length === 0 ? (
              <p className='p-8 text-center text-sm text-zinc-400'>
                Nenhum item encontrado. Clique em &quot;Novo Item&quot; para
                começar.
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-zinc-800 text-left text-zinc-400'>
                      <th className='px-4 py-3 font-medium'>Nome</th>
                      <th className='px-4 py-3 font-medium'>Categoria</th>
                      <th className='px-4 py-3 font-medium'>Qtd</th>
                      <th className='px-4 py-3 font-medium'>Mín.</th>
                      <th className='px-4 py-3 font-medium'>Preço Unit.</th>
                      <th className='px-4 py-3 font-medium'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        className='border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30'
                      >
                        <td className='px-4 py-3'>
                          <p className='font-medium'>{item.name}</p>
                          {item.description && (
                            <p className='text-xs text-zinc-500'>
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className='px-4 py-3'>
                          <span className='rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400'>
                            {item.category}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={
                              item.quantity <= item.min_quantity
                                ? 'font-bold text-orange-400'
                                : ''
                            }
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-zinc-400'>
                          {item.min_quantity}
                        </td>
                        <td className='px-4 py-3 text-amber-600'>
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-zinc-700 hover:border-amber-600 hover:text-amber-600'
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-zinc-700 hover:border-red-500 hover:text-red-500'
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
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

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='border-zinc-700 bg-zinc-900 text-white'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Item' : 'Novo Item de Estoque'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Nome</label>
              <Input
                placeholder='Nome do produto'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>
                Descrição (opcional)
              </label>
              <Input
                placeholder='Descrição'
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Categoria</label>
              <div className='relative'>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as 'CONSUMO' | 'REVENDA',
                    })
                  }
                  className='w-full h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
                >
                  <option value='CONSUMO'>Consumo (uso interno)</option>
                  <option value='REVENDA'>Revenda</option>
                </select>
                <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
              </div>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <label className='text-sm text-zinc-400'>Quantidade</label>
                <Input
                  type='number'
                  min='0'
                  placeholder='0'
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className='space-y-1'>
                <label className='text-sm text-zinc-400'>Qtd Mín.</label>
                <Input
                  type='number'
                  min='0'
                  placeholder='5'
                  value={form.min_quantity}
                  onChange={(e) =>
                    setForm({ ...form, min_quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className='space-y-1'>
                <label className='text-sm text-zinc-400'>Preço Unit.</label>
                <Input
                  type='number'
                  step='0.01'
                  min='0.01'
                  placeholder='0.00'
                  value={form.unit_price}
                  onChange={(e) =>
                    setForm({ ...form, unit_price: e.target.value })
                  }
                  required
                />
              </div>
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

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <DialogContent className='border-zinc-700 bg-zinc-900 text-white'>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-zinc-400'>
            Tem certeza que deseja excluir este item?
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
