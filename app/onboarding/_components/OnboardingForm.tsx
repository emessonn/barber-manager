'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBarbershopSchema, type CreateBarbershopInput } from '@/lib/validators'
import { createBarbershop } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { Loader2 } from 'lucide-react'

export function OnboardingForm({ userName }: { userName?: string | null }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBarbershopInput>({
    resolver: zodResolver(createBarbershopSchema),
    defaultValues: { name: '', slug: '', phone: '', address: '', logo_url: '' },
  })

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setValue('name', name)
    setValue('slug', generateSlug(name))
  }

  async function onSubmit(data: CreateBarbershopInput) {
    setServerError(null)
    const result = await createBarbershop(data)

    if (result.error) {
      setServerError(result.error)
      return
    }

    router.push('/admin/dashboard')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      {/* Barbershop Name */}
      <div className='space-y-1.5'>
        <label className='text-sm font-medium text-zinc-300'>
          Nome da Barbearia
        </label>
        <Input
          {...register('name')}
          onChange={onNameChange}
          placeholder='Ex: Barbearia do João'
        />
        {errors.name && (
          <p className='text-xs text-red-400'>{errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div className='space-y-1.5'>
        <label className='text-sm font-medium text-zinc-300'>
          Link público{' '}
          <span className='text-zinc-500 font-normal'>(URL do seu perfil)</span>
        </label>
        <div className='flex items-center rounded-md border border-zinc-700 bg-zinc-900 focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600'>
          <span className='pl-3 text-sm text-zinc-500 whitespace-nowrap'>
            seusite.com/
          </span>
          <input
            {...register('slug')}
            value={watch('slug')}
            onChange={(e) => setValue('slug', generateSlug(e.target.value))}
            className='flex-1 bg-transparent py-2 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none'
            placeholder='barbearia-do-joao'
          />
        </div>
        {errors.slug && (
          <p className='text-xs text-red-400'>{errors.slug.message}</p>
        )}
      </div>

      {/* Logo */}
      <div className='space-y-1.5'>
        <label className='text-sm font-medium text-zinc-300'>
          Logo da Barbearia{' '}
          <span className='text-zinc-500 font-normal'>(opcional)</span>
        </label>
        <ImageUpload
          value={watch('logo_url') ?? ''}
          onChange={(url) => setValue('logo_url', url)}
          label=''
        />
      </div>

      {/* Phone */}
      <div className='space-y-1.5'>
        <label className='text-sm font-medium text-zinc-300'>Telefone / WhatsApp</label>
        <Input
          {...register('phone')}
          placeholder='(11) 99999-9999'
          type='tel'
          onChange={(e) => setValue('phone', formatPhone(e.target.value))}
          value={watch('phone')}
        />
        {errors.phone && (
          <p className='text-xs text-red-400'>{errors.phone.message}</p>
        )}
      </div>

      {/* Address */}
      <div className='space-y-1.5'>
        <label className='text-sm font-medium text-zinc-300'>Endereço</label>
        <Input
          {...register('address')}
          placeholder='Rua, número - Bairro, Cidade - UF'
        />
        {errors.address && (
          <p className='text-xs text-red-400'>{errors.address.message}</p>
        )}
      </div>

      {serverError && (
        <p className='rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400'>
          {serverError}
        </p>
      )}

      <Button
        type='submit'
        disabled={isSubmitting}
        size='lg'
        className='w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold'
      >
        {isSubmitting ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Criando sua barbearia...
          </>
        ) : (
          'Criar Barbearia'
        )}
      </Button>
    </form>
  )
}
