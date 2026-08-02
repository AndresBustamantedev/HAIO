'use client'

import * as React from 'react'
import { LoaderIcon, CheckCircleIcon } from 'lucide-react'

type Props = {
  token: string
  invoiceId: string
  amountDue: number
  currency: string
  stripeIntegrationId: string | null
  paypalIntegrationId: string | null
  paypalClientId: string | null
}

type PayState = 'idle' | 'loading' | 'success' | 'error'

export function PaymentOptions({
  token,
  invoiceId,
  amountDue,
  currency,
  stripeIntegrationId,
  paypalIntegrationId,
  paypalClientId,
}: Props) {
  const [stripeState, setStripeState] = React.useState<PayState>('idle')
  const [stripeError, setStripeError] = React.useState<string | null>(null)
  const [paypalLoaded, setPaypalLoaded] = React.useState(false)
  const [paypalState, setPaypalState] = React.useState<PayState>('idle')
  const [paypalError, setPaypalError] = React.useState<string | null>(null)
  const [paid, setPaid] = React.useState(false)
  const paypalContainerRef = React.useRef<HTMLDivElement>(null)

  // Check for Stripe callback (?stripe_session=xxx)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('stripe_session')
    if (!sessionId || !stripeIntegrationId) return

    setStripeState('loading')
    fetch('/api/pay/stripe-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, sessionId, integrationId: stripeIntegrationId }),
    })
      .then((r) => r.json())
      .then((data: { success?: boolean; error?: string }) => {
        if (data.success) {
          setPaid(true)
          setStripeState('success')
          window.history.replaceState({}, '', window.location.pathname)
        } else {
          setStripeState('error')
          setStripeError(data.error ?? 'No se pudo verificar el pago.')
        }
      })
      .catch(() => {
        setStripeState('error')
        setStripeError('Error al verificar el pago. Contacta con soporte si ya has pagado.')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load PayPal SDK
  React.useEffect(() => {
    if (!paypalClientId || !paypalIntegrationId) return
    if (typeof window === 'undefined') return

    const scriptId = 'paypal-sdk'
    if (document.getElementById(scriptId)) {
      setPaypalLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency.toUpperCase()}&intent=capture`
    script.onload = () => setPaypalLoaded(true)
    script.onerror = () => setPaypalError('No se pudo cargar el SDK de PayPal.')
    document.head.appendChild(script)
  }, [paypalClientId, paypalIntegrationId, currency])

  // Render PayPal buttons once SDK is loaded
  React.useEffect(() => {
    if (!paypalLoaded || !paypalContainerRef.current || !paypalIntegrationId) return

    const paypal = (window as unknown as { paypal?: { Buttons?: (opts: unknown) => { render: (el: HTMLElement) => void } } }).paypal
    if (!paypal?.Buttons) return

    paypalContainerRef.current.innerHTML = ''

    paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
      createOrder: async () => {
        const res = await fetch('/api/pay/paypal-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, integrationId: paypalIntegrationId }),
        })
        const data = await res.json() as { orderId?: string; error?: string }
        if (!data.orderId) throw new Error(data.error ?? 'No se pudo crear el pedido de PayPal.')
        return data.orderId
      },
      onApprove: async (orderData: { orderID: string }) => {
        setPaypalState('loading')
        try {
          const res = await fetch('/api/pay/paypal-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, orderId: orderData.orderID, integrationId: paypalIntegrationId }),
          })
          const data = await res.json() as { success?: boolean; error?: string }
          if (data.success) {
            setPaid(true)
            setPaypalState('success')
          } else {
            setPaypalState('error')
            setPaypalError(data.error ?? 'No se pudo completar el pago.')
          }
        } catch {
          setPaypalState('error')
          setPaypalError('Error al procesar el pago. Contacta con soporte.')
        }
      },
      onError: () => {
        setPaypalState('error')
        setPaypalError('El pago con PayPal fue cancelado o falló.')
      },
    }).render(paypalContainerRef.current)
  }, [paypalLoaded, paypalIntegrationId, token])

  const hasAnyOption = stripeIntegrationId || paypalIntegrationId

  if (paid || stripeState === 'success' || paypalState === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <CheckCircleIcon className="size-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-foreground">¡Pago completado!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hemos recibido tu pago. Gracias.
        </p>
      </div>
    )
  }

  if (!hasAnyOption) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        El emisor de esta factura no tiene métodos de pago online configurados.
        Contacta con ellos para saber cómo pagar.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium text-foreground">Elige cómo pagar</p>

      {/* Stripe */}
      {stripeIntegrationId && (
        <div className="space-y-2">
          <button
            disabled={stripeState === 'loading'}
            onClick={async () => {
              setStripeState('loading')
              setStripeError(null)
              try {
                const res = await fetch('/api/pay/stripe-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token, integrationId: stripeIntegrationId }),
                })
                const data = await res.json() as { url?: string; error?: string }
                if (data.url) {
                  window.location.href = data.url
                } else {
                  setStripeState('error')
                  setStripeError(data.error ?? 'No se pudo iniciar el pago con Stripe.')
                }
              } catch {
                setStripeState('error')
                setStripeError('Error de red. Inténtalo de nuevo.')
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#635BFF]/30 bg-[#635BFF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4B44CC] disabled:opacity-60"
          >
            {stripeState === 'loading'
              ? <LoaderIcon className="size-4 animate-spin" />
              : (
                <svg viewBox="0 0 24 10" className="h-4" fill="currentColor" aria-hidden="true">
                  <path d="M11.335 1.97C9.3 1.97 8.07 3.01 8.07 4.42c0 2.93 4.37 2.16 4.37 3.44 0 .55-.5.87-1.4.87-.95 0-2.1-.43-2.94-1.01v2.2c.9.41 1.82.62 2.94.62 2.11 0 3.39-1.02 3.39-2.47 0-3.06-4.38-2.3-4.38-3.49 0-.48.44-.76 1.2-.76.85 0 1.87.38 2.6.9V3.06c-.8-.37-1.6-.57-2.52-.57l.01.48zm4.43-.4v1.45h-1.53V4.9h1.53V8.7c0 1.74.92 2.3 2.73 2.3.5 0 1.02-.06 1.5-.17V9.03c-.37.07-.73.12-1.1.12-.64 0-.95-.22-.95-.88V4.9h2.08V2.97h-2.08V1.08l-2.18.49zM4.68 3.02C3.38 3.02 2.3 3.65 1.73 4.7V3.1H0V11h2.12V6.37c.55-1.04 1.3-1.5 2.22-1.5.6 0 1.06.2 1.06.2V3c-.2-.03-.48-.05-.72.02zm11.74-.05c-2.48 0-4 1.68-4 4.06 0 2.57 1.64 4.08 4.22 4.08 1.1 0 2.07-.28 2.84-.79V8.3c-.75.55-1.7.87-2.68.87-1.1 0-1.88-.44-2.12-1.35h5.07c.04-.24.07-.5.07-.8 0-2.34-1.33-4.05-3.4-4.05zm-1.72 3.28c.2-.9.78-1.43 1.7-1.43.89 0 1.42.53 1.53 1.43h-3.23z"/>
                </svg>
              )
            }
            {stripeState === 'loading' ? 'Redirigiendo...' : 'Pagar con tarjeta (Stripe)'}
          </button>
          {stripeError && <p className="text-center text-xs text-destructive">{stripeError}</p>}
        </div>
      )}

      {/* Separador */}
      {stripeIntegrationId && paypalIntegrationId && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o también con</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* PayPal */}
      {paypalIntegrationId && (
        <div className="space-y-2">
          {paypalState === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <LoaderIcon className="size-4 animate-spin" />
              Procesando pago con PayPal…
            </div>
          )}
          {paypalError && <p className="text-center text-xs text-destructive">{paypalError}</p>}
          {paypalState !== 'loading' && (
            <div ref={paypalContainerRef} className="min-h-[48px]" />
          )}
          {!paypalLoaded && !paypalError && paypalState === 'idle' && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <LoaderIcon className="size-3 animate-spin" />
              Cargando PayPal…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
