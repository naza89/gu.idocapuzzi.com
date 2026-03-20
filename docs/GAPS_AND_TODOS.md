# GÜIDO CAPUZZI — Estado real y tareas pendientes

> Última actualización: 2026-03-16

## Resumen de estado

| Área | Estado | Notas |
|------|--------|-------|
| Frontend (UI/UX) | Funcional | SPA completa con todas las secciones |
| Supabase (DB) | Operativo | 8 migraciones ejecutadas, datos cargados |
| OCA cotización | Funcional | `/api/oca/cotizar` y `/api/oca/sucursales` andando |
| OCA crear envío | Implementado, sin testear | Falta test end-to-end con credenciales reales |
| NAVE pagos | Implementado, sandbox inestable | Errores de timeout del lado NAVE |
| Deploy Vercel | Operativo | CI/CD desde GitHub |
| Dominio | Configurado | guidocapuzzi.com con HTTPS |

## Lo que funciona

- Home page con hero, secciones de campaña y selvedge
- Navegación SPA completa (shop, producto, carrito, cuenta, contacto, legales)
- Catálogo de productos con filtros por categoría
- Product Detail Page con selector de talle y consulta de stock real (Supabase)
- Carrito funcional (agregar, eliminar, actualizar cantidad)
- Checkout Step 1: formulario de datos personales → Supabase
- Checkout Step 2: cotización OCA + selección de envío → PATCH orden
- Checkout Step 3: integración NAVE (SDK + QR) — implementada pero no testeada end-to-end
- API routes de OCA: cotizar, sucursales, centros de costo
- API routes de NAVE: crear-pago, webhook
- Health check endpoint

## Lo que está implementado pero NO testeado

1. **NAVE pagos end-to-end** — El código está completo pero el sandbox de NAVE tuvo errores de timeout (`stores_error: AxiosError-timeout`). No es un bug del código, es inestabilidad de NAVE sandbox.
2. **OCA crear envío** — La API route existe y tiene lógica completa, pero no se probó con credenciales reales.
3. **OCA etiqueta/tracking/anular** — Implementados pero dependen de tener un envío creado.
4. **Webhook NAVE** — Implementado con procesamiento async, pero necesita URL pública para testear (ngrok en local, Vercel en producción).

## Lo que FALTA

### Prioridad ALTA (bloquea lanzamiento)

- [ ] **Testear NAVE pagos completo** — Reintentar con sandbox estable o contactar `integraciones@navenegocios.com`
- [ ] **Registrar notification_url en NAVE** — Para que el webhook reciba notificaciones
- [ ] **Variables de entorno en Vercel** — Verificar que `NAVE_CLIENT_ID`, `NAVE_CLIENT_SECRET`, `NAVE_POS_ID` estén configuradas en Vercel Dashboard
- [ ] **Página de confirmación post-pago** — El usuario necesita ver "Pago exitoso" con resumen de orden
- [ ] **Decrementar stock** — Al recibir webhook APPROVED, descontar stock de `variantes_producto`

### Prioridad MEDIA (necesario para operar)

- [ ] **OCA crear envío post-pago** — Automatizar creación de envío cuando el pago es confirmado
- [ ] **Email de confirmación** — Enviar email al cliente con resumen de orden + tracking
- [ ] **Panel de administración** — Para gestionar órdenes, ver pagos, cambiar estados
- [ ] **Carrito persistente** — Actualmente es en memoria, se pierde al recargar la página
- [ ] **Manejo de errores en checkout** — Mostrar errores claros al usuario si falla cotización/pago

### Prioridad BAJA (nice-to-have)

- [ ] **SEO meta tags** — Open Graph, Twitter cards por producto
- [ ] **Google Analytics / Meta Pixel** — Tracking de conversiones
- [ ] **Códigos de descuento** — Columna existe en DB pero no hay UI ni validación
- [ ] **Newsletter** — Columna `newsletter` en clientes pero sin integración con email service
- [ ] **Búsqueda de productos** — El overlay de búsqueda existe en el HTML pero la lógica no está implementada
- [ ] **Responsive testing** — Verificar todos los breakpoints en mobile/tablet

## Bugs conocidos

- NAVE sandbox devuelve `stores_error: AxiosError-timeout of 10000ms exceeded` intermitentemente
- NAVE sandbox devuelve `qr_generator_error: Token cache invokation fault` para QR MODO
- Ambos son problemas del lado NAVE, no del código

## Decisiones pendientes

- **OCA**: Solo Puerta a Puerta, o también Sucursal? (actualmente el frontend muestra ambas opciones)
- **OCA**: ConfirmarRetiro = true o false al crear envío?
- **OCA**: Crear envío automáticamente al pagar, o manualmente desde admin?
- **Producción NAVE**: Cuándo migrar de sandbox a producción? (requiere credenciales de producción del banco)
