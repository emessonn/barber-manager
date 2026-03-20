/**
 * WhatsApp Integration via Evolution API (self-hosted, padrão no Brasil)
 *
 * Docs: https://doc.evolution-api.com
 * Setup:
 *   1. Suba uma instância da Evolution API (Docker ou serviço gerenciado)
 *   2. Crie uma instância e conecte via QR Code
 *   3. Configure as env vars abaixo
 *
 * Alternativa: Z-API (https://z-api.io) — mude WHATSAPP_PROVIDER para "zapi"
 *   e ajuste a função sendMessage conforme o endpoint deles.
 */

const API_URL = process.env.EVOLUTION_API_URL ?? ''
const API_KEY = process.env.EVOLUTION_API_KEY ?? ''
const INSTANCE = process.env.EVOLUTION_INSTANCE ?? ''

/** Converte qualquer formato de telefone para o padrão WhatsApp (55XXXXXXXXXXX) */
function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

/**
 * Envia mensagem de texto via WhatsApp.
 * Fire-and-forget: não lança erro se as env vars não estiverem configuradas.
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string,
): Promise<void> {
  if (!API_URL || !API_KEY || !INSTANCE) {
    console.warn('[WhatsApp] Variáveis de ambiente não configuradas. Mensagem não enviada.')
    return
  }

  const number = toWhatsAppNumber(phone)

  try {
    const res = await fetch(`${API_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: API_KEY,
      },
      body: JSON.stringify({ number, text }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[WhatsApp] Erro ao enviar mensagem: ${res.status} ${body}`)
    }
  } catch (err) {
    console.error('[WhatsApp] Falha na requisição:', err)
  }
}

// ─────────────────────────────────────────────
// Templates de mensagem
// ─────────────────────────────────────────────

export function msgConfirmacaoAgendamento(data: {
  clientName: string
  serviceName: string
  barberName: string
  date: string   // ex: "20/03/2026"
  time: string   // ex: "14:30"
  price: string  // ex: "R$ 45,00"
  barbershopName: string
  cancelUrl: string
}): string {
  return (
    `✅ *Agendamento Confirmado!*\n\n` +
    `Olá, ${data.clientName}! Seu agendamento foi confirmado com sucesso.\n\n` +
    `📋 *Serviço:* ${data.serviceName}\n` +
    `💈 *Barbeiro:* ${data.barberName}\n` +
    `📅 *Data:* ${data.date}\n` +
    `🕐 *Hora:* ${data.time}\n` +
    `💰 *Valor:* ${data.price}\n\n` +
    `Para cancelar acesse: ${data.cancelUrl}\n\n` +
    `_${data.barbershopName}_ ✂️`
  )
}

export function msgLembrete24h(data: {
  clientName: string
  serviceName: string
  barberName: string
  date: string
  time: string
  barbershopName: string
}): string {
  return (
    `⏰ *Lembrete de Agendamento*\n\n` +
    `Olá, ${data.clientName}! Você tem um agendamento *amanhã*.\n\n` +
    `💈 *Barbeiro:* ${data.barberName}\n` +
    `📋 *Serviço:* ${data.serviceName}\n` +
    `📅 *Data:* ${data.date}\n` +
    `🕐 *Hora:* ${data.time}\n\n` +
    `Até lá! 👋\n_${data.barbershopName}_`
  )
}

export function msgLembrete2h(data: {
  clientName: string
  barberName: string
  time: string
  barbershopName: string
}): string {
  return (
    `🔔 *Seu atendimento é em breve!*\n\n` +
    `Olá, ${data.clientName}! Seu horário é em aproximadamente *2 horas*.\n\n` +
    `💈 *${data.barberName}* está esperando você\n` +
    `🕐 *${data.time}*\n\n` +
    `Até já! ✂️\n_${data.barbershopName}_`
  )
}

export function msgOtpLogin(data: {
  otp: string
  barbershopName: string
}): string {
  return (
    `🔐 *Código de acesso - ${data.barbershopName}*\n\n` +
    `Seu código para entrar é:\n\n` +
    `*${data.otp}*\n\n` +
    `_Este código expira em 5 minutos. Não compartilhe com ninguém._`
  )
}

export function msgPagamentoConfirmado(data: {
  clientName: string
  serviceName: string
  price: string
  barbershopName: string
}): string {
  return (
    `💚 *Pagamento Confirmado!*\n\n` +
    `Olá, ${data.clientName}! Recebemos seu pagamento.\n\n` +
    `📋 *Serviço:* ${data.serviceName}\n` +
    `💰 *Valor:* ${data.price}\n\n` +
    `Até logo! ✂️\n_${data.barbershopName}_`
  )
}
