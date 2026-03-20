# GÜIDO CAPUZZI — Automation Vision

> Placeholder — a completar a medida que se definan las automatizaciones.

## Visión

Automatizar el flujo post-venta para minimizar intervención manual:

1. **Pago confirmado** → decrementar stock automáticamente
2. **Pago confirmado** → crear envío OCA automáticamente (o notificar para creación manual)
3. **Envío creado** → enviar email con tracking al cliente
4. **Entrega confirmada** → actualizar estado de orden

## Herramientas a evaluar

- Supabase Edge Functions para lógica serverless
- Supabase Database Webhooks para triggers automáticos
- Resend / SendGrid para emails transaccionales
- Vercel Cron Jobs para tareas periódicas (ej: verificar estados de envío)

## Estado actual

Todo manual. Las automatizaciones se implementarán después de validar el flujo de pagos end-to-end.
