'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp, TrendingDown, DollarSign, ChevronDown, Trash2, Clock } from 'lucide-react'
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
import { createFinancialRecord, deleteFinancialRecord } from '@/actions/finances'
import { formatCurrency, formatDateBR } from '@/lib/utils'
import { cn } from '@/lib/utils'

type FinancialRecord = {
  id: string
  type: string
  amount: number
  description: string
  category: string | null
  created_at: Date
  booking_id: string | null
}

type Props = {
  records: FinancialRecord[]
  barbershop_id: string
  totalIncome: number
  totalExpense: number
  predictedRevenue: number
}

const CATEGORIES = [
  'SERVIÇO',
  'PRODUTO',
  'ALUGUEL',
  'SALÁRIO',
  'MATERIAL',
  'OUTROS',
]

const emptyForm = {
  type: 'ENTRADA' as 'ENTRADA' | 'SAIDA',
  amount: '',
  description: '',
  category: 'OUTROS',
}

export function FinancesClient({
  records,
  barbershop_id,
  totalIncome,
  totalExpense,
  predictedRevenue,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')

  const balance = totalIncome - totalExpense

  const filtered = records.filter(
    (r) => !filterType || r.type === filterType,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await createFinancialRecord(barbershop_id, {
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Erro ao salvar')
      return
    }

    setOpen(false)
    setForm(emptyForm)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setLoading(true)
    await deleteFinancialRecord(id)
    setLoading(false)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <>
      <div className='space-y-8 p-8 md:p-12'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Finanças</h1>
            <p className='text-zinc-400'>Controle de receitas e despesas</p>
          </div>
          <Button
            onClick={() => {
              setForm(emptyForm)
              setError('')
              setOpen(true)
            }}
            className='bg-amber-600 hover:bg-amber-500'
          >
            <Plus className='mr-2 h-4 w-4' />
            Novo Lançamento
          </Button>
        </div>

        {/* Summary Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Receitas</CardTitle>
              <TrendingUp className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-green-500'>
                {formatCurrency(totalIncome)}
              </p>
              <p className='mt-1 text-xs text-zinc-500'>Pagamentos confirmados</p>
            </CardContent>
          </Card>

          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Despesas</CardTitle>
              <TrendingDown className='h-4 w-4 text-red-400' />
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-red-400'>
                {formatCurrency(totalExpense)}
              </p>
              <p className='mt-1 text-xs text-zinc-500'>Total de saídas</p>
            </CardContent>
          </Card>

          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Saldo Real</CardTitle>
              <DollarSign className='h-4 w-4 text-amber-600' />
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  'text-2xl font-bold',
                  balance >= 0 ? 'text-amber-600' : 'text-red-400',
                )}
              >
                {formatCurrency(balance)}
              </p>
              <p className='mt-1 text-xs text-zinc-500'>Receitas − Despesas</p>
            </CardContent>
          </Card>

          <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur border-dashed'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Saldo Previsto</CardTitle>
              <Clock className='h-4 w-4 text-blue-400' />
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-blue-400'>
                {formatCurrency(balance + predictedRevenue)}
              </p>
              <p className='mt-1 text-xs text-zinc-500'>
                +{formatCurrency(predictedRevenue)} a receber
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter + Table */}
        <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>Lançamentos</CardTitle>
            <div className='relative'>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className='h-9 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
              >
                <option value=''>Todos</option>
                <option value='ENTRADA'>Receitas</option>
                <option value='SAIDA'>Despesas</option>
              </select>
              <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {filtered.length === 0 ? (
              <p className='p-8 text-center text-sm text-zinc-400'>
                Nenhum lançamento encontrado.
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-zinc-800 text-left text-zinc-400'>
                      <th className='px-4 py-3 font-medium'>Descrição</th>
                      <th className='px-4 py-3 font-medium'>Categoria</th>
                      <th className='px-4 py-3 font-medium'>Data</th>
                      <th className='px-4 py-3 font-medium'>Valor</th>
                      <th className='px-4 py-3 font-medium'></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record) => (
                      <tr
                        key={record.id}
                        className='border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30'
                      >
                        <td className='px-4 py-3'>
                          <p>{record.description}</p>
                          <span
                            className={cn(
                              'text-xs',
                              record.type === 'ENTRADA'
                                ? 'text-green-500'
                                : 'text-red-400',
                            )}
                          >
                            {record.type === 'ENTRADA' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-zinc-400'>
                          {record.category ?? '-'}
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap text-zinc-400'>
                          {formatDateBR(record.created_at)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 font-medium',
                            record.type === 'ENTRADA'
                              ? 'text-green-500'
                              : 'text-red-400',
                          )}
                        >
                          {record.type === 'SAIDA' ? '-' : ''}
                          {formatCurrency(record.amount)}
                        </td>
                        <td className='px-4 py-3'>
                          {!record.booking_id && (
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-zinc-700 hover:border-red-500 hover:text-red-500'
                              onClick={() => setDeleteId(record.id)}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
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

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='border-zinc-700 bg-zinc-900 text-white'>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Tipo</label>
              <div className='relative'>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as 'ENTRADA' | 'SAIDA',
                    })
                  }
                  className='w-full h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
                >
                  <option value='ENTRADA'>Receita</option>
                  <option value='SAIDA'>Despesa</option>
                </select>
                <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
              </div>
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Valor (R$)</label>
              <Input
                type='number'
                step='0.01'
                min='0.01'
                placeholder='0.00'
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Descrição</label>
              <Input
                placeholder='Descrição do lançamento'
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>
            <div className='space-y-1'>
              <label className='text-sm text-zinc-400'>Categoria</label>
              <div className='relative'>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className='w-full h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 pr-8 text-sm text-white focus:border-amber-600 focus:outline-none'
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500' />
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
            Deseja excluir este lançamento?
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
