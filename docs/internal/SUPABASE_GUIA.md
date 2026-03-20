# Guía de Supabase - GÜIDO CAPUZZI

Esta guía te explica paso a paso cómo configurar la base de datos en Supabase.

---

## ¿Qué es Supabase?

Supabase es un servicio que te da:
- **Base de datos PostgreSQL**: Donde guardaremos productos, órdenes, clientes
- **API automática**: Cada tabla genera endpoints REST automáticamente
- **Autenticación**: Sistema de login (lo usaremos después)
- **Row Level Security (RLS)**: Reglas que definen quién puede ver/modificar cada fila

---

## Paso 1: Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Click en "Start your project" o "Dashboard"
3. Loguearte con GitHub
4. Click en "New Project"
5. Completar:
   - **Name**: `guido-capuzzi`
   - **Database Password**: Guardala en lugar seguro (la necesitarás)
   - **Region**: South America (São Paulo) - más cercano a Argentina
6. Click "Create new project"
7. Esperar ~2 minutos mientras se crea

---

## Paso 2: Entender el Panel de Supabase

Una vez creado el proyecto, verás el Dashboard. Las secciones importantes:

| Sección | Para qué sirve |
|---------|----------------|
| **Table Editor** | Ver y editar datos de las tablas (como Excel) |
| **SQL Editor** | Ejecutar código SQL directamente |
| **Authentication** | Gestionar usuarios y login |
| **API Docs** | Ver cómo llamar a tu API desde el frontend |
| **Settings > API** | Encontrar tus API Keys |

---

## Paso 3: Obtener tus API Keys

1. Ir a **Settings** (ícono de engranaje) > **API**
2. Verás dos keys importantes:

### anon (public) key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Es **pública** - va en el código del frontend
- Sujeta a las reglas de RLS
- Usala para leer productos, crear órdenes

### service_role key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Es **SECRETA** - NUNCA en el frontend
- Ignora todas las reglas de RLS
- Solo para Edge Functions o backend

También verás:
- **Project URL**: `https://xxxxx.supabase.co`
- Esto es la base de tu API

---

## Paso 4: Ejecutar los Scripts SQL

Ahora vamos a crear las tablas. 

1. Ir a **SQL Editor** en el menú izquierdo
2. Click en **+ New query**
3. Pegar el contenido del archivo `01_crear_tablas.sql`
4. Click en **Run** (o Ctrl+Enter)
5. Verificar que diga "Success. No rows returned" (está bien, estamos creando estructura)
6. Repetir para cada archivo SQL en orden numérico

---

## Siguiente Paso

Una vez leído esto, abrí el archivo `01_crear_tablas.sql` y seguí las instrucciones.
