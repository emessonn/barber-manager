'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, CheckCircle2, Loader2, WifiOff, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ConnectionStatus = 'loading' | 'open' | 'connecting' | 'close' | 'not_found' | 'unconfigured'

export function WhatsAppTab() {
  const [status, setStatus] = useState<ConnectionStatus>('loading')
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)
  const [disconnectLoading, setDisconnectLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function fetchStatus(): Promise<ConnectionStatus | null> {
    try {
      const res = await fetch('/api/whatsapp/status')
      if (res.status === 503) return 'unconfigured'
      if (!res.ok) return null
      const data = await res.json()
      return (data.status as ConnectionStatus) ?? 'close'
    } catch {
      return null
    }
  }

  useEffect(() => {
    fetchStatus().then((s) => {
      if (s) setStatus(s)
    })
    return () => stopPolling()
  }, [])

  function startPolling() {
    stopPolling()
    pollRef.current = setInterval(async () => {
      const s = await fetchStatus()
      if (s === 'open') {
        setStatus('open')
        setQrcode(null)
        stopPolling()
      } else if (s === 'unconfigured') {
        setStatus('unconfigured')
        stopPolling()
      }
    }, 3000)
  }

  async function handleConnect() {
    setConnectLoading(true)
    setError('')
    try {
      const res = await fetch('/api/whatsapp/connect', { method: 'POST' })
      if (res.status === 503) {
        setStatus('unconfigured')
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao conectar')
        return
      }
      const data = await res.json()
      setQrcode(data.qrcode ?? null)
      setStatus('connecting')
      startPolling()
    } catch (err) {
      setError(String(err))
    } finally {
      setConnectLoading(false)
    }
  }

  async function handleDisconnect() {
    setDisconnectLoading(true)
    setError('')
    stopPolling()
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      setStatus('not_found')
      setQrcode(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setDisconnectLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-6 w-6 animate-spin text-zinc-400' />
      </div>
    )
  }

  if (status === 'unconfigured') {
    return (
      <div className='space-y-4'>
        <div className='flex items-start gap-3 rounded-lg border border-amber-600/30 bg-amber-600/10 p-4'>
          <AlertTriangle className='h-5 w-5 shrink-0 text-amber-500 mt-0.5' />
          <div className='space-y-1'>
            <p className='text-sm font-medium text-amber-400'>
              Evolution API não configurada
            </p>
            <p className='text-sm text-zinc-400'>
              Para usar a integração com WhatsApp, configure as variáveis de ambiente{' '}
              <code className='rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-300'>
                EVOLUTION_API_URL
              </code>{' '}
              e{' '}
              <code className='rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-300'>
                EVOLUTION_API_KEY
              </code>{' '}
              no servidor.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'open') {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-3 rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3'>
          <CheckCircle2 className='h-5 w-5 shrink-0 text-green-400' />
          <div>
            <p className='text-sm font-medium text-green-400'>WhatsApp Conectado</p>
            <p className='text-xs text-zinc-400'>
              Sua barbearia está pronta para enviar e receber mensagens.
            </p>
          </div>
          <span className='ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400'>
            Conectado
          </span>
        </div>

        {error && <p className='text-sm text-red-400'>{error}</p>}

        <Button
          variant='destructive'
          onClick={handleDisconnect}
          disabled={disconnectLoading}
          className='flex items-center gap-2'
        >
          <WifiOff className='h-4 w-4' />
          {disconnectLoading ? 'Desconectando...' : 'Desconectar'}
        </Button>
      </div>
    )
  }

  // Disconnected / not_found / close state — with or without QR code
  return (
    <div className='space-y-6'>
      <div className='flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-4 text-sm text-zinc-400'>
        <MessageCircle className='h-5 w-5 shrink-0 text-amber-500 mt-0.5' />
        <div className='space-y-1'>
          <p className='font-medium text-zinc-300'>Conecte seu WhatsApp</p>
          <p>
            Após conectar, sua barbearia poderá enviar confirmações, lembretes e
            notificações diretamente pelo WhatsApp dos seus clientes.
          </p>
        </div>
      </div>

      {qrcode ? (
        <div className='space-y-4'>
          <div className='flex flex-col items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-900/50 p-6'>
            <div className='flex items-center gap-2 text-sm text-zinc-400'>
              <Loader2 className='h-4 w-4 animate-spin text-amber-500' />
              Aguardando leitura do QR Code...
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrcode}
              alt='QR Code WhatsApp'
              className='h-56 w-56 rounded-lg border border-zinc-700 bg-white p-2'
            />
            <div className='rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-center text-xs text-zinc-400 max-w-xs'>
              <p className='font-medium text-zinc-300 mb-1'>Como escanear:</p>
              <p>
                Abra o WhatsApp no celular → Dispositivos conectados →
                Conectar um dispositivo → Escaneie o QR Code
              </p>
            </div>
          </div>

          <Button
            variant='secondary'
            onClick={handleConnect}
            disabled={connectLoading}
            className='flex items-center gap-2'
          >
            <MessageCircle className='h-4 w-4' />
            {connectLoading ? 'Gerando...' : 'Gerar novo QR Code'}
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-xs text-zinc-400 max-w-sm'>
            <p className='font-medium text-zinc-300 mb-1'>Como conectar:</p>
            <p>
              Abra o WhatsApp no celular → Dispositivos conectados →
              Conectar um dispositivo → Escaneie o QR Code
            </p>
          </div>

          {error && <p className='text-sm text-red-400'>{error}</p>}

          <Button
            onClick={handleConnect}
            disabled={connectLoading}
            className='flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-black font-semibold'
          >
            <MessageCircle className='h-4 w-4' />
            {connectLoading ? 'Aguarde...' : 'Conectar WhatsApp'}
          </Button>
        </div>
      )}
    </div>
  )
}
