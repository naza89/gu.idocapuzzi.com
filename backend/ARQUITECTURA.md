# Plan de Arquitectura Backend - GÜIDO CAPUZZI

**Objetivo**: Diseñar el modelo de datos y flujo lógico para inventario, órdenes y estados, integrando Supabase como backend.

---

## Modelo de Datos

### Diagrama de Relaciones

```
┌─────────────────┐       ┌──────────────────────┐
│    productos    │       │  variantes_producto  │
├─────────────────┤       ├──────────────────────┤
│ id (UUID) PK    │◄──────│ producto_id (FK)     │
│ nombre          │       │ id (UUID) PK         │
│ titulo          │       │ sku (UNIQUE)         │
│ categoria       │       │ color                │
│ descripcion     │       │ colorway             │
│ precio_centavos │       │ talle                │
│ imagenes[]      │       │ stock                │
│ activo          │       │ one_of_one           │
│ created_at      │       └──────────────────────┘
└─────────────────┘                │
                                   │
┌─────────────────┐       ┌────────▼─────────────┐
│    clientes     │       │    items_orden       │
├─────────────────┤       ├──────────────────────┤
│ id (UUID) PK    │       │ variante_id (FK)     │
│ email           │       │ orden_id (FK)        │
│ nombre          │       │ nombre_producto      │
│ apellido        │       │ cantidad             │
│ telefono        │       │ precio_unitario      │
└────────┬────────┘       └──────────────────────┘
         │                         ▲
         │                         │
         ▼                         │
┌─────────────────┐       ┌────────┴─────────────┐
│direcciones_envio│       │      ordenes         │
├─────────────────┤       ├──────────────────────┤
│ cliente_id (FK) │       │ cliente_id (FK)      │
│ direccion       │◄──────│ direccion_envio_id   │
│ ciudad          │       │ estado               │
│ provincia       │       │ total_centavos       │
│ codigo_postal   │       │ numero_orden         │
└─────────────────┘       └──────────────────────┘
```

### Flujo de Estados de Orden

```
[INICIO]
    │
    ▼
┌─────────────┐  Checkout Step 1
│  pendiente  │◄─────────────────
└──────┬──────┘
       │ Usuario selecciona envío
       ▼
┌──────────────────┐
│ envio_calculado  │
└────────┬─────────┘
         │ Redirigido a NAVE
         ▼
┌─────────────────┐
│ pago_pendiente  │──────┬──────────────┐
└────────┬────────┘      │              │
         │               │ Timeout      │
         │ Pago OK       ▼              │
         │        ┌──────────┐          │
         │        │cancelado │          │
         │        └──────────┘          │
         ▼                              │
    ┌─────────┐                         │
    │ pagado  │◄────────────────────────┘
    └────┬────┘     (reintentar)
         │ Admin procesa
         ▼
   ┌───────────┐
   │preparando │
   └─────┬─────┘
         │ Tracking generado
         ▼
    ┌─────────┐
    │ enviado │
    └────┬────┘
         │ Confirmación
         ▼
   ┌───────────┐
   │ entregado │
   └───────────┘
```

---

## Inventario Completo

| Producto | Total | Variantes |
|----------|-------|-----------|
| Remera Logo Güido Oversized | 100 | Negro/Blanco, Negro/Rojo, Blanco/Negro |
| Remera Afligida Boxy | 100 | Negra, Blanca, Navy |
| Musculosa Doble Símbolo | 100 | Negro, Blanco |
| Remera Baby Tee Mujer | 100 | Blanca, Negra, Navy |
| Remera Manga Larga Termal | 100 | Blanco, Negro |
| Jean Indigo Regular | 24 | Indigo |
| Jean Indigo Suelto | 10 | Indigo |
| Jean Negro Regular | 10 | Negro |
| Bermuda Patchwork | 10 | Indigo/Negro |
| Bermuda Double Knee | 36 | Negro |
| Jean Suela Roja 1/1 | 1 | Azul Lavado (ARCHIVO) |

**Total general: ~591 unidades**

---

## Supabase: Guía Rápida

### API Keys
- **anon key**: Pública, para frontend. Siempre sujeta a RLS.
- **service_role key**: Secreta, bypass RLS. Solo backend.

### RLS (Row Level Security)
Políticas que definen quién puede leer/escribir cada fila.
- Productos: lectura pública
- Órdenes: crear cualquiera, leer solo propias

### Edge Functions
Funciones serverless para:
- Validar stock antes de crear orden
- Recibir webhooks de pagos
- Calcular costos de envío
