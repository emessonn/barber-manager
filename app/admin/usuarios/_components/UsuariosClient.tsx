'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Copy,
  Check,
  Scissors,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createStaffUser,
  updateStaffUser,
  resetStaffPassword,
  deleteStaffUser,
} from '@/actions/staff-users'

type StaffUser = {
  id: string
  name: string | null
  login: string | null
  role: string
  created_at: Date
  barber: { id: string; name: string; avatar_url: string | null } | null
}

type Barber = { id: string; name: string; user_id: string | null }

interface UsuariosClientProps {
  staffUsers: StaffUser[]
  barbers: Barber[]
  barbershopSlug: string
}

const roleLabels: Record<string, string> = {
  BARBER: 'Barbeiro',
  RECEPCAO: 'Recepção',
}

const roleColors: Record<string, string> = {
  BARBER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  RECEPCAO: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const roleIcons: Record<string, React.ElementType> = {
  BARBER: Scissors,
  RECEPCAO: ClipboardList,
}

export function UsuariosClient({ staffUsers, barbers, barbershopSlug }: UsuariosClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<StaffUser | null>(null)
  const [resetUser, setResetUser] = useState<StaffUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<StaffUser | null>(null)
  const [copiedSlug, setCopiedSlug] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    login: '',
    password: '',
    role: 'BARBER',
    barber_id: '',
  })
  const [editForm, setEditForm] = useState({ name: '', role: 'BARBER', barber_id: '' })
  const [newPassword, setNewPassword] = useState('')

  function copyLoginUrl() {
    navigator.clipboard.writeText(`${window.location.origin}/staff-login`)
    setCopiedSlug(true)
    setTimeout(() => setCopiedSlug(false), 2000)
  }

  function handleCreateOpen() {
    setCreateForm({ name: '', login: '', password: '', role: 'BARBER', barber_id: '' })
    setShowCreate(true)
  }

  function handleEditOpen(user: StaffUser) {
    setEditForm({
      name: user.name ?? '',
      role: user.role,
      barber_id: user.barber?.id ?? '',
    })
    setEditUser(user)
  }

  function availableBarbersForEdit(currentUserId?: string) {
    return barbers.filter(
      (b) => !b.user_id || b.user_id === currentUserId,
    )
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createStaffUser({
        name: createForm.name,
        login: createForm.login,
        password: createForm.password,
        role: createForm.role as 'BARBER' | 'RECEPCAO',
        barber_id: createForm.barber_id || undefined,
      })
      if (result.success) {
        toast.success('Usuário criado com sucesso!')
        setShowCreate(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Erro ao criar usuário')
      }
    })
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    startTransition(async () => {
      const result = await updateStaffUser(editUser.id, {
        name: editForm.name,
        role: editForm.role as 'BARBER' | 'RECEPCAO',
        barber_id: editForm.barber_id || null,
      })
      if (result.success) {
        toast.success('Usuário atualizado com sucesso!')
        setEditUser(null)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Erro ao atualizar usuário')
      }
    })
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUser) return
    startTransition(async () => {
      const result = await resetStaffPassword(resetUser.id, newPassword)
      if (result.success) {
        toast.success('Senha redefinida com sucesso!')
        setResetUser(null)
        setNewPassword('')
      } else {
        toast.error(result.error ?? 'Erro ao redefinir senha')
      }
    })
  }

  function handleDelete() {
    if (!deleteUser) return
    startTransition(async () => {
      const result = await deleteStaffUser(deleteUser.id)
      if (result.success) {
        toast.success('Usuário removido com sucesso!')
        setDeleteUser(null)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Erro ao remover usuário')
      }
    })
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            <Users className='h-6 w-6 text-amber-600' />
            Usuários da Equipe
          </h1>
          <p className='text-sm text-zinc-400 mt-1'>
            Gerencie os acessos de barbeiros e recepção
          </p>
        </div>
        <Button
          onClick={handleCreateOpen}
          className='bg-amber-600 hover:bg-amber-500 text-black font-semibold'
        >
          <Plus className='h-4 w-4 mr-2' />
          Novo Usuário
        </Button>
      </div>

      {/* Login URL Card */}
      <Card className='border-zinc-800 bg-zinc-900/50'>
        <CardContent className='pt-4 pb-4'>
          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <div>
              <p className='text-sm font-medium text-zinc-300'>Link de acesso da equipe</p>
              <p className='text-xs text-zinc-500 mt-0.5'>
                Compartilhe este link com seus funcionários. Eles precisarão do slug da barbearia:{' '}
                <span className='text-amber-600 font-mono'>{barbershopSlug}</span>
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={copyLoginUrl}
              className='border-zinc-700 text-zinc-300 hover:text-white shrink-0'
            >
              {copiedSlug ? (
                <><Check className='h-3.5 w-3.5 mr-1.5 text-green-500' /> Copiado!</>
              ) : (
                <><Copy className='h-3.5 w-3.5 mr-1.5' /> Copiar link</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {staffUsers.length === 0 ? (
        <Card className='border-zinc-800 bg-zinc-900/50'>
          <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
            <Users className='h-12 w-12 text-zinc-600 mb-4' />
            <p className='text-zinc-400 font-medium'>Nenhum usuário cadastrado</p>
            <p className='text-zinc-500 text-sm mt-1'>
              Crie usuários para sua equipe de barbeiros e recepção
            </p>
            <Button
              onClick={handleCreateOpen}
              className='mt-4 bg-amber-600 hover:bg-amber-500 text-black font-semibold'
            >
              <Plus className='h-4 w-4 mr-2' />
              Criar primeiro usuário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-3'>
          {staffUsers.map((user) => {
            const Icon = roleIcons[user.role] ?? Users
            return (
              <Card key={user.id} className='border-zinc-800 bg-zinc-900/50'>
                <CardContent className='flex items-center gap-4 py-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 shrink-0'>
                    <Icon className='h-5 w-5 text-zinc-400' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='font-medium text-white'>{user.name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${roleColors[user.role]}`}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </div>
                    <p className='text-sm text-zinc-400 mt-0.5'>
                      Login: <span className='font-mono text-zinc-300'>{user.login}</span>
                      {user.barber && (
                        <span className='ml-2 text-zinc-500'>
                          • Barbeiro: {user.barber.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-zinc-400 hover:text-blue-400'
                      onClick={() => { setResetUser(user); setNewPassword('') }}
                      title='Redefinir senha'
                    >
                      <KeyRound className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-zinc-400 hover:text-amber-400'
                      onClick={() => handleEditOpen(user)}
                      title='Editar'
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-zinc-400 hover:text-red-400'
                      onClick={() => setDeleteUser(user)}
                      title='Remover'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className='border-zinc-800 bg-zinc-900 sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div className='space-y-2'>
              <Label>Nome completo</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder='João Silva'
                required
                className='border-zinc-700 bg-zinc-800/50'
              />
            </div>

            <div className='space-y-2'>
              <Label>Login</Label>
              <Input
                value={createForm.login}
                onChange={(e) =>
                  setCreateForm({ ...createForm, login: e.target.value.toLowerCase() })
                }
                placeholder='joao.silva'
                required
                className='border-zinc-700 bg-zinc-800/50 font-mono'
              />
              <p className='text-xs text-zinc-500'>
                Somente letras minúsculas, números, pontos e hífens
              </p>
            </div>

            <div className='space-y-2'>
              <Label>Senha inicial</Label>
              <Input
                type='password'
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder='Mínimo 6 caracteres'
                required
                className='border-zinc-700 bg-zinc-800/50'
              />
            </div>

            <div className='space-y-2'>
              <Label>Função</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v, barber_id: '' })}
              >
                <SelectTrigger className='border-zinc-700 bg-zinc-800/50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='border-zinc-700 bg-zinc-900'>
                  <SelectItem value='BARBER'>Barbeiro</SelectItem>
                  <SelectItem value='RECEPCAO'>Recepção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createForm.role === 'BARBER' && (
              <div className='space-y-2'>
                <Label>Vincular ao barbeiro (opcional)</Label>
                <Select
                  value={createForm.barber_id}
                  onValueChange={(v) => setCreateForm({ ...createForm, barber_id: v })}
                >
                  <SelectTrigger className='border-zinc-700 bg-zinc-800/50'>
                    <SelectValue placeholder='Selecione um barbeiro...' />
                  </SelectTrigger>
                  <SelectContent className='border-zinc-700 bg-zinc-900'>
                    <SelectItem value=''>Nenhum</SelectItem>
                    {barbers
                      .filter((b) => !b.user_id)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className='text-xs text-zinc-500'>
                  Vincula este login ao cadastro do barbeiro para ver seus agendamentos
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setShowCreate(false)}
                className='text-zinc-400'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-amber-600 hover:bg-amber-500 text-black font-semibold'
              >
                {isPending ? 'Criando...' : 'Criar usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className='border-zinc-800 bg-zinc-900 sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className='space-y-4'>
            <div className='space-y-2'>
              <Label>Nome completo</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                className='border-zinc-700 bg-zinc-800/50'
              />
            </div>

            <div className='space-y-2'>
              <Label>Função</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v, barber_id: '' })}
              >
                <SelectTrigger className='border-zinc-700 bg-zinc-800/50'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='border-zinc-700 bg-zinc-900'>
                  <SelectItem value='BARBER'>Barbeiro</SelectItem>
                  <SelectItem value='RECEPCAO'>Recepção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editForm.role === 'BARBER' && (
              <div className='space-y-2'>
                <Label>Vincular ao barbeiro</Label>
                <Select
                  value={editForm.barber_id}
                  onValueChange={(v) => setEditForm({ ...editForm, barber_id: v })}
                >
                  <SelectTrigger className='border-zinc-700 bg-zinc-800/50'>
                    <SelectValue placeholder='Selecione um barbeiro...' />
                  </SelectTrigger>
                  <SelectContent className='border-zinc-700 bg-zinc-900'>
                    <SelectItem value=''>Nenhum</SelectItem>
                    {availableBarbersForEdit(editUser?.id).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setEditUser(null)}
                className='text-zinc-400'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-amber-600 hover:bg-amber-500 text-black font-semibold'
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent className='border-zinc-800 bg-zinc-900 sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className='space-y-4'>
            <p className='text-sm text-zinc-400'>
              Definir nova senha para{' '}
              <span className='font-medium text-white'>{resetUser?.name}</span>
            </p>
            <div className='space-y-2'>
              <Label>Nova senha</Label>
              <Input
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='Mínimo 6 caracteres'
                required
                className='border-zinc-700 bg-zinc-800/50'
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setResetUser(null)}
                className='text-zinc-400'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-amber-600 hover:bg-amber-500 text-black font-semibold'
              >
                {isPending ? 'Salvando...' : 'Redefinir senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent className='border-zinc-800 bg-zinc-900'>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription className='text-zinc-400'>
              O usuário <span className='font-medium text-white'>{deleteUser?.name}</span> perderá
              acesso imediatamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-zinc-700 text-zinc-300 hover:text-white'>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className='bg-red-600 hover:bg-red-500 text-white'
            >
              {isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
