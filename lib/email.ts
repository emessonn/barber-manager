/**
 * Email Integration via Resend (https://resend.com)
 *
 * Setup:
 *   1. Crie uma conta em resend.com
 *   2. Verifique seu domínio e crie uma API key
 *   3. Configure as env vars abaixo
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@barbearia.app'

/** Retorna true se o email via Resend está configurado */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY
}

/**
 * Envia email via Resend API (raw HTTP, sem pacote externo).
 * Retorna true se enviado com sucesso, false caso contrário.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!RESEND_API_KEY || !to) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[Email] Erro ao enviar: ${res.status} ${body}`)
      return false
    }

    return true
  } catch (err) {
    console.error('[Email] Falha na requisição:', err)
    return false
  }
}

/** Template HTML para email de OTP */
export function htmlOtpEmail(otp: string, barbershopName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#18181b;color:#e4e4e7;border-radius:12px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#f4f4f5;">🔐 Código de acesso</h2>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;">${barbershopName}</p>
      <p style="margin:0 0 12px;color:#d4d4d8;">Seu código para entrar é:</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#d97706;padding:20px;background:#1c1917;border-radius:10px;text-align:center;">
        ${otp}
      </div>
      <p style="margin:20px 0 0;color:#71717a;font-size:12px;">
        Este código expira em 5 minutos. Não compartilhe com ninguém.
      </p>
    </div>
  `
}
