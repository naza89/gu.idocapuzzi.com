# Security guidance for GÜIDO CAPUZZI

E-commerce de moda independiente argentina. Stack: Next.js 16 App Router + Supabase + Vercel.
Pagos con NAVE (Banco Galicia), envíos con OCA ePak, emails con Resend.

## Notas de contexto para el revisor

- `dangerouslySetInnerHTML` en `src/app/page.tsx` es **intencional y seguro**: el HTML es estático y generado por el dev, no por input de usuarios. No reportar como vulnerabilidad.
- `eval()` no se usa en el proyecto. Si aparece, sí reportar.
- Las API routes usan `createAdminClient()` (service_role) deliberadamente para bypass de RLS — esto es correcto. Solo reportar si se usa en rutas públicas sin validar identidad.

## Reglas críticas de seguridad del proyecto

### Variables de entorno
- **NUNCA** usar el prefijo `NEXT_PUBLIC_` para secretos de backend (service_role key, tokens de NAVE, credenciales OCA, Resend API key)
- Variables permitidas en `NEXT_PUBLIC_`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — son públicas por diseño
- Cualquier otra variable sensible sin prefijo `NEXT_PUBLIC_`

### Webhooks de pago
- Todo webhook de NAVE (`/api/webhooks/nave`) debe responder 200 inmediatamente y procesar async
- La validación de autenticidad del webhook debe ocurrir ANTES de procesar el cuerpo
- Los webhooks deben ser idempotentes — no procesar el mismo evento dos veces

### OCA
- Las URLs al webservice de OCA contienen usuario y contraseña como query params — NO loguear estas URLs completas en console.log o console.error
- Formato: `?usr=EMAIL&psw=PASSWORD&...` — censurar en logs

### Supabase
- `createAdminClient()` (service_role) solo debe usarse en rutas API del servidor, nunca en código que corra en el browser
- RLS debe estar habilitado en todas las tablas que exponen datos de clientes

### Credenciales en código
- No hardcodear secrets, tokens, o API keys en ningún archivo (ni en comentarios)
- El secret de OCA (`X-OCA-Secret`) debe venir exclusivamente de variables de entorno

### Logging
- No loguear access tokens de OAuth2, API keys, ni datos de tarjetas de crédito
- Los IDs de órdenes y datos de envío pueden loguearse (son operacionales, no secretos)
