# Templates de Supabase Auth

Estos dos HTML se pegan **a mano** en el panel de Supabase. No los deploya nadie: no
están en el código, los sirve Supabase Auth cuando manda el mail.

## Dónde va cada uno

| Archivo | Panel de Supabase |
|---------|-------------------|
| `01-confirm-signup.html` | Authentication → Emails → **Confirm signup** |
| `02-reset-password.html` | Authentication → Emails → **Reset password** |

Se pega el archivo **entero** (desde `<!DOCTYPE html>` hasta `</html>`) en el campo
*Message body*, con el editor en modo HTML — no en el WYSIWYG, que reescribe el markup.

## La variable

Los dos usan `{{ .ConfirmationURL }}`, en dos lugares cada uno:

1. El `href` del botón.
2. El texto plano del pie ("si el botón no funciona, copiá y pegá este enlace").

**Es Go template, no Handlebars: los espacios adentro de las llaves importan.**
`{{ .ConfirmationURL }}` funciona; `{{.ConfirmationURL}}` también, pero
`{{ ConfirmationURL }}` (sin el punto) no.

> ⚠️ La versión que estaba en `email-preview.html` tenía `href="#"` y una URL de muestra
> (`https://güidocapuzzi.com/auth/confirm?token=xxxxxxxx`). Si se pegaba así, **el botón
> quedaba muerto**. Estos archivos ya tienen la variable real.

## Tipografía

Sin `@font-face`, igual que los mails transaccionales de `src/lib/email.ts`. Gmail,
Outlook y Yahoo lo strippean, y servir Helvetica Neue desde el bucket público chocaría
con la licencia de Monotype que sigue pendiente.

El stack es exactamente este, y el orden importa:

```
'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif
```

- **macOS / iOS (Apple Mail):** `HelveticaNeue-CondensedBold` es el nombre PostScript de
  la condensada real del sistema. Engancha.
- **Windows / Gmail / Outlook:** ese nombre no matchea nada, así que cae limpio a
  **Arial Narrow**, que es condensada de verdad.

### ⚠️ No agregar `'Helvetica Neue Condensed'` ni `'Helvetica Neue'` a la cadena

Parecen inofensivos como "un paso más de fallback", pero **en Windows resuelven** — sea
porque la fuente está instalada (la máquina de Naza) o por la tabla de sustitución de
Windows, que mapea nombres tipo Helvetica a Arial. El efecto es que **se comen el
fallback**: nunca se llega a `Arial Narrow` y el texto sale en ancho normal.

Medido sobre el mismo `<h1>`, mismo texto y mismos estilos:

| Cadena | Ancho de "CONTRASEÑA." |
|--------|------------------------|
| Con `'Helvetica Neue Condensed'` adelante | 423px ← igual que Arial |
| Solo `'HelveticaNeue-CondensedBold'` | **349px** |
| Forzando `'Arial Narrow'` | **349px** ✅ idéntico |
| Forzando `Arial` | 423px |

El nombre PostScript es seguro justamente porque **no** matchea nada en Windows.

Para ver la tipografía real de la marca, abrí `email-preview.html` en la raíz del repo:
tiene la LT Std embebida y un botón para alternar entre "fuente real" y "como lo ve
Gmail". Esa fuente vive **sólo** en el preview, no en estos archivos.

## Alineación

El bloque de 600px va **centrado** en la ventana, pero **el texto adentro va a la
izquierda** — igual que en el preview.

El centrado se hace con `<td align="center">`, que es lo que entiende Outlook
(`margin:0 auto` en un div lo ignora el motor de Word). Pero `align="center"` en un
`<td>` **propaga `text-align:center` a todos los descendientes**, así que hay que
anularlo explícitamente con `text-align:left` en el div del bloque.

**Si se saca ese `text-align:left`, se centra todo el contenido** — pasó en la primera
versión de estos archivos.

## Logo

`mail-logo-registrado.png` en el bucket `assets` — PNG 1000×116 rasterizado de
`public/assets/brand/logo-guido-registrado.svg`.

**No cambiarlo por el `.svg`:** Gmail lo strippea y Outlook no lo soporta.

Reemplazó a `mail_smtp.png` (2026-08-21), que era el logo dibujado en **Univers** y había
quedado del cambio de marca del 2026-08-06. El viejo sigue en el bucket por las dudas;
se puede borrar una vez confirmado que todo anda.

## Mobile

Los dos llevan un `@media screen and (max-width: 480px)` que baja el título de 56px a
30px y el padding de 48 a 24. Sin eso, "CONTRASEÑA." se desborda en pantallas de 375px.

Verificado sin scroll horizontal a 320, 375 y 520px de ancho.

## Los otros mails

Estos dos son los únicos que manda Supabase. Los transaccionales (confirmación de compra
y estados de envío de OCA) los manda **Resend** desde `src/lib/email.ts` y se deployan
con el código — esos no se tocan acá.
