'use client'

import { useState } from 'react'
import { Copy, Check, Link } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BookingLinkCopyProps {
  bookingUrl: string
}

export function BookingLinkCopy({ bookingUrl }: BookingLinkCopyProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className='border-amber-600/30 bg-amber-600/5 backdrop-blur'>
      <CardContent className='flex items-center justify-between gap-4 p-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <Link className='h-4 w-4 shrink-0 text-amber-600' />
          <div className='min-w-0'>
            <p className='text-sm font-medium text-zinc-200'>Link de Agendamento</p>
            <p className='truncate text-xs text-zinc-400'>{bookingUrl}</p>
          </div>
        </div>
        <Button
          size='sm'
          variant='outline'
          onClick={handleCopy}
          className='shrink-0 border-amber-600/40 bg-transparent text-amber-600 hover:bg-amber-600/10 hover:text-amber-500'
        >
          {copied ? (
            <>
              <Check className='mr-1.5 h-3.5 w-3.5' />
              Copiado!
            </>
          ) : (
            <>
              <Copy className='mr-1.5 h-3.5 w-3.5' />
              Copiar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
