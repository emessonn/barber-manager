/**
 * SMS Integration via Twilio (https://twilio.com)
 *
 * Setup:
 *   1. Crie uma conta em twilio.com
 *   2. Compre ou use um número de teste
 *   3. Configure as env vars abaixo
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? ''
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? ''

/** Retorna true se o SMS via Twilio está configurado */
export function isSmsConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER)
}

/** Converte telefone para formato E.164 (+55XXXXXXXXXXX) */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? `+${digits}` : `+55${digits}`
}

/**
 * Envia SMS via Twilio API (raw HTTP, sem pacote externo).
 * Retorna true se enviado com sucesso, false caso contrário.
 */
export async function sendSms(phone: string, body: string): Promise<boolean> {
  if (!isSmsConfigured()) {
    console.warn('[SMS] Variáveis de ambiente não configuradas. Mensagem não enviada.')
    return false
  }

  const toNumber = toE164(phone)
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_FROM_NUMBER,
          To: toNumber,
          Body: body,
        }).toString(),
      },
    )

    if (!res.ok) {
      const text = await res.text()
      console.error(`[SMS] Erro ao enviar: ${res.status} ${text}`)
      return false
    }

    return true
  } catch (err) {
    console.error('[SMS] Falha na requisição:', err)
    return false
  }
}
