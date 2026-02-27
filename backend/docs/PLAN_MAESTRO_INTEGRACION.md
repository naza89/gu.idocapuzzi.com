# PLAN MAESTRO DE INTEGRACIÓN
## OCA ePak + Galicia NAVE + Infraestructura Profesional

**Fecha**: 13 de Febrero 2026  
**Versión**: 1.0 (Unificación de planes)  
**Estado Actual**: Desarrollo local sin backend ni deployment

---

## 📚 Documentos de Referencia

Este plan maestro **fusiona y reordena** dos planes previos:

1. **PLAN_INTEGRACION_OCA.md** - Plan original de integración OCA ePak
2. **Plan_Infraestructura_Galicia_NAVE.pdf** - Plan de infraestructura y deployment

**Para detalles técnicos específicos**, consultar los documentos originales. Este plan maestro define el **orden de ejecución correcto** y las **modificaciones necesarias**.

---

## 🔄 Cambios Principales al Plan Original de OCA

### ❌ LO QUE CAMBIA

| Aspecto | Plan OCA Original | Plan Maestro Actualizado |
|---------|-------------------|-------------------------|
| **Ubicación Backend** | `frontend/src/services/oca/` | `app/api/oca/` (Next.js API Routes) |
| **Cliente HTTP** | Llamadas directas desde navegador | API Routes como proxy |
| **Estructura** | Frontend standalone | Monorepo Next.js (frontend + backend) |
| **Deployment** | No contemplado | Vercel con CI/CD automático |
| **Variables de Entorno** | `.env` local | Vercel Dashboard (encriptado) |
| **Prioridad** | Empezar por OCA | Empezar por infraestructura |

### ⚠️ POR QUÉ CAMBIA

1. **CORS**: OCA API espera llamadas server-side, no desde navegador
2. **Seguridad**: Credenciales OCA no pueden exponerse en frontend
3. **Galicia es urgente**: Ya están pidiendo URLs de webhook
4. **Sin backend no hay webhooks**: Necesitamos infraestructura deployada primero
5. **Profesionalismo**: Desarrollo local ya no es sostenible

---

## 🏗️ Arquitectura Unificada

### Stack Tecnológico Final

```
┌─────────────────────────────────────────────────────────┐
│                    DOMINIO (Hostinger)                   │
│                   https://tudominio.com                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Hosting)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              NEXT.JS 14 (Monorepo)                │  │
│  │  ┌─────────────────┐  ┌──────────────────────┐   │  │
│  │  │   FRONTEND      │  │   BACKEND (API)      │   │  │
│  │  │   (/app)        │  │   (/app/api)         │   │  │
│  │  │                 │  │                      │   │  │
│  │  │ • Páginas       │  │ • /oca/cotizar       │   │  │
│  │  │ • Componentes   │  │ • /oca/sucursales    │   │  │
│  │  │ • Checkout UI   │  │ • /oca/crear-envio   │   │  │
│  │  │                 │  │ • /ordenes           │   │  │
│  │  │                 │  │ • /productos         │   │  │
│  │  │                 │  │ • /webhooks/galicia  │   │  │
│  │  └─────────────────┘  └──────────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴────────────────────┐
        ↓                                        ↓
┌──────────────────┐                  ┌──────────────────┐
│  SUPABASE (DB)   │                  │  SERVICIOS EXTERNOS│
│                  │                  │                  │
│ • productos      │                  │ • OCA API        │
│ • ordenes        │                  │ • Galicia NAVE   │
│ • clientes       │                  │                  │
│ • envios_oca     │                  │                  │
└──────────────────┘                  └──────────────────┘
```

### Estructura de Carpetas Actualizada

```
mi-tienda/
├── app/
│   ├── api/                          # 🔴 BACKEND (API Routes)
│   │   ├── oca/
│   │   │   ├── cotizar/
│   │   │   │   └── route.ts          # POST /api/oca/cotizar
│   │   │   ├── sucursales/
│   │   │   │   └── route.ts          # GET /api/oca/sucursales
│   │   │   ├── crear-envio/
│   │   │   │   └── route.ts          # POST /api/oca/crear-envio
│   │   │   ├── tracking/
│   │   │   │   └── route.ts          # GET /api/oca/tracking
│   │   │   └── etiqueta/
│   │   │       └── route.ts          # GET /api/oca/etiqueta
│   │   │
│   │   ├── productos/
│   │   │   └── route.ts              # GET/POST /api/productos
│   │   │
│   │   ├── ordenes/
│   │   │   ├── route.ts              # GET/POST /api/ordenes
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PATCH /api/ordenes/[id]
│   │   │
│   │   ├── webhooks/
│   │   │   └── galicia/
│   │   │       └── route.ts          # POST /api/webhooks/galicia
│   │   │
│   │   └── health/
│   │       └── route.ts              # GET /api/health
│   │
│   ├── (pages)/                      # 🟢 FRONTEND (Páginas)
│   │   ├── page.tsx                  # Home
│   │   ├── productos/
│   │   │   └── page.tsx              # Catálogo
│   │   ├── carrito/
│   │   │   └── page.tsx              # Carrito
│   │   ├── checkout/
│   │   │   └── page.tsx              # Proceso de compra
│   │   └── admin/
│   │       ├── ordenes/
│   │       │   └── page.tsx          # Admin órdenes
│   │       └── envios/
│   │           └── page.tsx          # Admin envíos OCA
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/                       # Componentes reutilizables
│   ├── checkout/
│   │   ├── DatosCliente.tsx
│   │   ├── SeleccionEnvio.tsx
│   │   ├── CotizadorOCA.tsx
│   │   └── SelectorSucursal.tsx
│   └── ui/
│       └── ...
│
├── lib/                              # 🔵 LÓGICA COMPARTIDA
│   ├── supabase.ts                   # Cliente Supabase
│   │
│   ├── oca/                          # Módulo OCA
│   │   ├── client.ts                 # Cliente HTTP OCA
│   │   ├── xml-generator.ts          # Generador XML
│   │   ├── xml-parser.ts             # Parser XML
│   │   ├── types.ts                  # TypeScript types
│   │   ├── validations.ts            # Validaciones
│   │   └── calculators.ts            # Cálculos peso/volumen
│   │
│   ├── galicia/                      # Módulo Galicia
│   │   ├── client.ts                 # Cliente API Galicia
│   │   ├── signature.ts              # Validación firma
│   │   └── types.ts                  # TypeScript types
│   │
│   └── utils/
│       └── ...
│
├── types/                            # TypeScript definitions
│   ├── producto.ts
│   ├── orden.ts
│   ├── envio.ts
│   └── webhook.ts
│
├── .env.local                        # Variables locales (NO commitear)
├── .env.example                      # Template
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

**📌 Diferencia Clave con Plan OCA Original:**
- ❌ **Antes**: `frontend/src/services/oca/` (todo en frontend)
- ✅ **Ahora**: `app/api/oca/` (API Routes) + `lib/oca/` (lógica compartida)

---

## 🎯 Orden de Ejecución Correcto

### FASE 0: Preparación (1 día)
**Objetivo**: Tener claridad y documentación

- [x] Leer **Plan_Infraestructura_Galicia_NAVE.pdf** completo
- [x] Leer **PLAN_INTEGRACION_OCA.md** completo
- [x] Entender este plan maestro
- [ ] Obtener credenciales necesarias (Hostinger, GitHub)

---

### FASE 1: Infraestructura Base (2-3 días)
**Objetivo**: Pasar de local a deployment profesional

📄 **Ver secciones 4-5 del Plan Galicia NAVE (PDF)**

#### 1.1 Registro de Dominio
- [ ] Registrar dominio en Hostinger
- [ ] Configurar nameservers de Vercel
- [ ] Esperar propagación DNS (1-24h)

⏱️ Tiempo: 1 hora + espera

#### 1.2 Setup de GitHub
- [ ] Crear repositorio privado
- [ ] Crear branches: `main`, `staging`, `develop`
- [ ] Proteger branch `main`
- [ ] Clonar repo localmente

⏱️ Tiempo: 30 minutos

#### 1.3 Migración a Next.js
- [ ] Instalar Next.js 14 con TypeScript
- [ ] Migrar código existente de Antigravity
- [ ] Configurar Tailwind CSS
- [ ] Crear estructura de carpetas (ver arriba)
- [ ] Migrar componentes a `/components`
- [ ] Migrar páginas a `/app`

⏱️ Tiempo: 1-2 días

#### 1.4 Primer Deploy
- [ ] Push a GitHub
- [ ] Conectar Vercel con GitHub
- [ ] Configurar proyecto en Vercel
- [ ] Deploy inicial
- [ ] Verificar URL: `mi-tienda.vercel.app`

⏱️ Tiempo: 1 hora

**✅ Checkpoint 1**: Tienes Next.js deployado en Vercel

---

### FASE 2: Conexión a Supabase (1 día)
**Objetivo**: Backend conectado a base de datos

📄 **Ver FASE 1 del Plan OCA (md) + Sección 3 del Plan Galicia (PDF)**

#### 2.1 Configuración Supabase
- [ ] Instalar `@supabase/supabase-js`
- [ ] Crear `lib/supabase.ts`
- [ ] Obtener API keys de Supabase
- [ ] Configurar variables en Vercel

⏱️ Tiempo: 1 hora

#### 2.2 API Routes Básicas
- [ ] Crear `/api/productos/route.ts`
- [ ] Crear `/api/ordenes/route.ts`
- [ ] Crear `/api/health/route.ts`
- [ ] Probar endpoints con Thunder Client/Postman

⏱️ Tiempo: 3 horas

#### 2.3 Frontend → Backend
- [ ] Migrar lectura de productos desde API
- [ ] Crear servicio de órdenes
- [ ] Verificar catálogo funciona

⏱️ Tiempo: 2 horas

**✅ Checkpoint 2**: Frontend consume tu propio backend

---

### FASE 3: Checkout Básico (2 días)
**Objetivo**: Flujo de compra sin pagos/envíos

📄 **Ver FASE 2 del Plan OCA (md)**

#### 3.1 Formulario de Cliente
- [ ] Componente `DatosCliente.tsx`
- [ ] Validación de campos
- [ ] Guardar cliente en Supabase
- [ ] Guardar dirección de envío

⏱️ Tiempo: 4 horas

#### 3.2 Creación de Orden
- [ ] Endpoint `POST /api/ordenes`
- [ ] Crear orden con estado `pendiente`
- [ ] Insertar items de orden
- [ ] Vincular con cliente

⏱️ Tiempo: 3 horas

#### 3.3 UI de Checkout
- [ ] Página `/checkout`
- [ ] Steps: Datos → Envío → Pago
- [ ] Navegación entre steps
- [ ] Estado del carrito

⏱️ Tiempo: 4 horas

**✅ Checkpoint 3**: Checkout funciona hasta selección de envío

---

### FASE 4: Integración Galicia NAVE (2-3 días)
**Objetivo**: Webhooks de pago funcionando

📄 **Ver sección 8 del Plan Galicia NAVE (PDF)**

#### 4.1 Webhook Endpoint
- [ ] Crear `/api/webhooks/galicia/route.ts`
- [ ] Implementar validación de firma
- [ ] Parsear body del webhook
- [ ] Actualizar orden en Supabase
- [ ] Logging de eventos

⏱️ Tiempo: 4 horas

#### 4.2 Lógica de Pago
- [ ] Integrar SDK/API de Galicia en frontend
- [ ] Crear flow de pago en checkout
- [ ] Manejar respuestas (aprobado/rechazado)
- [ ] Redirecciones según estado

⏱️ Tiempo: 6 horas

#### 4.3 Testing Sandbox
- [ ] Configurar credenciales sandbox en Vercel
- [ ] Probar flujo completo de pago
- [ ] Verificar webhook recibe notificaciones
- [ ] Validar actualización de órdenes

⏱️ Tiempo: 4 horas

#### 4.4 URLs a Galicia
- [ ] Proporcionar URL sandbox
- [ ] Documentar respuestas esperadas
- [ ] Esperar validación de Galicia
- [ ] Configurar producción cuando aprueben

⏱️ Tiempo: 1 hora

**✅ Checkpoint 4**: Galicia NAVE integrado y funcionando

---

### FASE 5: Integración OCA (3-4 días)
**Objetivo**: Cotización y creación de envíos

📄 **Ver FASES 3-6 del Plan OCA (md)**

#### 5.1 Módulo OCA Base
- [ ] Crear estructura `/lib/oca/`
- [ ] Implementar `xml-generator.ts`
- [ ] Implementar `xml-parser.ts`
- [ ] Implementar `client.ts`
- [ ] Definir types en `types.ts`

⏱️ Tiempo: 5 horas

#### 5.2 Cotización de Envío
- [ ] Crear `/api/oca/cotizar/route.ts`
- [ ] Integrar con API OCA (Tarifar_Envio_Corporativo)
- [ ] Calcular peso/volumen de productos
- [ ] Componente `CotizadorOCA.tsx` en checkout
- [ ] Mostrar opciones de envío con precios

⏱️ Tiempo: 6 horas

#### 5.3 Sucursales OCA
- [ ] Crear `/api/oca/sucursales/route.ts`
- [ ] Integrar con API OCA (GetCentrosImposicion...)
- [ ] Componente `SelectorSucursal.tsx`
- [ ] Permitir elección entre domicilio/sucursal

⏱️ Tiempo: 4 horas

#### 5.4 Creación de Envío
- [ ] Crear `/api/oca/crear-envio/route.ts`
- [ ] Implementar lógica post-pago
- [ ] Trigger: webhook Galicia aprueba pago → crear envío OCA
- [ ] Guardar número de tracking en orden
- [ ] Tabla `envios_oca` en Supabase

⏱️ Tiempo: 6 hours

#### 5.5 Tracking
- [ ] Crear `/api/oca/tracking/route.ts`
- [ ] Página admin para ver estado de envíos
- [ ] Mostrar tracking al cliente

⏱️ Tiempo: 3 horas

**✅ Checkpoint 5**: OCA completamente integrado

---

### FASE 6: Testing y Refinamiento (2 días)
**Objetivo**: Sistema robusto y sin bugs

#### 6.1 Testing Integral
- [ ] Flujo completo: producto → carrito → checkout → pago → envío
- [ ] Probar con credenciales sandbox (OCA y Galicia)
- [ ] Edge cases: pagos rechazados, timeouts, etc.
- [ ] Manejo de errores en cada endpoint

⏱️ Tiempo: 8 horas

#### 6.2 Optimizaciones
- [ ] Performance del sitio
- [ ] SEO básico
- [ ] Responsive design
- [ ] Loading states
- [ ] Mensajes de error amigables

⏱️ Tiempo: 6 horas

**✅ Checkpoint 6**: Sistema completo y testeado

---

### FASE 7: Producción (1 día)
**Objetivo**: Go live con credenciales reales

📄 **Ver sección 13 del Plan Galicia NAVE (PDF)**

#### 7.1 Configuración Producción
- [ ] Actualizar variables de entorno en Vercel (producción)
- [ ] Credenciales reales de Galicia
- [ ] Credenciales reales de OCA ePak
- [ ] Verificar dominio apunta correctamente

⏱️ Tiempo: 2 horas

#### 7.2 Deploy a Producción
- [ ] Merge de `staging` a `main`
- [ ] Deploy automático a `tudominio.com`
- [ ] Verificar HTTPS funciona
- [ ] Proporcionar URLs finales a Galicia

⏱️ Tiempo: 1 hora

#### 7.3 Monitoreo Inicial
- [ ] Realizar orden de prueba real
- [ ] Monitorear logs en Vercel
- [ ] Verificar webhooks
- [ ] Verificar creación de envío en panel ePak

⏱️ Tiempo: 2 horas

**✅ Checkpoint 7**: Sistema en producción 🚀

---

## 📊 Resumen de Tiempos

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 0 | Preparación | 1 día |
| 1 | Infraestructura Base | 2-3 días |
| 2 | Conexión Supabase | 1 día |
| 3 | Checkout Básico | 2 días |
| 4 | Galicia NAVE | 2-3 días |
| 5 | OCA ePak | 3-4 días |
| 6 | Testing | 2 días |
| 7 | Producción | 1 día |
| **TOTAL** | **14-17 días** | **~3 semanas** |

---

## 🔑 Variables de Entorno Completas

### Configurar en Vercel Dashboard

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Galicia NAVE
GALICIA_API_KEY=tu_api_key
GALICIA_MERCHANT_ID=tu_merchant_id
GALICIA_WEBHOOK_SECRET=tu_secret
GALICIA_SANDBOX=true  # false en producción
GALICIA_API_URL=https://sandbox.galicia.com/api  # cambiar en prod

# OCA ePak
OCA_USUARIO=test@oca.com.ar  # cambiar en producción
OCA_CLAVE=123456  # cambiar en producción
OCA_CUIT=30-53625919-4  # TU CUIT en producción
OCA_NUMERO_CUENTA=111757/001  # TU cuenta en producción
OCA_API_URL=http://webservice.oca.com.ar/ePak_Tracking_TEST/  # quitar _TEST en prod
OCA_SANDBOX=true  # false en producción

# Configuración OCA
OCA_DIRECCION_ORIGEN_CALLE=Tu calle 123
OCA_DIRECCION_ORIGEN_CP=1234
OCA_DIRECCION_ORIGEN_CIUDAD=Tu ciudad
OCA_DIRECCION_ORIGEN_PROVINCIA=Tu provincia
OCA_DIRECCION_ORIGEN_TELEFONO=1234567890
```

---

## ⚠️ Diferencias Críticas con Plan OCA Original

### 1. **Ubicación del Código**

**❌ Plan OCA Original:**
```
frontend/src/services/oca/
```

**✅ Plan Maestro:**
```
app/api/oca/          # API Routes (endpoints)
lib/oca/              # Lógica compartida
```

### 2. **Flujo de Llamadas**

**❌ Plan OCA Original:**
```
Frontend → OCA API directamente
```

**✅ Plan Maestro:**
```
Frontend → Tu API (/api/oca/cotizar) → OCA API
```

### 3. **Prioridad de Implementación**

**❌ Plan OCA Original:**
```
1. Conectar frontend a Supabase
2. Checkout
3. OCA
```

**✅ Plan Maestro:**
```
1. Infraestructura + Deploy
2. Conectar Supabase
3. Checkout
4. Galicia (urgente)
5. OCA
```

### 4. **Gestión de Credenciales**

**❌ Plan OCA Original:**
```
.env.local en el proyecto
```

**✅ Plan Maestro:**
```
Vercel Dashboard (encriptado, por entorno)
```

---

## 🎯 Próximos Pasos Inmediatos

### Esta Semana (Prioridad Crítica)

1. **Registrar dominio en Hostinger** (1 hora)
2. **Crear repositorio en GitHub** (30 min)
3. **Instalar Node.js + Next.js** (1 hora)
4. **Migrar código a Next.js** (2 días)
5. **Deploy inicial en Vercel** (1 hora)

### Próxima Semana

6. **Conectar Supabase** (1 día)
7. **Checkout básico** (2 días)
8. **Webhook Galicia** (2 días)

### Tercera Semana

9. **Integración OCA completa** (4 días)
10. **Testing y refinamiento** (2 días)
11. **Go live** (1 día)

---

## 📋 Checklist de Verificación Final

Antes de considerar el proyecto completo:

### Infraestructura
- [ ] Dominio activo y apuntando a Vercel
- [ ] HTTPS funcionando sin errores
- [ ] Deploy automático desde GitHub
- [ ] Variables de entorno configuradas (dev, staging, prod)
- [ ] Logs accesibles en Vercel

### Backend
- [ ] Todos los API routes respondiendo correctamente
- [ ] Supabase conectado y funcional
- [ ] Manejo de errores implementado
- [ ] Validaciones en todos los endpoints

### Galicia NAVE
- [ ] Webhook recibe notificaciones
- [ ] Validación de firma funcionando
- [ ] Actualiza órdenes correctamente
- [ ] Sandbox testeado completamente
- [ ] URLs proporcionadas a Galicia

### OCA ePak
- [ ] Cotización devuelve precios reales
- [ ] Sucursales se listan correctamente
- [ ] Creación de envío funciona
- [ ] Tracking muestra estado
- [ ] Etiquetas se generan (en prod)

### Frontend
- [ ] Catálogo muestra productos desde DB
- [ ] Carrito funciona
- [ ] Checkout completo funcional
- [ ] Formularios validados
- [ ] Responsive design

### Testing
- [ ] Flujo completo probado
- [ ] Edge cases manejados
- [ ] Errores se muestran al usuario
- [ ] Performance aceptable
- [ ] SEO básico implementado

---

## 🆘 Si Te Atascas

### Problemas Comunes

**Error al deployar en Vercel:**
- Revisa logs de build en Vercel
- Verifica que `next.config.js` esté correcto
- Asegura que todas las dependencias estén en `package.json`

**Supabase no conecta:**
- Verifica variables de entorno en Vercel
- Asegura que las API keys sean correctas
- Revisa permisos en Supabase Dashboard

**OCA API falla:**
- Verifica que uses credenciales de TEST primero
- Revisa que el XML generado sea válido
- Consulta documentación de OCA

**Webhook Galicia no recibe:**
- Verifica que la URL sea pública (deployada)
- Revisa logs en Vercel → Functions
- Asegura que el endpoint responde POST

### Recursos

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Plan Galicia NAVE**: Ver PDF adjunto
- **Plan OCA**: Ver PLAN_INTEGRACION_OCA.md

---

## 📝 Notas Finales

### Sobre el Nuevo Flujo de Trabajo

**Ya no trabajas en local como entorno principal**. Tu nueva dinámica:

1. Trabajas en Antigravity (como editor)
2. Commiteas cambios a GitHub
3. Vercel despliega automáticamente
4. Pruebas en Preview Deployments
5. Mergeas a `main` cuando esté listo
6. Producción se actualiza automáticamente

Ver **Sección 11 del Plan Galicia NAVE (PDF)** para más detalles.

### Sobre las Credenciales

- **Sandbox primero, siempre**: Desarrolla con credenciales de test
- **Producción al final**: Solo cuando TODO esté probado
- **Nunca en el código**: Siempre en variables de entorno
- **Un entorno a la vez**: No mezcles sandbox y producción

### Sobre los Tiempos

Los tiempos son estimados para una persona trabajando full-time. Ajusta según tu disponibilidad:

- **Full-time**: 3 semanas
- **Part-time (4h/día)**: 6 semanas
- **Weekend only**: 2-3 meses

---

**Preparado por**: Claude  
**Fecha**: 13 de Febrero 2026  
**Versión**: 1.0  
**Próxima revisión**: Post Fase 7 (producción)
