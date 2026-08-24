# Tercera opción de envío — retiro en mano

> **Estado: IMPLEMENTADO el 2026-08-22.** Este documento queda como registro del
> diagnóstico. Lo que se construyó difiere en un punto: Naza eligió que la opción sea
> **visible para todos**, no gateada. Ver `src/lib/envios.ts` y `tests/tipos-envio.test.ts`.

## El problema

Un conocido quiere comprar por la web pero pasa a buscar la pieza, así que no debería
pagar envío. Hoy el checkout ofrece exactamente dos opciones, las dos de OCA, las dos
cotizadas contra la API: `puerta_puerta` y `sucursal`.

## Veredicto

**Viable y más chico de lo que parece: 5 archivos, ~60–90 min, sin migración.**
El riesgo no está en el tamaño sino en *dónde* cae uno de los cinco cambios.

---

## Lo que ya está a favor

**No hace falta migración.** `ordenes.tipo_envio` es TEXT libre: se verificó contra
`pg_constraint` que **no existe ningún CHECK** sobre la tabla. Un tercer valor entra sin
tocar la base.

```sql
-- devolvió [] el 2026-08-21
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.ordenes'::regclass and contype = 'c';
```

Valor propuesto: **`'retiro_local'`** (consistente con el snake_case de `puerta_puerta`).

---

## El gotcha que importa

`src/app/api/webhooks/nave/route.ts:322` — cuando NAVE confirma el pago, el webhook
**crea el envío de OCA solo**:

```js
if (!ocaCheck?.id_orden_retiro_oca) {
    const ocaResult = await crearEnvioOCA(externalPaymentId, false);
```

Sin un guard, **una orden de retiro genera una etiqueta real de OCA y despacha un correo
a buscar el paquete.** Este es *el* cambio del feature; el resto es presentación.

```js
// Traer también tipo_envio en el select de arriba
if (orden.tipo_envio === 'retiro_local') {
    console.log('[webhook/nave] ⏭️ Retiro en mano — no se crea envío OCA:', externalPaymentId);
} else if (!ocaCheck?.id_orden_retiro_oca) {
    ...
}
```

---

## Los cinco puntos de cambio

| # | Archivo | Línea | Qué |
|---|---------|-------|-----|
| 1 | `public/js/start.js` (`cargarOpcionesEnvioOCA`) | ~4193 | Agregar la 3ª opción después del loop que arma las de OCA (~15 líneas) |
| 2 | `public/js/start.js` | 3997 | `selectedEnvio.value === 'domicilio' ? 'puerta_puerta' : 'sucursal'` → mapa de 3 |
| 3 | **`src/app/api/webhooks/nave/route.ts`** | **322** | **Guard: saltear OCA si es retiro** ← el crítico |
| 4 | `src/lib/email.ts` | 221 | Tercer caso en el ternario de `tipoEnvio` |
| 5 | `public/js/start.js` | 3280 | Ídem, en el detalle de la orden en `/cuenta` |

### Sobre los ternarios (4 y 5)

Los dos están escritos como `tipo_envio === 'sucursal' ? A : B`. Un ternario tiene dos
ramas: **cualquier valor que no sea `'sucursal'` cae en la rama "domicilio"**. Con
`retiro_local` en la base, el mail de confirmación le diría al conocido que se lo mandan
a la casa. Hay que convertirlos en `switch` o en un mapa.

### Sobre la validación de sucursal

`start.js:3941` sólo exige elegir sucursal cuando el valor es `'sucursal'`. No hay que
tocarlo: `retiro_local` lo saltea solo.

---

## Cómo gatillarlo (que no se lo lleve cualquiera)

Una opción visible que diga "retiro sin cargo" se la lleva todo el mundo. Cuatro caminos,
de menos a más control:

- **(a) Flag por URL** — `?retiro=1`, persistido en `sessionStorage`. ~10 líneas.
  Lo menos invasivo. Adivinable, pero para amigos alcanza.
- **(b) Allowlist de emails** — env var `RETIRO_EMAILS_PERMITIDOS`; la opción aparece si
  el mail del Step 1 matchea. **Recomendada:** control real, complejidad casi igual.
- **(c) Código / palabra clave** en el Step 2 que revela la opción.
- **(d) Cero código** — que compre normal y se le devuelve el envío por afuera.

Si se va por **(b)**, la comprobación tiene que ser **server-side** (un endpoint que
responda si el mail está habilitado), no un array en `start.js`: el front es público.

---

## El agujero que hay que cerrar en el mismo movimiento

`src/app/api/ordenes/[id]/route.ts:215` toma `precio_envio` **del browser, sin validarlo
contra la cotización de OCA**:

```js
const { tipo_envio, precio_envio, id_sucursal_oca, operativa_oca } = body;
```

Y `crear-pago` recalcula el subtotal desde el catálogo (bien) pero suma
`costo_envio_centavos` tal cual (mal).

**Consecuencia: hoy, sin este feature, cualquiera puede mandar `precio_envio: 0` y
llevarse el envío gratis.** El agujero ya existe — el feature no lo crea, pero lo vuelve
descubrible.

Al implementar el retiro conviene cerrarlo en el mismo commit: validar el precio contra
la cotización guardada, con `retiro_local` como **único caso legítimo de 0**.

> Va como **P0 pre-go-live de forma independiente**, se haga o no el retiro.

---

## Checklist de implementación

- [ ] E2E del camino de compra **pasado** (precondición)
- [ ] Elegir mecanismo de gating (recomendado: **b**, allowlist server-side)
- [ ] Guard en el webhook de NAVE (#3) + test que lo cubra
- [ ] Los dos ternarios a `switch` (#4, #5)
- [ ] 3ª opción en el checkout (#1, #2)
- [ ] Validar `precio_envio` contra la cotización en el PATCH
- [ ] Test: orden `retiro_local` pagada **no** genera `id_orden_retiro_oca`
- [ ] Test: `precio_envio: 0` con `tipo_envio` de OCA se rechaza
- [ ] Probar una compra de retiro punta a punta en sandbox
- [ ] `npm test` · `npm run lint` · `npm run build`
