/**
 * MercadoPago Integration via REST API
 *
 * Melhor opção para o Brasil por:
 *   - Domina o mercado (+ de 50% dos e-commerces brasileiros)
 *   - PIX nativo (confirmação instantânea, sem taxas para o cliente)
 *   - Cartão de crédito com parcelamento
 *   - SDK oficial disponível, mas aqui usamos fetch direto (sem dependência extra)
 *
 * Docs: https://www.mercadopago.com.br/developers
 * Setup:
 *   1. Crie uma conta em mercadopago.com.br/developers
 *   2. Crie um app em "Suas integrações"
 *   3. Copie o Access Token (produção ou teste)
 *   4. Configure MERCADOPAGO_ACCESS_TOKEN no .env
 */

const BASE_URL = 'https://api.mercadopago.com'
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  }
}

export interface PreferenceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id?: string // default BRL
}

export interface CreatePreferenceInput {
  items: PreferenceItem[]
  payer?: {
    name?: string
    email?: string
    phone?: { number: string }
  }
  /** IDs dos bookings separados por vírgula — usado no webhook para atualizar o status */
  external_reference: string
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  /** URL pública para receber notificações de pagamento */
  notification_url: string
}

export interface Preference {
  id: string
  init_point: string        // URL de checkout em produção
  sandbox_init_point: string // URL de checkout em sandbox
}

export interface MercadoPagoPayment {
  id: number
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded'
  status_detail: string
  external_reference: string
  transaction_amount: number
  payment_method_id: string // pix, credit_card, etc.
  date_approved: string | null
}

/** Cria uma preferência de pagamento e retorna a URL de checkout */
export async function createPreference(
  input: CreatePreferenceInput,
): Promise<Preference> {
  if (!ACCESS_TOKEN) {
    throw new Error('[MercadoPago] MERCADOPAGO_ACCESS_TOKEN não configurado.')
  }

  const res = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      ...input,
      // auto_return requires back_urls.success to be a valid HTTPS URL — only safe in production
      ...(input.back_urls.success.startsWith('https://') ? { auto_return: 'approved' } : {}),
      payment_methods: {
        // Prioriza PIX mas aceita cartão também
        excluded_payment_types: [],
        installments: 12, // parcelamento em até 12x
      },
      statement_descriptor: 'BARBEARIA', // nome no extrato do cartão
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[MercadoPago] Erro ao criar preference: ${res.status} ${body}`)
  }

  return res.json()
}

/** Busca os detalhes de um pagamento pelo ID (usado no webhook) */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
  if (!ACCESS_TOKEN) {
    throw new Error('[MercadoPago] MERCADOPAGO_ACCESS_TOKEN não configurado.')
  }

  const res = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[MercadoPago] Erro ao buscar pagamento: ${res.status} ${body}`)
  }

  return res.json()
}

/** Emite reembolso total de um pagamento aprovado */
export async function refundPayment(paymentId: string): Promise<void> {
  if (!ACCESS_TOKEN) {
    throw new Error('[MercadoPago] MERCADOPAGO_ACCESS_TOKEN não configurado.')
  }

  const res = await fetch(`${BASE_URL}/v1/payments/${paymentId}/refunds`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[MercadoPago] Erro ao reembolsar: ${res.status} ${body}`)
  }
}

/** Valida a assinatura do webhook enviada pelo MercadoPago */
export function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string,
): boolean {
  if (!xSignature || !xRequestId || !secret) return false

  // Formato: ts=<timestamp>,v1=<hash>
  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=')),
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const payload = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const { createHmac } = require('crypto') as typeof import('crypto')
  const expected = createHmac('sha256', secret).update(payload).digest('hex')

  return expected === v1
}
