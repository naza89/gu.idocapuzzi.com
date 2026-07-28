---
description: Testea endpoints de la API local o de producción. Uso: /test-endpoint [health|oca-cotizar|oca-sucursales|nave-pago|webhook-nave] [local|prod]
---

Testea el endpoint indicado. Si no se especifica entorno, usá `local` (localhost:3000).

## Endpoints disponibles

### health
```
GET /api/health
```

### oca-cotizar
```
POST /api/oca/cotizar
Body: { "cpDestino": "1425", "pesoKg": 0.4, "volumenM3": 0.003, "cantidadPaquetes": 1, "valorDeclarado": 50000 }
```

### oca-sucursales
```
GET /api/oca/sucursales?cp=1425
```

### nave-pago
```
POST /api/nave/crear-pago
Body: { "external_payment_id": "test-manual-001", "total_ars": 100, "cart_items": [{"name": "Test", "quantity": 1, "price": 100}] }
```

### webhook-nave (simula notificación)
```
POST /api/webhooks/nave
Body: { "payment_id": "test-id", "payment_check_url": "https://api-sandbox.ranty.io/test", "external_payment_id": "test-orden-001" }
```

## Instrucciones

1. Corré el comando curl correspondiente
2. Mostrá: HTTP status, body del response formateado como JSON, y tiempo de respuesta si está disponible
3. Si el status no es 200/201, explicá qué puede estar fallando
4. Para `nave-pago`: recordar que el sandbox de NAVE es inestable — un error puede ser del lado de ellos

## URLs base
- Local: `http://localhost:3000`
- Prod: `https://xn--gidocapuzzi-thb.com` (o `https://guidocapuzzi.com` para salud del dominio)
