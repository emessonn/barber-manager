'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Clock, Building2, CalendarX, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'
import { TimeInput } from '@/components/ui/time-input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  updateBarbershopWorkingHours,
  updateBarbershopInfo,
} from '@/actions/barbershop'
import { type WorkingHours } from '@/lib/validators'
import { ExceptionsTab, type ExceptionItem } from './ExceptionsTab'
import { WhatsAppTab } from './WhatsAppTab'

const DAYS_PT: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DAYS_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: { open: true, start: '09:00', end: '18:00' },
  tuesday: { open: true, start: '09:00', end: '18:00' },
  wednesday: { open: true, start: '09:00', end: '18:00' },
  thursday: { open: true, start: '09:00', end: '18:00' },
  friday: { open: true, start: '09:00', end: '19:00' },
  saturday: { open: true, start: '09:00', end: '15:00' },
  sunday: { open: false, start: null, end: null },
}

type Barbershop = {
  id: string
  name: string
  phone: string
  address: string
  comission_rate: number
  logo_url: string | null
  working_hours: WorkingHours | null
}

type Props = {
  barbershop: Barbershop
  exceptions: ExceptionItem[]
}

export function SettingsClient({ barbershop, exceptions }: Props) {
  const router = useRouter()

  const [infoForm, setInfoForm] = useState({
    name: barbershop.name,
    phone: barbershop.phone,
    address: barbershop.address,
    comission_rate: String(barbershop.comission_rate),
    logo_url: barbershop.logo_url ?? '',
  })

  const [hours, setHours] = useState<WorkingHours>(
    barbershop.working_hours ?? DEFAULT_WORKING_HOURS,
  )

  const [savingInfo, setSavingInfo] = useState(false)
  const [savingHours, setSavingHours] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [hoursError, setHoursError] = useState('')
  const [infoSuccess, setInfoSuccess] = useState(false)
  const [hoursSuccess, setHoursSuccess] = useState(false)

  function setDayField(
    day: string,
    field: 'open' | 'start' | 'end',
    value: string | boolean,
  ) {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof WorkingHours],
        [field]: value,
        // when closing, clear times
        ...(field === 'open' && !value ? { start: null, end: null } : {}),
        // when opening, set defaults if empty
        ...(field === 'open' && value
          ? {
              start: prev[day as keyof WorkingHours].start ?? '09:00',
              end: prev[day as keyof WorkingHours].end ?? '18:00',
            }
          : {}),
      },
    }))
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

      setInfoForm({ ...infoForm, phone: formatted })
    }
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSavingInfo(true)
    setInfoError('')
    setInfoSuccess(false)

    const result = await updateBarbershopInfo(barbershop.id, {
      name: infoForm.name,
      phone: infoForm.phone,
      address: infoForm.address,
      comission_rate: parseFloat(infoForm.comission_rate),
      logo_url: infoForm.logo_url || undefined,
    })

    setSavingInfo(false)
    console.log('RESULT_ERROR:', result.error)
    if (!result.success) {
      setInfoError(result.error ?? 'Erro ao salvar')
      return
    }

    setInfoSuccess(true)
    router.refresh()
  }

  async function handleSaveHours() {
    setSavingHours(true)
    setHoursError('')
    setHoursSuccess(false)

    const result = await updateBarbershopWorkingHours(barbershop.id, hours)

    setSavingHours(false)

    if (!result.success) {
      setHoursError(result.error ?? 'Erro ao salvar')
      return
    }

    setHoursSuccess(true)
    router.refresh()
  }

  return (
    <div className='space-y-8 p-8 md:p-12'>
      <div>
        <h1 className='text-3xl font-bold'>Configurações</h1>
        <p className='text-zinc-400'>
          Gerencie as informações da sua barbearia
        </p>
      </div>

      <Card className='border-zinc-700 bg-zinc-900/50 backdrop-blur'>
        <CardContent className='p-6'>
          <Tabs defaultValue='info'>
            <TabsList className='w-full'>
              <TabsTrigger value='info' className='flex flex-1 items-center gap-2'>
                <Building2 className='h-4 w-4 shrink-0' />
                <span className='hidden sm:inline'>Informações</span>
              </TabsTrigger>
              <TabsTrigger value='hours' className='flex flex-1 items-center gap-2'>
                <Clock className='h-4 w-4 shrink-0' />
                <span className='hidden sm:inline'>Horários</span>
              </TabsTrigger>
              <TabsTrigger value='exceptions' className='flex flex-1 items-center gap-2'>
                <CalendarX className='h-4 w-4 shrink-0' />
                <span className='hidden sm:inline'>Exceções</span>
              </TabsTrigger>
              <TabsTrigger value='whatsapp' className='flex flex-1 items-center gap-2'>
                <MessageCircle className='h-4 w-4 shrink-0' />
                <span className='hidden sm:inline'>WhatsApp</span>
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value='info' className='mt-6'>
              <form onSubmit={handleSaveInfo} className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm text-zinc-400'>Nome</label>
                    <Input
                      value={infoForm.name}
                      onChange={(e) =>
                        setInfoForm({ ...infoForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm text-zinc-400'>Telefone</label>
                    <Input
                      value={infoForm.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='space-y-1'>
                  <label className='text-sm text-zinc-400'>Endereço</label>
                  <Input
                    value={infoForm.address}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, address: e.target.value })
                    }
                    required
                  />
                </div>
                <div className='space-y-1 max-w-xs'>
                  <label className='text-sm text-zinc-400'>
                    Comissão padrão (%)
                  </label>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    step='0.5'
                    value={infoForm.comission_rate}
                    onChange={(e) =>
                      setInfoForm({
                        ...infoForm,
                        comission_rate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <ImageUpload
                  label='Logo da barbearia'
                  value={infoForm.logo_url}
                  onChange={(url) =>
                    setInfoForm({ ...infoForm, logo_url: url })
                  }
                />
                {infoError && (
                  <p className='text-sm text-red-500'>{infoError}</p>
                )}
                {infoSuccess && (
                  <p className='text-sm text-green-500'>Salvo com sucesso!</p>
                )}
                <Button
                  type='submit'
                  disabled={savingInfo}
                  className='bg-amber-600 hover:bg-amber-500'
                >
                  <Save className='mr-2 h-4 w-4' />
                  {savingInfo ? 'Salvando...' : 'Salvar informações'}
                </Button>
              </form>
            </TabsContent>

            {/* Hours Tab */}
            <TabsContent value='hours' className='mt-6'>
              <div className='space-y-4'>
                <div className='space-y-3'>
                  {DAYS_ORDER.map((day) => {
                    const dayData = hours[day as keyof WorkingHours]
                    return (
                      <div
                        key={day}
                        className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:gap-4 ${
                          dayData.open
                            ? 'border-zinc-700 bg-zinc-800/50'
                            : 'border-zinc-800 bg-zinc-900/30 opacity-60'
                        }`}
                      >
                        {/* Toggle + Day name */}
                        <div className='flex flex-shrink-0 items-center gap-3 sm:w-40'>
                          <Switch
                            checked={dayData.open}
                            onCheckedChange={(checked) =>
                              setDayField(day, 'open', checked)
                            }
                          />
                          <span className='text-sm font-medium'>
                            {DAYS_PT[day]}
                          </span>
                        </div>

                        {/* Hours */}
                        {dayData.open ? (
                          <div className='flex flex-wrap items-end gap-2 text-sm flex-1'>
                            <TimeInput
                              label='Abertura'
                              value={dayData.start ?? '09:00'}
                              onChange={(value) =>
                                setDayField(day, 'start', value)
                              }
                            />
                            <TimeInput
                              label='Fechamento'
                              value={dayData.end ?? '18:00'}
                              onChange={(value) =>
                                setDayField(day, 'end', value)
                              }
                            />
                          </div>
                        ) : (
                          <span className='text-sm text-zinc-500'>Fechado</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {hoursError && (
                  <p className='text-sm text-red-500'>{hoursError}</p>
                )}
                {hoursSuccess && (
                  <p className='text-sm text-green-500'>Horários salvos!</p>
                )}

                <Button
                  type='button'
                  disabled={savingHours}
                  onClick={handleSaveHours}
                  className='bg-amber-600 hover:bg-amber-500'
                >
                  <Save className='mr-2 h-4 w-4' />
                  {savingHours ? 'Salvando...' : 'Salvar horários'}
                </Button>
              </div>
            </TabsContent>

            {/* Exceptions Tab */}
            <TabsContent value='exceptions' className='mt-6'>
              <ExceptionsTab barbershop_id={barbershop.id} exceptions={exceptions} />
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value='whatsapp' className='mt-6'>
              <WhatsAppTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
