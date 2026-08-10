# Resolución de `variante_id` en el checkout

> Fase 0 del plan de rediseño. Corregido el 2026-08-10.

## El problema

`checkout-logic.js` resolvía qué fila de `variantes_producto` corresponde a cada
item del carrito buscando por **`colorway` + `talle`**, con `.limit(1)`:

```js
// ANTES — roto
await supabase.from('variantes_producto')
  .select('id')
  .eq('colorway', item.colorway)
  .eq('talle', item.size)
  .limit(1);
```

La consulta no incluía el producto. Eso asume que un colorway es único en toda la
tabla, y no lo es: el colorway sólo distingue variantes **dentro de** un producto.
La restricción UNIQUE de la tabla es `(producto_id, colorway, talle)`, no
`(colorway, talle)`.

Medido sobre el catálogo real, **13 de las 21 combinaciones de colorway+talle eran
ambiguas**, alcanzando a **52 de las 68 variantes**:

| colorway | talle | filas que matcheaban | productos en conflicto |
|-|-|-:|-|
| `NEGRO` | XS/S/M/L | **6** | bermuda double knee · jean italiano · musculosa · afligida · baby tee · termal |
| `BLANCO` | XS/S/M/L | **4** | musculosa · afligida · baby tee · termal |
| `1/1` | M | **4** | las 4 piezas de INTERVENCIONES |
| `ÍNDIGO` | XS/S/M/L | **2** | jean japonés regular · jean japonés suelto |

Sólo quedaban a salvo los colorways de por sí únicos: `NAVY`, `ÍNDIGO/NEGRO`,
`BLANCO LOGO NEGRO`, `NEGRO LOGO BLANCO`, `NEGRO LOGO ROJO`.

### Qué rompía

`.limit(1)` devolvía **la primera fila que Postgres encontrara**, sin orden
determinístico. Consecuencias de comprar, por ejemplo, una musculosa negra talle M:

1. `items_orden.variante_id` podía apuntar a la baby tee negra M.
2. El webhook de NAVE llama a `decrement_stock()` con ese `variante_id` → **se
   descontaba stock del producto equivocado**.
3. El stock real de lo vendido nunca bajaba → sobreventa silenciosa.

No fallaba nunca de forma visible: la orden se creaba bien, el email salía bien y
el envío de OCA se generaba bien. El único síntoma era el inventario derivando.

## La solución

El item del carrito ahora lleva su **SKU completo**, que es `UNIQUE` en
`variantes_producto` y por lo tanto identifica una y sólo una fila.

**`start.js`** — cada entrada del catálogo declara un prefijo de SKU (producto +
colorway); el talle lo completa al agregar al carrito:

```js
{ slug: 'musculosa-negra', sku: 'MUS-DSB-NEG', ... }

// addToCart()
sku: product.sku ? `${product.sku}-${size}` : null   // -> 'MUS-DSB-NEG-S'
```

**`checkout-logic.js`** — busca por SKU, con un fallback:

```js
if (item.sku) {
  // camino normal: SKU es UNIQUE -> una fila exacta
  .from('variantes_producto').select('id').eq('sku', item.sku)
}
if (!varianteId) {
  // fallback para carritos viejos en sessionStorage, de antes del SKU.
  // Incluye el producto, así que tampoco puede cruzarse.
  .select('id, productos!inner(nombre)')
  .eq('productos.nombre', item.name)
  .eq('colorway', item.colorway)
  .eq('talle', item.size)
}
```

Si ninguno resuelve, se loguea `console.error` (antes era un `warn` que pasaba
desapercibido) y `variante_id` queda en `null` — la orden se crea igual, pero no
se descuenta stock de nadie. Es el modo de fallo seguro.

## Invariante a mantener

**El prefijo de SKU de `start.js` tiene que coincidir con `variantes_producto.sku`
de Supabase.** Si se agrega un producto o un colorway, hay que darlo de alta en los
dos lados. La verificación es una consulta:

```sql
-- ninguna fila = todo alineado
select v.sku from variantes_producto v
where v.sku not in ( /* los SKU que arma el front */ );
```

Los 21 prefijos actuales se verificaron uno por uno contra la base el 2026-08-10.

## Pendiente relacionado

`obtenerStock()` y `obtenerVariantesStock()` en `supabase-config.js` siguen
buscando el producto por `nombre` y están exportadas a `window`, pero **no las
llama nadie**. Si en algún momento se cablea el stock en la PDP (mostrar agotados,
deshabilitar talles sin stock), conviene pasarlas también a SKU en vez de nombre.
