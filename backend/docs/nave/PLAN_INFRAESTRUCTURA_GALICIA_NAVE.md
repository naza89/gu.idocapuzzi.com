# PLAN DE INFRAESTRUCTURA
## Integración NAVE - Banco Galicia

**Creado**: 13 de Febrero, 2026  
**Estado**: De Local a Producción Profesional

---

## ÍNDICE

1. [Situación Actual y Objetivo](#1-situación-actual-y-objetivo)
2. [Análisis de Backend: ¿Qué te falta?](#2-análisis-de-backend-qué-te-falta)
3. [Arquitectura Recomendada](#3-arquitectura-recomendada)
4. [Plan de Implementación Paso a Paso](#4-plan-de-implementación-paso-a-paso)
5. [Registro y Configuración de Dominio (Hostinger)](#5-registro-y-configuración-de-dominio-hostinger)
6. [Deployment: Herramientas y Estrategia](#6-deployment-herramientas-y-estrategia)
7. [Estructura de Proyecto y Organización](#7-estructura-de-proyecto-y-organización)
8. [Webhooks de Galicia NAVE](#8-webhooks-de-galicia-nave)
9. [Sandbox vs Producción](#9-sandbox-vs-producción)
10. [HTTPS y Variables de Entorno](#10-https-y-variables-de-entorno)
11. [Nuevo Flujo de Trabajo](#11-nuevo-flujo-de-trabajo)
12. [GitHub y Deploy Automático](#12-github-y-deploy-automático)
13. [Checklist Final de Verificación](#13-checklist-final-de-verificación)

---

## 1. SITUACIÓN ACTUAL Y OBJETIVO

### Situación Actual

- **Entorno**: Desarrollo local únicamente
- **Backend**: Mínimo/inexistente - solo Supabase para base de datos
- **Frontend**: Antigravity con carpeta PÁGINA WEB
- **Dominio**: No registrado
- **Deploy**: Ninguno
- **Problema inmediato**: Galicia necesita URLs de webhook (sandbox y producción)

### Objetivo

Construir una infraestructura profesional que permita:

- Integrar el sistema de pagos NAVE de Banco Galicia
- Tener URLs públicas funcionales para webhooks
- Separar correctamente entornos de sandbox y producción
- Establecer un flujo de desarrollo profesional
- Dejar de trabajar en local como entorno principal
- Implementar deploy automático desde GitHub

---

## 2. ANÁLISIS DE BACKEND: ¿QUÉ TE FALTA?

### Componentes Backend Necesarios

Actualmente solo tienes Supabase (base de datos). Para una aplicación de e-commerce con integración de pagos necesitas los siguientes componentes:

| Componente | Estado Actual | Qué Necesitas |
|------------|---------------|---------------|
| **API Server** | ❌ No existe | Node.js/Express o Next.js API Routes |
| **Endpoints REST** | ❌ No existe | CRUD para productos, órdenes, clientes |
| **Webhooks** | ❌ No existe | Endpoints para recibir notificaciones de Galicia |
| **Autenticación** | ⚠️ Solo Supabase Auth | Middleware de autenticación en rutas |
| **Validación** | ❌ No existe | Validación de requests y datos |
| **Logging** | ❌ No existe | Sistema de logs para debugging |
| **Variables de Entorno** | ⚠️ Local .env | Gestión segura en producción |
| **Error Handling** | ❌ No existe | Manejo centralizado de errores |

---

## 3. ARQUITECTURA RECOMENDADA

La arquitectura más adecuada para tu caso es una arquitectura **Full-Stack con Next.js**, que te permite tener frontend y backend en un mismo proyecto, simplificando el deployment y mantenimiento.

### Stack Tecnológico Recomendado

| Capa | Tecnología | Por Qué |
|------|------------|---------|
| **Frontend** | Next.js 14+ (App Router) | React con Server Components, SEO optimizado |
| **Backend** | Next.js API Routes | Endpoints en el mismo proyecto, serverless |
| **Base de Datos** | Supabase (PostgreSQL) | Ya lo tienes configurado, excelente opción |
| **Hosting** | Vercel | Deployment automático, HTTPS gratis, zero-config |
| **Dominio** | Hostinger | Registro de dominio y DNS |
| **Control de Versiones** | GitHub | Source control y trigger para deploys |
| **Variables de Entorno** | Vercel Dashboard | Gestión segura de secrets |

### ¿Por qué Next.js?

- **Todo en uno**: Frontend y backend en el mismo proyecto
- **API Routes**: Creas endpoints simplemente creando archivos en /app/api/
- **Vercel**: Deploy automático optimizado (Vercel creó Next.js)
- **TypeScript**: Soporte nativo para código más robusto
- **Server Components**: Mejor performance y SEO
- **Simplificado**: No necesitas configurar servidor Express por separado

---

## 4. PLAN DE IMPLEMENTACIÓN PASO A PASO

Este plan está diseñado para ejecutarse en orden secuencial. Cada fase depende de la anterior.

### FASE 1: Preparación (1-2 días)

**Objetivo**: Tener claridad y documentación

- Registrar dominio en Hostinger
- Crear repositorio en GitHub
- Migrar código a estructura Next.js
- Configurar Supabase para producción

### FASE 2: Backend Development (2-3 días)

**Objetivo**: Construir el backend que necesitas

- Crear API routes básicas (productos, órdenes)
- Implementar endpoints de webhook para Galicia
- Configurar middleware de autenticación
- Implementar validación de requests

### FASE 3: Deployment Setup (1 día)

**Objetivo**: Infraestructura deployada y funcionando

- Conectar GitHub con Vercel
- Configurar variables de entorno en Vercel
- Configurar dominio en Vercel
- Crear entornos sandbox y producción

### FASE 4: Testing e Integración (2 días)

**Objetivo**: Verificar que todo funciona correctamente

- Probar webhooks de Galicia en sandbox
- Verificar flujo completo de pago
- Testing de errores y edge cases
- Documentar endpoints y flujos

### FASE 5: Go Live (1 día)

**Objetivo**: Lanzamiento a producción

- Deploy a producción
- Proporcionar URLs finales a Galicia
- Monitoreo de primeras transacciones
- Establecer nuevo flujo de trabajo

---

## 5. REGISTRO Y CONFIGURACIÓN DE DOMINIO (HOSTINGER)

### Paso a Paso: Registro en Hostinger

#### 1. Ir a Hostinger y Buscar Dominio

- Accede a www.hostinger.com.ar o www.hostinger.com
- En la página principal, utiliza el buscador de dominios
- Ingresa el nombre que deseas (ej: tutienda.com)
- Verifica disponibilidad

#### 2. Seleccionar Dominio

- Si está disponible, añádelo al carrito
- Elige la extensión (.com, .com.ar, .shop, etc.)
- **Recomendación**: .com es la más universal
- Duración: empieza con 1 año, puedes renovar después

#### 3. Completar Compra

- Crea una cuenta en Hostinger o inicia sesión
- **NO necesitas comprar hosting**, solo el dominio
- Completa el pago
- Guarda el correo de confirmación

#### 4. Acceder al Panel de Dominios

- Inicia sesión en Hostinger
- Ve a 'Dominios' en el menú lateral
- Selecciona tu dominio recién comprado
- Haz clic en 'Administrar'

#### 5. Configurar DNS para Vercel

- En el panel del dominio, busca 'DNS / Name Servers'
- Selecciona 'Use Custom Nameservers'
- Añade los nameservers de Vercel:
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`
- Guarda cambios (pueden tardar 24-48h en propagarse)

> **IMPORTANTE**: La propagación de DNS puede tardar de 1 a 48 horas. Durante este tiempo, tu dominio puede no funcionar correctamente. Esto es normal. Puedes verificar el estado en dnschecker.org

---

## 6. DEPLOYMENT: HERRAMIENTAS Y ESTRATEGIA

### ¿Por Qué Vercel?

Para tu caso específico, **Vercel es la opción ideal** por las siguientes razones:

- **Zero Configuration**: Deploy de Next.js con un clic, sin configuración
- **HTTPS Automático**: Certificado SSL gratis y renovación automática
- **Preview Deployments**: Cada push a GitHub genera una URL de preview
- **Edge Network**: Tu app se distribuye globalmente, muy rápida
- **Variables de Entorno**: Gestión fácil y segura desde el dashboard
- **Gratis para empezar**: El plan gratuito es generoso para proyectos pequeños
- **Monitoreo**: Logs y analytics incluidos
- **Serverless**: Las API routes son serverless (no pagas por servidor ocioso)

### Comparación con Alternativas

| Opción | Pros | Contras | ¿Usar? |
|--------|------|---------|--------|
| **Vercel** | Perfecto para Next.js, HTTPS gratis, zero-config | Serverless limita algunos casos de uso | ✅ SÍ |
| **Railway** | Bueno para apps backend, soporte PostgreSQL | Requiere más configuración | ⚠️ Alternativa |
| **Netlify** | Similar a Vercel, buen frontend | Menos optimizado para Next.js | ⚠️ Alternativa |
| **VPS (DigitalOcean)** | Control total, más barato a escala | Requiere DevOps, mantenimiento | ❌ NO para empezar |
| **Heroku** | Fácil de usar | Muy caro, plan gratis eliminado | ❌ NO |

> **RECOMENDACIÓN**: Usa Vercel para tu proyecto. Es la solución más profesional y simple para Next.js + Supabase. Podrás estar en producción en menos de 1 hora.

---

## 7. ESTRUCTURA DE PROYECTO Y ORGANIZACIÓN

### Estructura de Carpetas Next.js

Migrarás de tu estructura actual de Antigravity a una estructura Next.js 14 con App Router. Aquí está la organización recomendada:

```
mi-tienda/
├── app/
│   ├── api/                      # 🔴 BACKEND (tus endpoints)
│   │   ├── productos/
│   │   │   └── route.ts          # GET/POST /api/productos
│   │   ├── ordenes/
│   │   │   └── route.ts          # GET/POST /api/ordenes
│   │   ├── webhooks/
│   │   │   └── galicia/
│   │   │       └── route.ts      # POST /api/webhooks/galicia
│   │   └── health/
│   │       └── route.ts          # GET /api/health (verificación)
│   │
│   ├── (pages)/                  # 🟢 FRONTEND (tus páginas)
│   │   ├── page.tsx              # Página principal
│   │   ├── productos/
│   │   │   └── page.tsx          # Catálogo
│   │   ├── carrito/
│   │   │   └── page.tsx          # Carrito de compras
│   │   └── checkout/
│   │       └── page.tsx          # Proceso de pago
│   │
│   ├── layout.tsx                # Layout principal
│   └── globals.css               # Estilos globales
│
├── components/                   # Componentes reutilizables
│   ├── ProductCard.tsx
│   ├── Header.tsx
│   └── Footer.tsx
│
├── lib/                          # Utilidades y configuración
│   ├── supabase.ts               # Cliente de Supabase
│   ├── galicia.ts                # Helper para API de Galicia
│   └── validations.ts            # Validaciones
│
├── types/                        # TypeScript types
│   ├── producto.ts
│   ├── orden.ts
│   └── webhook.ts
│
├── .env.local                    # Variables locales (NO commitear)
├── .env.example                  # Template de variables
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 8. WEBHOOKS DE GALICIA NAVE

### ¿Qué es un Webhook?

Un webhook es un endpoint HTTP que Galicia llamará automáticamente cuando ocurran eventos importantes (pago aprobado, rechazado, cancelado, etc.). Tu backend debe:

- Estar siempre disponible (por eso necesitas deployment)
- Responder rápidamente (< 5 segundos)
- Validar que la request viene realmente de Galicia
- Actualizar el estado de la orden en tu base de datos
- Devolver un status 200 OK para confirmar recepción

### Implementación del Webhook

```typescript
// app/api/webhooks/galicia/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear el body
    const body = await request.json();
    
    // 2. Validar la firma (Galicia envía un header de seguridad)
    const signature = request.headers.get('x-galicia-signature');
    if (!validarFirma(body, signature)) {
      return NextResponse.json(
        { error: 'Firma inválida' }, 
        { status: 401 }
      );
    }
    
    // 3. Extraer datos del evento
    const { event_type, order_id, status, payment_data } = body;
    
    // 4. Actualizar la orden en Supabase
    const supabase = createClient();
    await supabase
      .from('ordenes')
      .update({ 
        status: status,
        payment_data: payment_data,
        updated_at: new Date()
      })
      .eq('id', order_id);
    
    // 5. Lógica adicional según el evento
    if (event_type === 'payment.approved') {
      // Enviar email de confirmación
      // Actualizar inventario
      // Etc.
    }
    
    // 6. Responder OK
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('Error en webhook:', error);
    return NextResponse.json(
      { error: 'Error interno' }, 
      { status: 500 }
    );
  }
}

function validarFirma(body: any, signature: string): boolean {
  // Implementar validación según docs de Galicia
  const secret = process.env.GALICIA_WEBHOOK_SECRET;
  // ... lógica de validación
  return true;
}
```

### URLs que proporcionarás a Galicia

- **Sandbox**: `https://tudominio.com/api/webhooks/galicia`
- **Producción**: `https://tudominio.com/api/webhooks/galicia`

(Misma URL, diferenciadas por las variables de entorno en cada entorno Vercel)

---

## 9. SANDBOX VS PRODUCCIÓN

### Estrategia de Entornos

Vercel te permite crear múltiples entornos fácilmente. La estrategia recomendada:

| Entorno | Branch Git | URL | Variables | Uso |
|---------|------------|-----|-----------|-----|
| **Development** | develop | proyecto-dev.vercel.app | GALICIA_SANDBOX=true | Testing diario |
| **Staging/Sandbox** | staging | sandbox.tudominio.com | GALICIA_SANDBOX=true | Pruebas con Galicia |
| **Production** | main | tudominio.com | GALICIA_SANDBOX=false | Sitio live |

### Configuración de Variables por Entorno

En el dashboard de Vercel, para cada entorno configura:

**Variables Comunes:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Variables Específicas de Galicia:**
- `GALICIA_API_KEY` (diferente para sandbox y producción)
- `GALICIA_MERCHANT_ID`
- `GALICIA_WEBHOOK_SECRET`
- `GALICIA_SANDBOX` (true/false)
- `GALICIA_API_URL` (https://sandbox.galicia.com vs https://api.galicia.com)

> **IMPORTANTE**: NUNCA pongas credenciales reales en el código. Siempre usa variables de entorno. Vercel las encripta y gestiona de forma segura.

---

## 10. HTTPS Y VARIABLES DE ENTORNO

### HTTPS Automático con Vercel

Vercel maneja HTTPS automáticamente:

- **Certificado SSL gratis**: Let's Encrypt, renovación automática
- **HTTP → HTTPS redirect**: Automático, no requiere configuración
- **Dominio custom**: SSL también se aplica a tu dominio personalizado
- **Edge network**: SSL terminado en el edge, latencia mínima

> **Acción requerida**: NINGUNA. Vercel lo hace todo automáticamente cuando conectas tu dominio. En 5 minutos tendrás https://tudominio.com funcionando.

### Gestión de Variables de Entorno

**Mejores Prácticas:**

#### 1. Archivo .env.local (desarrollo)
- Solo para tu máquina local
- Añádelo a .gitignore
- NO lo commitees NUNCA

#### 2. Archivo .env.example (template)
- SÍ lo commiteas
- Contiene las keys pero sin valores
- Sirve de documentación

#### 3. Vercel Dashboard (producción)
- Configura variables en Settings → Environment Variables
- Puedes tener valores diferentes por entorno (Production, Preview, Development)
- Encriptadas y seguras

#### 4. Nomenclatura
- `NEXT_PUBLIC_*` → Visible en frontend (URLs públicas, etc.)
- Sin prefijo → Solo backend (API keys, secrets)

**Ejemplo .env.example:**

```bash
# .env.example (commitear esto)
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
SUPABASE_SERVICE_ROLE_KEY=
GALICIA_API_KEY=
GALICIA_MERCHANT_ID=
GALICIA_WEBHOOK_SECRET=
GALICIA_SANDBOX=true
```

---

## 11. NUEVO FLUJO DE TRABAJO

### Cambios en tu Dinámica de Desarrollo

Una vez desplegado, tu flujo de trabajo cambia completamente. Dejas de trabajar en local como entorno principal y adoptas un flujo profesional:

### ANTES (Local)

1. Abres Antigravity
2. Modificas archivos en carpeta PÁGINA WEB
3. Guardas y refrescas navegador
4. No hay versionado
5. No hay backup automático
6. No hay entorno de producción

### DESPUÉS (Profesional)

#### 1. Clonas el repositorio desde GitHub

```bash
git clone https://github.com/tuusuario/mi-tienda.git
cd mi-tienda
npm install
```

#### 2. Trabajas en una rama de desarrollo

```bash
git checkout -b feature/nueva-funcionalidad
```

#### 3. Desarrollas localmente (pero ya no es el entorno principal)

```bash
npm run dev  # localhost:3000
```
- Ves cambios en tiempo real
- Pero NO es donde pruebas seriamente

#### 4. Commiteas cambios

```bash
git add .
git commit -m "Añadida funcionalidad X"
```

#### 5. Pusheas a GitHub

```bash
git push origin feature/nueva-funcionalidad
```

#### 6. Vercel automáticamente:
- Detecta el push
- Genera un Preview Deployment
- Te da una URL: `https://mi-tienda-abc123.vercel.app`
- Puedes probar en un entorno real ANTES de mergear

#### 7. Si todo funciona, mergeas a develop/staging

```bash
git checkout develop
git merge feature/nueva-funcionalidad
git push origin develop
```
→ Vercel despliega automáticamente a `sandbox.tudominio.com`

#### 8. Cuando estés listo para producción

```bash
git checkout main
git merge develop
git push origin main
```
→ Vercel despliega automáticamente a `tudominio.com`

> **CAMBIO CLAVE**: Ya no trabajas en local como entorno de verdad. Local es solo para desarrollo rápido. Tus pruebas reales las haces en los Preview Deployments y en Staging. Producción siempre está protegida y solo se actualiza con merges controlados.

### Antigravity en el Nuevo Flujo

**¿Cómo cambia tu uso de Antigravity?**

- **Antes**: Antigravity era tu entorno de desarrollo completo
- **Ahora**: Antigravity es tu editor/IDE, pero el proyecto está en GitHub

**Nuevo workflow con Antigravity:**

1. Abre Antigravity
2. Abre tu proyecto clonado desde GitHub (carpeta mi-tienda/)
3. Modifica archivos normalmente
4. Desde terminal integrado de Antigravity:
   - `npm run dev` (para ver cambios localmente)
   - `git add/commit/push` (para subir cambios)
5. Vercel detecta el push y despliega automáticamente

**Estructura recomendada:**
```
/Users/tu_usuario/Projects/
  └── mi-tienda/          ← Tu proyecto Next.js (clonado de GitHub)
      ├── app/
      ├── components/
      ├── .git/           ← Control de versiones
      └── package.json
```

---

## 12. GITHUB Y DEPLOY AUTOMÁTICO

### Configuración de GitHub

#### 1. Crear Repositorio en GitHub

- Ve a github.com y crea un nuevo repositorio
- Nombre: mi-tienda (o el que prefieras)
- Visibilidad: Private (recomendado para proyecto comercial)
- NO inicialices con README (ya tienes código local)

#### 2. Conectar Repositorio Local

Desde tu carpeta del proyecto:

```bash
git init
git add .
git commit -m 'Initial commit'
git branch -M main
git remote add origin https://github.com/tuusuario/mi-tienda.git
git push -u origin main
```

#### 3. Crear Branches de Trabajo

```bash
git checkout -b develop
git push -u origin develop

git checkout -b staging
git push -u origin staging
```

Ahora tienes 3 ramas:
- `main` → Producción
- `staging` → Sandbox/Testing
- `develop` → Desarrollo activo

#### 4. Proteger Main Branch

En GitHub:
- Ve a Settings → Branches
- Add rule para 'main'
- Marca 'Require pull request reviews before merging'
- Esto previene pushes directos a producción

### Configuración de Vercel

#### 1. Conectar Vercel con GitHub

- Ve a vercel.com e inicia sesión (usa tu cuenta de GitHub)
- Click en 'Add New' → 'Project'
- Autoriza a Vercel a acceder a tus repos
- Selecciona tu repositorio mi-tienda

#### 2. Configurar el Proyecto

Vercel detectará automáticamente que es Next.js:
- Framework Preset: Next.js (auto-detectado)
- Root Directory: ./ (raíz del proyecto)
- Build Command: next build (auto)
- Output Directory: .next (auto)
- Install Command: npm install (auto)

#### 3. Configurar Variables de Entorno

Antes de deployar, añade tus variables:
- Click en 'Environment Variables'
- Añade una por una (copia desde tu .env.local)
- Selecciona a qué entornos aplican (Production, Preview, Development)
- Para empezar, márcalas todas en los tres entornos

#### 4. Deploy Inicial

- Click en 'Deploy'
- Vercel clonará el repo, instalará dependencias, buildará y desplegará
- En 2-3 minutos tendrás tu primera URL: `mi-tienda.vercel.app`
- Verifica que funciona correctamente

#### 5. Conectar Dominio Custom

En el proyecto de Vercel:
- Settings → Domains
- Add Domain → tudominio.com
- Vercel te dará instrucciones de DNS
- Como ya configuraste nameservers de Vercel en Hostinger, solo espera propagación
- En 1-24 horas, `tudominio.com` apuntará a tu app con HTTPS

#### 6. Configurar Production Branch

- Settings → Git
- Production Branch: main
- Vercel deployará a producción solo cuando pushees a 'main'
- Otros branches generan Preview Deployments

### Flujo de Deploy Automático

Una vez configurado, cada push a GitHub triggerea un deploy automático:

**Push a 'develop' o cualquier branch:**
- Vercel genera un Preview Deployment
- URL única: `mi-tienda-git-nombre-rama.vercel.app`
- Puedes compartir esta URL para testing
- No afecta a producción

**Push a 'staging':**
- Deploy a `sandbox.tudominio.com` (si configuraste subdomain)
- Entorno de testing con datos de sandbox de Galicia
- URLs de webhook apuntan aquí para pruebas

**Push/Merge a 'main':**
- Deploy automático a `tudominio.com` (producción)
- Este es tu sitio live
- Credenciales reales de Galicia
- URLs de webhook de producción

**Cada deploy incluye:**
- Build logs completos
- Detección automática de errores
- Rollback instantáneo si algo falla
- URL única para cada commit
- Inspector de código y performance

---

## 13. CHECKLIST FINAL DE VERIFICACIÓN

### Antes de Proporcionar URLs a Galicia

Antes de dar las URLs de webhook a Galicia, verifica que TODO funcione correctamente:

- [ ] **Dominio Registrado** - tudominio.com activo y apuntando a Vercel
- [ ] **HTTPS Funcionando** - https://tudominio.com carga sin errores de certificado
- [ ] **Proyecto Desplegado** - Next.js app corriendo en Vercel
- [ ] **Variables de Entorno** - Todas configuradas en Vercel para cada entorno
- [ ] **Supabase Conectado** - Frontend y backend pueden leer/escribir a DB
- [ ] **API Routes Funcionan** - GET /api/productos devuelve datos correctos
- [ ] **Webhook Endpoint Creado** - /api/webhooks/galicia responde POST requests
- [ ] **Webhook Validación** - Valida firmas de Galicia correctamente
- [ ] **Webhook Actualiza DB** - Recibir webhook actualiza orden en Supabase
- [ ] **Entorno Sandbox** - staging.tudominio.com (o develop) usa credenciales sandbox
- [ ] **Entorno Producción** - tudominio.com usa credenciales de producción
- [ ] **GitHub Conectado** - Pushes generan deploys automáticos
- [ ] **Logs Funcionan** - Puedes ver logs en Vercel dashboard
- [ ] **Error Handling** - Webhook maneja errores sin crashear
- [ ] **Testing Manual** - Simular POST al webhook y verificar comportamiento

### URLs FINALES PARA GALICIA

**Entorno Sandbox (testing):**
- URL Webhook: `https://staging.tudominio.com/api/webhooks/galicia`
- o `https://tudominio.com/api/webhooks/galicia` (con variables SANDBOX=true)

**Entorno Producción:**
- URL Webhook: `https://tudominio.com/api/webhooks/galicia`
- Variables de entorno SANDBOX=false
- Credenciales de producción de Galicia

---

## RESUMEN EJECUTIVO

### Stack Final Recomendado

- **Frontend + Backend**: Next.js 14 (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Dominio**: Hostinger
- **Control de Versiones**: GitHub
- **SSL/HTTPS**: Automático (Vercel)

### Arquitectura

- **Monorepo**: Todo en un proyecto Next.js
- **API Routes** para backend (serverless)
- **Supabase** para persistencia
- **Variables de entorno** por ambiente

### Entornos

- **Development**: develop branch → preview deployments
- **Staging**: staging branch → sandbox.tudominio.com
- **Production**: main branch → tudominio.com

### Flujo de Trabajo

1. Desarrollas en local (Antigravity + Git)
2. Commiteas y pusheas a GitHub
3. Vercel despliega automáticamente
4. Pruebas en Preview/Staging
5. Merge a main cuando esté listo
6. Producción se actualiza automáticamente

### Tiempo Estimado de Implementación

- Registro de dominio: 30 minutos
- Setup de GitHub: 30 minutos
- Migración a Next.js: 1-2 días
- Desarrollo de webhooks: 1 día
- Configuración de Vercel: 1 hora
- Testing y ajustes: 1-2 días
- **TOTAL: 4-6 días**

### Costos Mensuales Estimados

- **Dominio (Hostinger)**: ~$10-15/año = $1.25/mes
- **Vercel**: $0 (plan gratuito suficiente para empezar)
- **Supabase**: $0 (plan gratuito hasta 500MB DB)
- **GitHub**: $0 (repos privados gratis)
- **TOTAL: ~$1-2/mes** (ultra económico para empezar)

**Cuando crezcas:**
- Vercel Pro: $20/mes (más funciones, más usage)
- Supabase Pro: $25/mes (más storage, backups)

---

## PRÓXIMOS PASOS INMEDIATOS

### Esta Semana (Prioridad Alta)

1. **Registrar dominio en Hostinger** (30 min)
   → Sigue la sección 5 de este plan

2. **Crear repositorio en GitHub** (15 min)
   → Repositorio privado, nombre descriptivo

3. **Instalar Node.js y crear proyecto Next.js** (1 hora)
   ```bash
   npx create-next-app@latest mi-tienda
   ```
   → Configuración: TypeScript, App Router, Tailwind

4. **Migrar código existente a Next.js** (1-2 días)
   → Componentes a /components
   → Páginas a /app
   → Estilos a Tailwind/CSS modules

5. **Crear endpoints básicos** (1 día)
   → /api/productos
   → /api/ordenes
   → /api/health

6. **Implementar webhook de Galicia** (1 día)
   → /api/webhooks/galicia
   → Validación de firma
   → Actualización de Supabase

7. **Configurar Vercel y deployar** (2 horas)
   → Conectar GitHub
   → Configurar variables de entorno
   → Primer deploy

8. **Configurar dominio en Vercel** (30 min + espera DNS)
   → Añadir tudominio.com
   → Esperar propagación (1-24h)

9. **Testing completo en Sandbox** (1 día)
   → Probar webhook con datos de prueba
   → Verificar flujo completo

10. **Proporcionar URLs a Galicia** (15 min)
    → Email con URLs de sandbox y producción
    → Documentación de respuestas esperadas

### Próximas 2 Semanas (Consolidación)

- Establecer nuevo flujo de trabajo con Git
- Documentar procesos internos
- Configurar monitoreo y alertas
- Crear tests automatizados básicos
- Optimizar performance
- SEO básico

---

## SOPORTE Y RECURSOS

### Documentación Oficial

- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **GitHub**: https://docs.github.com

### Comunidades

- **Next.js Discord**: https://nextjs.org/discord
- **Vercel Community**: https://github.com/vercel/vercel/discussions
- **Supabase Discord**: https://discord.supabase.com

### Si Necesitas Ayuda

1. Revisa este plan paso a paso
2. Consulta la documentación oficial
3. Busca en Stack Overflow
4. Pregunta en las comunidades de Discord
5. Si es específico de Galicia, contacta a tu representante

### Tips para Resolver Problemas

- **Logs son tu mejor amigo**: Vercel Dashboard → Functions → Logs
- **Variables de entorno**: 90% de problemas vienen de aquí, verifica siempre
- **CORS errors**: Configura correctamente headers en API routes
- **Build failures**: Revisa logs de build en Vercel
- **Webhook no recibe requests**: Verifica URL, método HTTP (POST), headers

### Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build para producción (testing local)
npm run build
npm start

# Linting
npm run lint

# Ver logs de Vercel (CLI)
npx vercel logs

# Rollback a versión anterior
npx vercel rollback
```

### Recordatorio Final

Este plan está diseñado para ser ejecutado paso a paso. No saltes fases. Cada una depende de la anterior. Si te atascas en algún punto, resuelve ese problema antes de continuar.

**¡Éxito con la implementación! 🚀**

---

**Preparado por**: Claude  
**Fecha**: 13 de Febrero, 2026  
**Versión**: 1.0
