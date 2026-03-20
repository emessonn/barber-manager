'use client'

import { useRef, useState } from 'react'
import { Link, Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export function ImageUpload({ value, onChange, label = 'Imagem', className }: Props) {
  const [mode, setMode] = useState<'url' | 'file'>('url')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    const blob = URL.createObjectURL(file)
    setLocalPreview(blob)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setUploadError(json.error ?? 'Erro ao enviar')
        setLocalPreview(null)
        return
      }

      onChange(json.url)
      setLocalPreview(null)
    } catch {
      setUploadError('Erro ao enviar arquivo')
      setLocalPreview(null)
    } finally {
      setUploading(false)
      // reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const dt = new DataTransfer()
    dt.items.add(file)
    if (inputRef.current) {
      inputRef.current.files = dt.files
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  const preview = localPreview ?? value

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className='text-sm text-zinc-400'>{label}</label>}

      {/* Mode tabs */}
      <div className='flex gap-1 rounded-lg border border-zinc-700 p-1'>
        <button
          type='button'
          onClick={() => setMode('url')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors',
            mode === 'url' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          <Link className='h-3.5 w-3.5' />
          URL
        </button>
        <button
          type='button'
          onClick={() => setMode('file')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors',
            mode === 'file' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          <Upload className='h-3.5 w-3.5' />
          Arquivo
        </button>
      </div>

      {/* Input area */}
      {mode === 'url' ? (
        <Input
          placeholder='https://exemplo.com/imagem.jpg'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-700 p-6 transition-colors hover:border-zinc-500',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <input
            ref={inputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp,image/gif'
            className='sr-only'
            onChange={handleFileChange}
          />
          <Upload className='h-7 w-7 text-zinc-500' />
          <p className='text-sm text-zinc-400'>
            {uploading ? 'Enviando...' : 'Clique ou arraste uma imagem'}
          </p>
          <p className='text-xs text-zinc-600'>PNG, JPG, WEBP, GIF — máx. 5MB</p>
        </div>
      )}

      {uploadError && <p className='text-xs text-red-500'>{uploadError}</p>}

      {/* Preview */}
      {preview && (
        <div className='relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-700'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt='Preview'
            className='h-full w-full object-cover'
            onError={() => {
              if (!localPreview) onChange('')
            }}
          />
          <button
            type='button'
            onClick={() => {
              onChange('')
              setLocalPreview(null)
            }}
            className='absolute right-1 top-1 rounded-full bg-black/60 p-0.5 transition-colors hover:bg-red-600/80'
          >
            <X className='h-3 w-3 text-white' />
          </button>
        </div>
      )}
    </div>
  )
}
